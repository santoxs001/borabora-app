"""Cliente ONVIF mínimo: só o necessário para reiniciar a câmera.

Evita dependências pesadas (onvif-zeep/zeep) montando o SOAP na mão com
WS-Security UsernameToken (PasswordDigest), que é o que as câmeras
Yoosee/Gwell (CA-1003) aceitam.
"""

from __future__ import annotations

import base64
import hashlib
import os
import re
from datetime import datetime, timezone

import httpx

NS_DEVICE = "http://www.onvif.org/ver10/device/wsdl"
NS_WSSE = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
NS_WSU = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
TIPO_DIGEST = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest"
TIPO_NONCE = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary"


class ErroOnvif(Exception):
    pass


def _cabecalho_seguranca(usuario: str, senha: str) -> str:
    if not usuario:
        return ""
    nonce = os.urandom(16)
    criado = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    digest = base64.b64encode(
        hashlib.sha1(nonce + criado.encode("utf-8") + senha.encode("utf-8")).digest()
    ).decode("ascii")
    return (
        f'<s:Header><Security s:mustUnderstand="1" xmlns="{NS_WSSE}">'
        f"<UsernameToken><Username>{_escapa(usuario)}</Username>"
        f'<Password Type="{TIPO_DIGEST}">{digest}</Password>'
        f'<Nonce EncodingType="{TIPO_NONCE}">{base64.b64encode(nonce).decode("ascii")}</Nonce>'
        f'<Created xmlns="{NS_WSU}">{criado}</Created>'
        f"</UsernameToken></Security></s:Header>"
    )


def _escapa(texto: str) -> str:
    return (
        str(texto)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _envelope(corpo: str, usuario: str, senha: str) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">'
        f"{_cabecalho_seguranca(usuario, senha)}"
        f"<s:Body>{corpo}</s:Body></s:Envelope>"
    )


async def _chamar(url: str, acao: str, corpo: str, usuario: str, senha: str, timeout: float) -> str:
    cabecalhos = {
        "Content-Type": f'application/soap+xml; charset=utf-8; action="{acao}"',
    }
    async with httpx.AsyncClient(timeout=timeout) as cliente:
        try:
            resposta = await cliente.post(
                url, content=_envelope(corpo, usuario, senha).encode("utf-8"), headers=cabecalhos
            )
        except httpx.HTTPError as exc:
            raise ErroOnvif(f"falha de rede no ONVIF ({exc.__class__.__name__}): {exc}") from exc

    texto = resposta.text or ""
    if resposta.status_code >= 400 or "Fault" in texto:
        motivo = re.search(r"<(?:\w+:)?Text(?:\s[^>]*)?>(.*?)</", texto, re.S)
        detalhe = motivo.group(1).strip() if motivo else f"HTTP {resposta.status_code}"
        raise ErroOnvif(f"a câmera recusou o comando ONVIF: {detalhe}")
    return texto


async def reiniciar(url: str, usuario: str, senha: str, timeout: float = 10.0) -> str:
    """Envia SystemReboot. Devolve a mensagem da câmera."""
    corpo = f'<SystemReboot xmlns="{NS_DEVICE}"/>'
    texto = await _chamar(url, f"{NS_DEVICE}/SystemReboot", corpo, usuario, senha, timeout)
    msg = re.search(r"<(?:\w+:)?Message(?:\s[^>]*)?>(.*?)</", texto, re.S)
    return msg.group(1).strip() if msg else "reboot aceito"


async def data_hora(url: str, usuario: str, senha: str, timeout: float = 10.0) -> bool:
    """GetSystemDateAndTime: teste leve para saber se o ONVIF responde."""
    corpo = f'<GetSystemDateAndTime xmlns="{NS_DEVICE}"/>'
    await _chamar(url, f"{NS_DEVICE}/GetSystemDateAndTime", corpo, usuario, senha, timeout)
    return True
