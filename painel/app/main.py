"""Painel do sistema de câmeras do Buffet Bora Bora.

Serve as páginas, faz o login e junta as três fontes de informação:
go2rtc (vídeo ao vivo), watchdog (status das câmeras) e Frigate (gravações).
"""

from __future__ import annotations

import contextlib
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any

sys.path.insert(0, "/app")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import httpx  # noqa: E402
from fastapi import Depends, FastAPI, Form, HTTPException, Request, Response  # noqa: E402
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from comum.cameras import ErroConfig, carregar  # noqa: E402

from . import auth, disco, frigate  # noqa: E402
from .config import CFG  # noqa: E402

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)-7s %(name)s | %(message)s",
    datefmt="%d/%m/%Y %H:%M:%S",
)
log = logging.getLogger("painel")

ESTATICOS = Path(__file__).resolve().parent.parent / "static"


@contextlib.asynccontextmanager
async def ciclo_de_vida(_app: FastAPI):
    if not auth.configurado():
        log.error(
            "NENHUM USUÁRIO CONFIGURADO! Defina PAINEL_ADMIN_USUARIO e PAINEL_ADMIN_HASH no .env "
            "(gere o hash com: python3 scripts/gerar_hash.py)"
        )
    if not os.environ.get("PAINEL_SEGREDO"):
        log.warning("PAINEL_SEGREDO não definido: as sessões caem a cada reinício do painel.")
    yield
    await frigate.fechar()


app = FastAPI(title="Painel de Câmeras - Buffet Bora Bora", lifespan=ciclo_de_vida, docs_url=None, redoc_url=None)


# --------------------------------------------------------------------- páginas
@app.get("/login", include_in_schema=False)
async def pagina_login(request: Request):
    if auth.usuario_opcional(request):
        return RedirectResponse("/", status_code=303)
    return FileResponse(ESTATICOS / "login.html")


@app.post("/login", include_in_schema=False)
async def fazer_login(request: Request, usuario: str = Form(...), senha: str = Form(...)):
    origem = request.client.host if request.client else "?"
    conta = auth.autenticar(usuario, senha, origem)
    resposta = JSONResponse({"ok": True, "usuario": conta.nome, "perfil": conta.perfil})
    resposta.set_cookie(
        auth.COOKIE,
        auth.criar_cookie(conta),
        max_age=CFG.horas_sessao * 3600,
        httponly=True,
        samesite="lax",
    )
    return resposta


@app.post("/logout", include_in_schema=False)
@app.get("/logout", include_in_schema=False)
async def sair():
    resposta = RedirectResponse("/login", status_code=303)
    resposta.delete_cookie(auth.COOKIE)
    return resposta


@app.get("/", include_in_schema=False)
async def pagina_inicial(request: Request):
    if not auth.usuario_opcional(request):
        return RedirectResponse("/login", status_code=303)
    return FileResponse(ESTATICOS / "index.html")


@app.get("/health", include_in_schema=False)
async def health() -> dict[str, Any]:
    return {"ok": True, "usuarios_configurados": auth.configurado(), "quando": time.time()}


# ------------------------------------------------------------------------ API
@app.get("/api/eu")
async def eu(usuario: auth.Usuario = Depends(auth.usuario_atual)) -> dict[str, Any]:
    publico = CFG.go2rtc_publico
    return {
        "usuario": usuario.nome,
        "perfil": usuario.perfil,
        "admin": usuario.admin,
        "titulo": CFG.titulo,
        "go2rtc": publico,  # vazio = o navegador usa o host da página na porta 1984
        "fuso": CFG.fuso,
    }


async def _status_watchdog() -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=8) as cliente:
            resposta = await cliente.get(f"{CFG.watchdog_url}/status")
            resposta.raise_for_status()
            return resposta.json()
    except (httpx.HTTPError, ValueError) as exc:
        log.warning("watchdog não respondeu: %s", exc)
        return {"cameras": [], "erro": "watchdog não respondeu"}


