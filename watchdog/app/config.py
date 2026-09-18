"""Configuração do watchdog (tudo por variável de ambiente)."""

from __future__ import annotations

import os
from dataclasses import dataclass


def _int(nome: str, padrao: int) -> int:
    try:
        return int(os.environ.get(nome, padrao))
    except (TypeError, ValueError):
        return padrao


@dataclass(frozen=True)
class Config:
    cameras_yaml: str = os.environ.get("CAMERAS_YAML", "/projeto/cameras.yaml")
    arquivo_estado: str = os.environ.get("WATCHDOG_ESTADO", "/dados/estado.json")

    intervalo: int = _int("WATCHDOG_INTERVALO", 60)            # segundos entre ciclos
    reiniciar_apos: int = _int("WATCHDOG_REINICIAR_APOS", 180)  # 3 min sem vídeo -> reboot
    espera_entre_reboots: int = _int("WATCHDOG_ESPERA_REBOOT", 600)
    max_reboots_hora: int = _int("WATCHDOG_MAX_REBOOTS_HORA", 3)

    timeout_tcp: int = _int("WATCHDOG_TIMEOUT_TCP", 4)
    timeout_ping: int = _int("WATCHDOG_TIMEOUT_PING", 3)
    timeout_ffprobe: int = _int("WATCHDOG_TIMEOUT_FFPROBE", 20)
    timeout_onvif: int = _int("WATCHDOG_TIMEOUT_ONVIF", 10)

    go2rtc_host: str = os.environ.get("GO2RTC_HOST", "go2rtc")
    go2rtc_api: int = _int("GO2RTC_PORTA_API", 1984)
    go2rtc_rtsp: int = _int("GO2RTC_PORTA_RTSP", 8554)

    usar_ffprobe: bool = os.environ.get("WATCHDOG_USAR_FFPROBE", "1") not in ("0", "false", "nao")
    max_eventos: int = _int("WATCHDOG_MAX_EVENTOS", 500)


CFG = Config()
