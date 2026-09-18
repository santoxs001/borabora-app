"""Configuração do painel (tudo por variável de ambiente / .env)."""

from __future__ import annotations

import base64
import binascii
import os
import secrets
from dataclasses import dataclass


def _hash(nome: str) -> str:
    """Lê o hash bcrypt do ambiente.

    Aceita também <NOME>_B64 (o mesmo hash em base64), útil no Windows, onde o
    "$" do bcrypt costuma ser comido pelo Docker/PowerShell.
    """
    direto = os.environ.get(nome, "").strip()
    if direto:
        return direto
    codificado = os.environ.get(f"{nome}_B64", "").strip()
    if codificado:
        try:
            return base64.b64decode(codificado).decode("utf-8").strip()
        except (binascii.Error, UnicodeDecodeError, ValueError):
            return ""
    return ""


def _int(nome: str, padrao: int) -> int:
    try:
        return int(os.environ.get(nome, padrao))
    except (TypeError, ValueError):
        return padrao


@dataclass(frozen=True)
class Config:
    cameras_yaml: str = os.environ.get("CAMERAS_YAML", "/projeto/cameras.yaml")
    pasta_gravacoes: str = os.environ.get("PAINEL_PASTA_GRAVACOES", "/gravacoes")

    frigate_url: str = os.environ.get("FRIGATE_URL", "http://frigate:5000").rstrip("/")
    watchdog_url: str = os.environ.get("WATCHDOG_URL", "http://watchdog:8080").rstrip("/")

    # Endereço do go2rtc como o NAVEGADOR enxerga (o vídeo ao vivo vai direto
    # do go2rtc para o navegador). Vazio = usa o host da própria página.
    go2rtc_publico: str = os.environ.get("PAINEL_GO2RTC_PUBLICO", "").rstrip("/")

    segredo: str = os.environ.get("PAINEL_SEGREDO", "") or secrets.token_urlsafe(32)
    horas_sessao: int = _int("PAINEL_HORAS_SESSAO", 12)

    admin_usuario: str = os.environ.get("PAINEL_ADMIN_USUARIO", "admin")
    admin_hash: str = _hash("PAINEL_ADMIN_HASH")
    visualizador_usuario: str = os.environ.get("PAINEL_VISUALIZADOR_USUARIO", "")
    visualizador_hash: str = _hash("PAINEL_VISUALIZADOR_HASH")

    fuso: str = os.environ.get("TZ", "America/Sao_Paulo")
    titulo: str = os.environ.get("PAINEL_TITULO", "Buffet Bora Bora")


CFG = Config()
