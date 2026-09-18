#!/usr/bin/env python3
"""Câmera ONVIF falsa - só para o modo de teste.

Responde aos comandos ONVIF que o watchdog usa (GetSystemDateAndTime,
GetDeviceInformation e SystemReboot) sem nenhuma dependência externa.

Quando recebe SystemReboot, além de responder OK, tenta simular o reinício de
verdade: derruba os caminhos RTSP do mediamtx por alguns segundos (via API
local do mediamtx) e depois devolve. Assim dá para ver no painel a câmera
caindo e voltando sozinha.

Variáveis de ambiente:
    ONVIF_PORTA        porta HTTP do serviço (padrão 5000)
    ONVIF_USUARIO      se definido, exige WS-Security com esse usuário
    ONVIF_SENHA        senha usada na conferência do digest
    MEDIAMTX_API       ex.: http://127.0.0.1:9997 (habilita a simulação)
    MEDIAMTX_CAMINHOS  caminhos a derrubar (padrão "onvif1,onvif2")
    REBOOT_SEGUNDOS    quanto tempo a câmera falsa fica fora (padrão 25)
"""

from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import re
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORTA = int(os.environ.get("ONVIF_PORTA", "5000"))
USUARIO = os.environ.get("ONVIF_USUARIO", "")
SENHA = os.environ.get("ONVIF_SENHA", "")
MEDIAMTX_API = os.environ.get("MEDIAMTX_API", "").rstrip("/")
CAMINHOS = [c.strip() for c in os.environ.get("MEDIAMTX_CAMINHOS", "onvif1,onvif2").split(",") if c.strip()]
REBOOT_SEGUNDOS = int(os.environ.get("REBOOT_SEGUNDOS", "25"))
NOME = os.environ.get("CAMERA_NOME", "camera-falsa")

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)-7s onvif-stub | %(message)s", datefmt="%d/%m/%Y %H:%M:%S"
)
log = logging.getLogger("onvif-stub")

NS_DEVICE = "http://www.onvif.org/ver10/device/wsdl"
ESTADO = {"reboots": 0, "ultimo_reboot": None, "iniciado_em": time.time()}


def _resposta_soap(corpo: str) -> bytes:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" '
        f'xmlns:tds="{NS_DEVICE}" xmlns:tt="http://www.onvif.org/ver10/schema">'
        f"<s:Body>{corpo}</s:Body></s:Envelope>"
    ).encode("utf-8")


def _falha(motivo: str) -> bytes:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><s:Fault>'
        "<s:Code><s:Value>s:Sender</s:Value></s:Code>"
        f"<s:Reason><s:Text>{motivo}</s:Text></s:Reason>"
        "</s:Fault></s:Body></s:Envelope>"
    ).encode("utf-8")


def _campo(xml: str, nome: str) -> str:
    """Conteúdo de um elemento XML, ignorando prefixo de namespace.

    O padrão precisa exigir '>' ou espaço logo após o nome: senão
    <UsernameToken> casaria com a busca por <Username>.
    """
    achado = re.search(rf"<(?:\w+:)?{nome}(?:\s[^>]*)?>(.*?)</", xml, re.S)
    return achado.group(1).strip() if achado else ""


def _confere_seguranca(xml: str) -> bool:
    """Valida o UsernameToken/PasswordDigest do jeito que a câmera real faria."""
    if not USUARIO:
        return True
    usuario = _campo(xml, "Username")
    senha = _campo(xml, "Password")
    nonce = _campo(xml, "Nonce")
    criado = _campo(xml, "Created")
    if not (usuario and senha and nonce and criado):
        return False
    if usuario != USUARIO:
        return False
    try:
        bruto = base64.b64decode(nonce)
    except (ValueError, TypeError):
        return False
    esperado = base64.b64encode(hashlib.sha1(bruto + criado.encode() + SENHA.encode()).digest()).decode()
    return esperado == senha


def _patch_mediamtx(caminho: str, corpo: dict) -> None:
    url = f"{MEDIAMTX_API}/v3/config/paths/patch/{caminho}"
    req = urllib.request.Request(
        url, data=json.dumps(corpo).encode(), headers={"Content-Type": "application/json"}, method="PATCH"
    )
    with urllib.request.urlopen(req, timeout=5) as resposta:
        resposta.read()


