"""Conversa com o Frigate: lista de gravações e repasse (proxy) dos vídeos.

O navegador nunca fala direto com o Frigate: tudo passa pelo painel, que exige
login. Assim o Frigate pode ficar sem porta publicada na rede.
"""

from __future__ import annotations

import logging
from datetime import datetime, time as _time, timedelta
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx
from fastapi import HTTPException, Request
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask

from .config import CFG

log = logging.getLogger("painel.frigate")

# Vídeo pode demorar a começar; leitura longa, conexão curta.
_TIMEOUT = httpx.Timeout(connect=5.0, read=60.0, write=30.0, pool=10.0)
_cliente: httpx.AsyncClient | None = None

CABECALHOS_REPASSE = (
    "content-type", "content-length", "content-range", "accept-ranges",
    "cache-control", "etag", "last-modified", "content-encoding",
)


def cliente() -> httpx.AsyncClient:
    global _cliente
    if _cliente is None:
        _cliente = httpx.AsyncClient(base_url=CFG.frigate_url, timeout=_TIMEOUT)
    return _cliente


async def fechar() -> None:
    global _cliente
    if _cliente is not None:
        await _cliente.aclose()
        _cliente = None


def fuso() -> ZoneInfo:
    try:
        return ZoneInfo(CFG.fuso)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


def limites_do_dia(data: str) -> tuple[float, float]:
    """'2026-09-18' -> (inicio, fim) em timestamp, no fuso configurado."""
    try:
        dia = datetime.strptime(data, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Data inválida (use AAAA-MM-DD).") from exc
    tz = fuso()
    inicio = datetime.combine(dia, _time.min, tzinfo=tz)
    return inicio.timestamp(), (inicio + timedelta(days=1)).timestamp()


async def pegar(caminho: str, **params: Any) -> Any:
    try:
        resposta = await cliente().get(caminho, params=params or None)
        resposta.raise_for_status()
        return resposta.json()
    except httpx.HTTPError as exc:
        log.warning("Frigate indisponível em %s: %s", caminho, exc)
        raise HTTPException(status_code=503, detail="Gravador (Frigate) não respondeu.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Resposta inesperada do Frigate.") from exc


async def disponivel() -> bool:
    try:
        resposta = await cliente().get("/api/version", timeout=5)
        return resposta.status_code < 400
    except httpx.HTTPError:
        return False


async def eventos(camera: str, inicio: float, fim: float, limite: int = 200) -> list[dict[str, Any]]:
    dados = await pegar(
        "/api/events",
        camera=camera,
        after=inicio,
        before=fim,
        limit=limite,
        include_thumbnails=0,
    )
    saida = []
    for evento in dados if isinstance(dados, list) else []:
        fim_evento = evento.get("end_time") or evento.get("start_time")
        saida.append(
            {
                "id": evento.get("id"),
                "camera": evento.get("camera"),
                "objeto": evento.get("label"),
                "inicio": evento.get("start_time"),
                "fim": fim_evento,
                "duracao": round((fim_evento or 0) - (evento.get("start_time") or 0)),
                "tem_video": bool(evento.get("has_clip")),
                "tem_foto": bool(evento.get("has_snapshot")),
                "pontuacao": round((evento.get("data", {}) or {}).get("top_score", evento.get("top_score") or 0) * 100),
            }
        )
    saida.sort(key=lambda e: e["inicio"] or 0, reverse=True)
    return saida


async def horas_gravadas(camera: str, data: str) -> list[dict[str, Any]]:
    """Horas com gravação contínua no dia, a partir do resumo do Frigate."""
    dados = await pegar(f"/api/{camera}/recordings/summary", timezone=CFG.fuso)
    for dia in dados if isinstance(dados, list) else []:
        if str(dia.get("day")) != data:
            continue
        horas = []
        for hora in dia.get("hours", []):
            rotulo = str(hora.get("hour"))
            # O Frigate manda "13" ou "2026-09-18 13:00:00" conforme a versão.
            if len(rotulo) > 2:
                rotulo = rotulo[-8:-6] if ":" in rotulo else rotulo[:2]
            horas.append(
                {
                    "hora": rotulo.zfill(2),
                    "eventos": hora.get("events", 0),
                    "duracao": hora.get("duration", 0),
                }
            )
        horas.sort(key=lambda h: h["hora"])
        return horas
    return []


async def dias_com_gravacao(camera: str) -> list[str]:
    dados = await pegar(f"/api/{camera}/recordings/summary", timezone=CFG.fuso)
    dias = [str(d.get("day")) for d in (dados if isinstance(dados, list) else []) if d.get("day")]
    return sorted(dias, reverse=True)


async def repassar(request: Request, caminho: str) -> StreamingResponse:
    """Repassa um arquivo do Frigate mantendo suporte a Range (seek no vídeo)."""
    cabecalhos = {
        chave: valor
        for chave, valor in request.headers.items()
        if chave.lower() in ("range", "if-range", "accept", "accept-encoding")
    }
    requisicao = cliente().build_request("GET", caminho, headers=cabecalhos)
    try:
        resposta = await cliente().send(requisicao, stream=True)
    except httpx.HTTPError as exc:
        log.warning("falha ao buscar %s no Frigate: %s", caminho, exc)
        raise HTTPException(status_code=503, detail="Gravador (Frigate) não respondeu.") from exc

    if resposta.status_code >= 400:
        await resposta.aclose()
        raise HTTPException(status_code=resposta.status_code, detail="Gravação não encontrada.")

    saida = {k: v for k, v in resposta.headers.items() if k.lower() in CABECALHOS_REPASSE}
    return StreamingResponse(
        resposta.aiter_raw(),
        status_code=resposta.status_code,
        headers=saida,
        background=BackgroundTask(resposta.aclose),
    )
