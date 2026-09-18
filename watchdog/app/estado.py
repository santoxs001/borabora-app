"""Estado das câmeras + histórico de eventos, com persistência em disco."""

from __future__ import annotations

import json
import logging
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from .config import CFG

log = logging.getLogger("watchdog.estado")


@dataclass
class EstadoCamera:
    id: str
    nome: str = ""
    local: str = ""
    ip: str = ""
    online: bool = False
    detalhe: str = "aguardando primeira checagem"
    metodo: str = ""
    ping_ok: bool = False
    tcp_ok: bool = False
    ultimo_ok: float | None = None
    ultima_queda: float | None = None
    ultima_checagem: float | None = None
    falhas_seguidas: int = 0
    reinicios: int = 0
    ultimo_reinicio: float | None = None
    ultima_tentativa_reinicio: float | None = None
    reinicios_recentes: list[float] = field(default_factory=list)
    total_quedas: int = 0

    @property
    def segundos_sem_video(self) -> float:
        if self.online:
            return 0.0
        base = self.ultimo_ok or self.ultima_queda or time.time()
        return max(0.0, time.time() - base)


@dataclass
class Evento:
    quando: float
    camera: str
    tipo: str      # queda | recuperacao | reinicio | erro | info
    mensagem: str


class Estado:
    def __init__(self, arquivo: str | Path | None = None) -> None:
        self.arquivo = Path(arquivo or CFG.arquivo_estado)
        self.cameras: dict[str, EstadoCamera] = {}
        self.eventos: list[Evento] = []
        self.ciclos = 0
        self.ultimo_ciclo: float | None = None
        self.iniciado_em = time.time()
        self.carregar()

    # ------------------------------------------------------------- persistência
    def carregar(self) -> None:
        if not self.arquivo.exists():
            return
        try:
            dados = json.loads(self.arquivo.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            log.warning("não consegui ler o estado salvo (%s): começando do zero", exc)
            return
        for bruto in dados.get("cameras", []):
            try:
                cam = EstadoCamera(**{k: v for k, v in bruto.items() if k in EstadoCamera.__annotations__})
                self.cameras[cam.id] = cam
            except TypeError:
                continue
        for bruto in dados.get("eventos", []):
            try:
                self.eventos.append(Evento(**bruto))
            except TypeError:
                continue
        self.ciclos = int(dados.get("ciclos", 0))

    def salvar(self) -> None:
        try:
            self.arquivo.parent.mkdir(parents=True, exist_ok=True)
            temporario = self.arquivo.with_suffix(".tmp")
            temporario.write_text(
                json.dumps(
                    {
                        "cameras": [asdict(c) for c in self.cameras.values()],
                        "eventos": [asdict(e) for e in self.eventos[-CFG.max_eventos:]],
                        "ciclos": self.ciclos,
                        "salvo_em": time.time(),
                    },
                    ensure_ascii=False,
                    indent=1,
                ),
                encoding="utf-8",
            )
            temporario.replace(self.arquivo)
        except OSError as exc:
            log.warning("não consegui salvar o estado: %s", exc)

    # ------------------------------------------------------------------ eventos
    def registrar(self, camera: str, tipo: str, mensagem: str) -> Evento:
        evento = Evento(time.time(), camera, tipo, mensagem)
        self.eventos.append(evento)
        del self.eventos[:-CFG.max_eventos]
        nivel = logging.WARNING if tipo in ("queda", "erro") else logging.INFO
        log.log(nivel, "[%s] %s: %s", camera, tipo, mensagem)
        return evento

    # ------------------------------------------------------------------- acesso
    def para_camera(self, cam_id: str, nome: str = "", local: str = "", ip: str = "") -> EstadoCamera:
        estado = self.cameras.get(cam_id)
        if estado is None:
            estado = EstadoCamera(id=cam_id)
            self.cameras[cam_id] = estado
        if nome:
            estado.nome, estado.local, estado.ip = nome, local, ip
        return estado

    def resumo(self) -> dict[str, Any]:
        cameras = []
        for estado in self.cameras.values():
            item = asdict(estado)
            item["segundos_sem_video"] = round(estado.segundos_sem_video)
            item.pop("reinicios_recentes", None)
            cameras.append(item)
        cameras.sort(key=lambda c: c["nome"] or c["id"])
        online = sum(1 for c in cameras if c["online"])
        return {
            "atualizado_em": self.ultimo_ciclo,
            "ciclos": self.ciclos,
            "iniciado_em": self.iniciado_em,
            "total": len(cameras),
            "online": online,
            "offline": len(cameras) - online,
            "cameras": cameras,
        }

    def eventos_recentes(self, limite: int = 100, camera: str | None = None) -> list[dict[str, Any]]:
        itens = [e for e in self.eventos if camera is None or e.camera == camera]
        return [asdict(e) for e in itens[-limite:][::-1]]