def _simular_reboot() -> None:
    """Derruba os caminhos RTSP por alguns segundos, como um reboot de verdade."""
    if not MEDIAMTX_API:
        log.info("SystemReboot apenas registrado (MEDIAMTX_API não configurada)")
        return
    originais: dict[str, str] = {}
    try:
        with urllib.request.urlopen(f"{MEDIAMTX_API}/v3/config/paths/list", timeout=5) as resp:
            for item in json.loads(resp.read()).get("items", []):
                if item.get("name") in CAMINHOS:
                    originais[item["name"]] = item.get("runOnDemand", "")
        for caminho in CAMINHOS:
            _patch_mediamtx(caminho, {"runOnDemand": f"sleep {REBOOT_SEGUNDOS + 5}"})
        log.warning("câmera falsa '%s' reiniciando: sem vídeo por %ss", NOME, REBOOT_SEGUNDOS)
        time.sleep(REBOOT_SEGUNDOS)
        for caminho, comando in originais.items():
            _patch_mediamtx(caminho, {"runOnDemand": comando})
        log.info("câmera falsa '%s' voltou depois do reboot", NOME)
    except (urllib.error.URLError, OSError, ValueError) as exc:
        log.warning("não consegui simular o reboot no mediamtx: %s", exc)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, formato: str, *args) -> None:  # silencia o log padrão
        return

    def _envia(self, dados: bytes, status: int = 200, tipo: str = "application/soap+xml; charset=utf-8") -> None:
        self.send_response(status)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(dados)))
        self.end_headers()
        self.wfile.write(dados)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.startswith("/estado"):
            corpo = json.dumps({**ESTADO, "camera": NOME}).encode()
            self._envia(corpo, tipo="application/json")
            return
        self._envia(b"camera ONVIF falsa - Buffet Bora Bora\n", tipo="text/plain; charset=utf-8")

    def do_POST(self) -> None:  # noqa: N802
        tamanho = int(self.headers.get("Content-Length") or 0)
        xml = self.rfile.read(tamanho).decode("utf-8", "ignore") if tamanho else ""
        acao = (self.headers.get("Content-Type") or "") + " " + xml

        if "SystemReboot" in acao:
            if not _confere_seguranca(xml):
                log.warning("SystemReboot recusado: autenticação ONVIF inválida")
                self._envia(_falha("Sender not authorized"), status=401)
                return
            ESTADO["reboots"] += 1
            ESTADO["ultimo_reboot"] = time.time()
            log.warning("SystemReboot recebido (total: %s)", ESTADO["reboots"])
            threading.Thread(target=_simular_reboot, daemon=True).start()
            self._envia(_resposta_soap("<tds:SystemRebootResponse><tds:Message>Rebooting in 5 seconds</tds:Message></tds:SystemRebootResponse>"))
            return

        if "GetSystemDateAndTime" in acao:
            agora = datetime.now(timezone.utc)
            self._envia(
                _resposta_soap(
                    "<tds:GetSystemDateAndTimeResponse><tds:SystemDateAndTime>"
                    "<tt:DateTimeType>Manual</tt:DateTimeType><tt:UTCDateTime>"
                    f"<tt:Time><tt:Hour>{agora.hour}</tt:Hour><tt:Minute>{agora.minute}</tt:Minute>"
                    f"<tt:Second>{agora.second}</tt:Second></tt:Time>"
                    f"<tt:Date><tt:Year>{agora.year}</tt:Year><tt:Month>{agora.month}</tt:Month>"
                    f"<tt:Day>{agora.day}</tt:Day></tt:Date>"
                    "</tt:UTCDateTime></tds:SystemDateAndTime></tds:GetSystemDateAndTimeResponse>"
                )
            )
            return

        if "GetDeviceInformation" in acao:
            self._envia(
                _resposta_soap(
                    "<tds:GetDeviceInformationResponse>"
                    "<tds:Manufacturer>Bora Bora (simulada)</tds:Manufacturer>"
                    "<tds:Model>CA-1003-FAKE</tds:Model>"
                    "<tds:FirmwareVersion>0.0.1</tds:FirmwareVersion>"
                    f"<tds:SerialNumber>{NOME}</tds:SerialNumber>"
                    "<tds:HardwareId>teste</tds:HardwareId>"
                    "</tds:GetDeviceInformationResponse>"
                )
            )
            return

        self._envia(_falha("ActionNotSupported"), status=400)


def main() -> None:
    servidor = ThreadingHTTPServer(("0.0.0.0", PORTA), Handler)
    log.info("câmera ONVIF falsa '%s' ouvindo na porta %s", NOME, PORTA)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
