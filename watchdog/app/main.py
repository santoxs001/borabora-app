"""Watchdog das câmeras do Buffet Bora Bora.

A cada ciclo (60s por padrão) checa rede + vídeo de cada câmera. Se uma câmera
passar 3 minutos sem vídeo, manda um SystemReboot via ONVIF, registra tudo em
log e publica o estado numa API simples consumida pelo painel.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any

sys.path.insert(0, "/app")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi import FastAPI, HTTPException  # noqa: E402

from comum.cameras import Camera, ErroConfig, carregar  # noqa: E402

from . import onvif  # noqa: E402
from .checagens import checar  # noqa: E402
from .config import CFG  # noqa: E402
from .estado import Estado  # noqa: E402

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)-7s %(name)s | %(message)s",
    datefmt="%d/%m/%Y %H:%M:%S",
)
log = logging.getLogger("watchdog")

estado = Estado()
_cameras: list[Camera] = []
_erro_config: str = ""


def cameras_atuais() -> list[Camera]:
    """Relê o cameras.yaml a cada ciclo: adicionar câmera não exige rebuild."""
    global _cameras, _erro_config
    try:
        _cameras = carregar(CFG.cameras_yaml)
        _erro_config = ""
    except ErroConfig as exc:
        if str(exc) != _erro_config:
            _erro_config = str(exc)
            estado.registrar("-", "erro", f"cameras.yaml com problema: {exc}")
    return _cameras


def _pode_reiniciar(est, agora: float) -> tuple[bool, str]:
    # Conta a última TENTATIVA (mesmo malsucedida): sem isso, uma câmera que
    # recusa o ONVIF levaria um pedido de reboot a cada ciclo.
    ultima = max(filter(None, (est.ultimo_reinicio, est.ultima_tentativa_reinicio)), default=None)
    if ultima and agora - ultima < CFG.espera_entre_reboots:
        falta = int(CFG.espera_entre_reboots - (agora - ultima))
        return False, f"aguardando {falta}s desde a última tentativa de reinício"
    est.reinicios_recentes = [t for t in est.reinicios_recentes if agora - t < 3600]
    if len(est.reinicios_recentes) >= CFG.max_reboots_hora:
        return False, (
            f"limite de {CFG.max_reboots_hora} reinícios/hora atingido - "
            "provável problema de energia, Wi-Fi ou câmera queimada"
        )
    return True, ""


async def reiniciar_camera(cam: Camera, motivo: str) -> dict[str, Any]:
    est = estado.para_camera(cam.id, cam.nome, cam.local, cam.ip)
    agora = time.time()
    if not cam.onvif:
        estado.registrar(cam.id, "erro", "reinício ignorado: ONVIF desativado no cameras.yaml")
        return {"ok": False, "mensagem": "ONVIF desativado para esta câmera"}

    est.ultima_tentativa_reinicio = agora
    try:
        resposta = await onvif.reiniciar(cam.url_onvif, cam.usuario, cam.senha, CFG.timeout_onvif)
    except onvif.ErroOnvif as exc:
        estado.registrar(cam.id, "erro", f"falha ao reiniciar via ONVIF: {exc}")
        estado.salvar()
        return {"ok": False, "mensagem": str(exc)}

    est.reinicios += 1
    est.ultimo_reinicio = agora
    est.reinicios_recentes.append(agora)
    estado.registrar(cam.id, "reinicio", f"{motivo} - SystemReboot enviado ({resposta})")
    estado.salvar()
    return {"ok": True, "mensagem": resposta}


async def checar_camera(cam: Camera) -> None:
    est = estado.para_camera(cam.id, cam.nome, cam.local, cam.ip)
    agora = time.time()
    resultado = await checar(cam)

    est.ultima_checagem = agora
    est.detalhe = resultado.detalhe
    est.metodo = resultado.metodo
    est.ping_ok = resultado.ping_ok
    est.tcp_ok = resultado.tcp_ok

    if resultado.ok:
        if not est.online:
            fora = int(agora - est.ultima_queda) if est.ultima_queda else 0
            estado.registrar(cam.id, "recuperacao", f"voltou ao normal após {fora}s fora ({resultado.detalhe})")
        est.online = True
        est.ultimo_ok = agora
        est.falhas_seguidas = 0
        return

    est.falhas_seguidas += 1
    if est.online or est.ultima_queda is None:
        est.online = False
        est.ultima_queda = agora
        est.total_quedas += 1
        estado.registrar(cam.id, "queda", f"câmera sem vídeo: {resultado.detalhe}")
    est.online = False

    sem_video = est.segundos_sem_video
    if sem_video >= CFG.reiniciar_apos:
        liberado, porque = _pode_reiniciar(est, agora)
        if liberado:
            await reiniciar_camera(cam, f"{int(sem_video)}s sem vídeo")
        elif est.falhas_seguidas % 5 == 1:
            estado.registrar(cam.id, "info", f"reinício adiado: {porque}")


async def ciclo() -> None:
    cameras = cameras_atuais()
    if not cameras:
        return
    await asyncio.gather(*(checar_camera(cam) for cam in cameras), return_exceptions=False)
    estado.ciclos += 1
    estado.ultimo_ciclo = time.time()
    estado.salvar()
    resumo = estado.resumo()
    log.info("ciclo %s: %s online / %s offline", estado.ciclos, resumo["online"], resumo["offline"])


async def laco_principal() -> None:
    log.info(
        "watchdog iniciado (intervalo=%ss, reinício após %ss sem vídeo)",
        CFG.intervalo, CFG.reiniciar_apos,
    )
    while True:
        inicio = time.monotonic()
        try:
            await ciclo()
        except Exception as exc:  # noqa: BLE001 - o laço nunca pode morrer
            log.exception("erro inesperado no ciclo: %s", exc)
            estado.registrar("-", "erro", f"erro interno no watchdog: {exc}")
        espera = max(5.0, CFG.intervalo - (time.monotonic() - inicio))
        await asyncio.sleep(espera)


@contextlib.asynccontextmanager
async def ciclo_de_vida(_app: FastAPI):
    tarefa = asyncio.create_task(laco_principal())
    try:
        yield
    finally:
        tarefa.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await tarefa
        estado.salvar()


app = FastAPI(title="Watchdog - Buffet Bora Bora", lifespan=ciclo_de_vida, docs_url="/docs")


@app.get("/health")
async def health() -> dict[str, Any]:
    atrasado = (
        estado.ultimo_ciclo is not None
        and time.time() - estado.ultimo_ciclo > CFG.intervalo * 3
    )
    return {
        "ok": not atrasado,
        "ciclos": estado.ciclos,
        "ultimo_ciclo": estado.ultimo_ciclo,
        "cameras": len(estado.cameras),
        "config": _erro_config or "ok",
    }


@app.get("/status")
async def status() -> dict[str, Any]:
    return estado.resumo()


@app.get("/status/{cam_id}")
async def status_camera(cam_id: str) -> dict[str, Any]:
    for item in estado.resumo()["cameras"]:
        if item["id"] == cam_id:
            return item
    raise HTTPException(status_code=404, detail="câmera não encontrada")


@app.get("/eventos")
async def eventos(limite: int = 100, camera: str | None = None) -> dict[str, Any]:
    return {"eventos": estado.eventos_recentes(min(max(limite, 1), CFG.max_eventos), camera)}


@app.post("/verificar")
async def verificar_agora() -> dict[str, Any]:
    await ciclo()
    return estado.resumo()


@app.post("/reiniciar/{cam_id}")
async def reiniciar(cam_id: str) -> dict[str, Any]:
    for cam in cameras_atuais():
        if cam.id == cam_id:
            return await reiniciar_camera(cam, "reinício manual pelo painel")
    raise HTTPException(status_code=404, detail="câmera não encontrada")