@app.get("/api/cameras")
async def listar_cameras(_: auth.Usuario = Depends(auth.usuario_atual)) -> dict[str, Any]:
    try:
        cameras = carregar(CFG.cameras_yaml)
    except ErroConfig as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    estado = await _status_watchdog()
    por_id = {c.get("id"): c for c in estado.get("cameras", [])}

    saida = []
    for cam in cameras:
        info = cam.como_dict()
        situacao = por_id.get(cam.id, {})
        info.update(
            {
                "online": situacao.get("online"),
                "detalhe": situacao.get("detalhe", "sem informação do watchdog"),
                "ultimo_ok": situacao.get("ultimo_ok"),
                "ultima_queda": situacao.get("ultima_queda"),
                "ultima_checagem": situacao.get("ultima_checagem"),
                "reinicios": situacao.get("reinicios", 0),
                "total_quedas": situacao.get("total_quedas", 0),
                "segundos_sem_video": situacao.get("segundos_sem_video", 0),
            }
        )
        saida.append(info)

    return {
        "cameras": saida,
        "watchdog_ok": "erro" not in estado,
        "atualizado_em": estado.get("atualizado_em"),
        "online": sum(1 for c in saida if c["online"]),
        "total": len(saida),
    }


@app.get("/api/eventos")
async def eventos_watchdog(
    limite: int = 50, camera: str | None = None, _: auth.Usuario = Depends(auth.usuario_atual)
) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=8) as cliente:
            resposta = await cliente.get(
                f"{CFG.watchdog_url}/eventos",
                params={"limite": limite, **({"camera": camera} if camera else {})},
            )
            resposta.raise_for_status()
            return resposta.json()
    except (httpx.HTTPError, ValueError):
        return {"eventos": [], "erro": "watchdog não respondeu"}


@app.post("/api/reiniciar/{cam_id}")
async def reiniciar_camera(cam_id: str, usuario: auth.Usuario = Depends(auth.apenas_admin)) -> dict[str, Any]:
    log.warning("reinício manual da câmera '%s' pedido por '%s'", cam_id, usuario.nome)
    try:
        async with httpx.AsyncClient(timeout=30) as cliente:
            resposta = await cliente.post(f"{CFG.watchdog_url}/reiniciar/{cam_id}")
            if resposta.status_code == 404:
                raise HTTPException(status_code=404, detail="Câmera não encontrada.")
            resposta.raise_for_status()
            return resposta.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Watchdog não respondeu.") from exc


@app.get("/api/disco")
async def uso_disco(_: auth.Usuario = Depends(auth.usuario_atual)) -> dict[str, Any]:
    return disco.uso()


@app.get("/api/gravacoes/{cam_id}/dias")
async def dias(cam_id: str, _: auth.Usuario = Depends(auth.usuario_atual)) -> dict[str, Any]:
    return {"dias": await frigate.dias_com_gravacao(cam_id)}


@app.get("/api/gravacoes/{cam_id}")
async def gravacoes(cam_id: str, data: str, _: auth.Usuario = Depends(auth.usuario_atual)) -> dict[str, Any]:
    inicio, fim = frigate.limites_do_dia(data)
    return {
        "camera": cam_id,
        "data": data,
        "inicio": inicio,
        "fim": fim,
        "horas": await frigate.horas_gravadas(cam_id, data),
        "eventos": await frigate.eventos(cam_id, inicio, fim),
    }


# ----------------------------------------------------------- vídeos (proxy)
@app.get("/midia/evento/{evento_id}/video.mp4", include_in_schema=False)
async def video_evento(evento_id: str, request: Request, _: auth.Usuario = Depends(auth.usuario_atual)):
    return await frigate.repassar(request, f"/api/events/{evento_id}/clip.mp4")


@app.get("/midia/evento/{evento_id}/foto.jpg", include_in_schema=False)
async def foto_evento(evento_id: str, request: Request, _: auth.Usuario = Depends(auth.usuario_atual)):
    return await frigate.repassar(request, f"/api/events/{evento_id}/thumbnail.jpg")


@app.get("/midia/hora/{cam_id}/{inicio}/{fim}/{arquivo:path}", include_in_schema=False)
async def gravacao_continua(
    cam_id: str, inicio: int, fim: int, arquivo: str, request: Request,
    _: auth.Usuario = Depends(auth.usuario_atual),
):
    """Playlist HLS (e seus pedaços) da gravação contínua, vinda do Frigate."""
    if ".." in arquivo:
        raise HTTPException(status_code=400, detail="Caminho inválido.")
    return await frigate.repassar(request, f"/vod/{cam_id}/start/{inicio}/end/{fim}/{arquivo}")


@app.exception_handler(HTTPException)
async def erro_http(request: Request, exc: HTTPException):
    """Página HTML vai para o login; chamadas de API recebem JSON."""
    if exc.status_code == 401 and "text/html" in (request.headers.get("accept") or ""):
        return RedirectResponse("/login", status_code=303)
    return JSONResponse({"erro": exc.detail}, status_code=exc.status_code, headers=exc.headers)


app.mount("/estatico", StaticFiles(directory=ESTATICOS), name="estatico")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon() -> Response:
    return Response(status_code=204)
