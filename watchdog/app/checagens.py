"""Checagens de uma câmera: rede (ping/TCP) e vídeo (go2rtc / ffprobe)."""

from __future__ import annotations

import asyncio
import json
import shutil
from dataclasses import dataclass

import httpx

from comum.cameras import Camera

from .config import CFG


@dataclass
class Resultado:
    rede_ok: bool
    video_ok: bool
    ping_ok: bool
    tcp_ok: bool
    detalhe: str
    metodo: str = ""

    @property
    def ok(self) -> bool:
        return self.rede_ok and self.video_ok


async def ping(ip: str, timeout: int | None = None) -> bool:
    """ICMP. Pode falhar por falta de permissão no container: é só um sinal."""
    timeout = timeout or CFG.timeout_ping
    if not shutil.which("ping"):
        return False
    try:
        proc = await asyncio.create_subprocess_exec(
            "ping", "-c", "1", "-W", str(timeout), ip,
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
        )
        try:
            return await asyncio.wait_for(proc.wait(), timeout=timeout + 2) == 0
        except asyncio.TimeoutError:
            proc.kill()
            return False
    except OSError:
        return False


async def porta_aberta(host: str, porta: int, timeout: int | None = None) -> bool:
    timeout = timeout or CFG.timeout_tcp
    try:
        leitor, escritor = await asyncio.wait_for(
            asyncio.open_connection(host, porta), timeout=timeout
        )
        escritor.close()
        try:
            await escritor.wait_closed()
        except Exception:  # noqa: BLE001 - fechar não pode derrubar a checagem
            pass
        return True
    except (asyncio.TimeoutError, OSError):
        return False


async def video_no_go2rtc(cam: Camera) -> tuple[bool | None, str]:
    """Consulta a API do go2rtc. Devolve (ok, detalhe).

    ok = None significa "não deu para saber" (go2rtc fora do ar ou stream sem
    consumidor), e aí o chamador usa o ffprobe.
    """
    url = f"http://{CFG.go2rtc_host}:{CFG.go2rtc_api}/api/streams"
    try:
        async with httpx.AsyncClient(timeout=6) as cliente:
            resposta = await cliente.get(url, params={"src": cam.stream_sub})
            resposta.raise_for_status()
            dados = resposta.json()
    except (httpx.HTTPError, json.JSONDecodeError, ValueError):
        return None, "go2rtc não respondeu"

    if isinstance(dados, dict) and "producers" in dados:
        stream = dados
    elif isinstance(dados, dict):
        stream = dados.get(cam.stream_sub) or {}
    else:
        stream = {}

    produtores = stream.get("producers") or []
    if not produtores:
        return None, "sem produtor ativo no go2rtc"

    for produtor in produtores:
        if not isinstance(produtor, dict):
            continue
        recebidos = produtor.get("bytes_recv") or produtor.get("recv") or 0
        if isinstance(recebidos, (int, float)) and recebidos > 0:
            return True, f"go2rtc recebendo vídeo ({int(recebidos)} bytes)"
    return False, "produtor no go2rtc sem bytes recebidos"


async def video_por_ffprobe(cam: Camera) -> tuple[bool, str]:
    """Abre o stream pelo go2rtc e confirma que existe vídeo chegando."""
    if not CFG.usar_ffprobe or not shutil.which("ffprobe"):
        return False, "ffprobe indisponível"

    url = cam.rtsp_go2rtc(CFG.go2rtc_host, CFG.go2rtc_rtsp, sub=True)
    comando = [
        "ffprobe", "-v", "error",
        "-rtsp_transport", "tcp",
        "-timeout", str(CFG.timeout_ffprobe * 1_000_000),
        "-select_streams", "v:0",
        "-show_entries", "stream=codec_name,width,height",
        "-of", "json", "-i", url,
    ]
    try:
        proc = await asyncio.create_subprocess_exec(
            *comando, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
    except OSError as exc:
        return False, f"não consegui rodar o ffprobe: {exc}"

    try:
        saida, erro = await asyncio.wait_for(proc.communicate(), timeout=CFG.timeout_ffprobe + 5)
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        return False, f"sem vídeo em {CFG.timeout_ffprobe}s (ffprobe travou)"

    if proc.returncode != 0:
        detalhe = (erro or b"").decode("utf-8", "ignore").strip().splitlines()
        return False, f"ffprobe falhou: {detalhe[-1] if detalhe else 'erro desconhecido'}"

    try:
        streams = json.loads(saida.decode("utf-8", "ignore")).get("streams") or []
    except json.JSONDecodeError:
        return False, "resposta do ffprobe ilegível"

    if not streams:
        return False, "stream sem faixa de vídeo"
    s = streams[0]
    return True, f"vídeo ok ({s.get('codec_name')} {s.get('width')}x{s.get('height')})"


async def checar(cam: Camera) -> Resultado:
    ping_ok, tcp_ok = await asyncio.gather(
        ping(cam.ip), porta_aberta(cam.ip, cam.porta_rtsp)
    )
    rede_ok = bool(ping_ok or tcp_ok)
    if not rede_ok:
        return Resultado(False, False, ping_ok, tcp_ok, "câmera não responde na rede (ping e RTSP)")

    ok_go2rtc, detalhe = await video_no_go2rtc(cam)
    if ok_go2rtc is True:
        return Resultado(True, True, ping_ok, tcp_ok, detalhe, metodo="go2rtc")
    if ok_go2rtc is False:
        video_ok, detalhe_probe = await video_por_ffprobe(cam)
        return Resultado(rede_ok, video_ok, ping_ok, tcp_ok, detalhe_probe, metodo="ffprobe")

    video_ok, detalhe_probe = await video_por_ffprobe(cam)
    if not video_ok and not CFG.usar_ffprobe:
        # Sem ffprobe só dá para confiar na rede.
        return Resultado(rede_ok, rede_ok, ping_ok, tcp_ok, f"{detalhe}; assumindo rede como estado", metodo="rede")
    return Resultado(rede_ok, video_ok, ping_ok, tcp_ok, detalhe_probe, metodo="ffprobe")
