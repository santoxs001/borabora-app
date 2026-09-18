"""Leitura e normalização do cameras.yaml.

Módulo compartilhado pelo gerador de configs, pelo watchdog e pelo painel.
Depende apenas de PyYAML para funcionar em qualquer um dos três containers.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

RE_ID = re.compile(r"^[a-z0-9_]+$")

PADROES_BASE: dict[str, Any] = {
    "usuario": "admin",
    "senha_env": "CAM_SENHA_PADRAO",
    "porta_rtsp": 554,
    "porta_onvif": 5000,
    "caminho_principal": "/onvif1",
    "caminho_substream": "/onvif2",
    "onvif": True,
    "detectar": True,
    "deteccao": {"largura": 640, "altura": 360, "fps": 5},
    "retencao": {"continuo_dias": 7, "eventos_dias": 14},
}


class ErroConfig(Exception):
    """Erro de configuração legível para o usuário final."""


@dataclass
class Camera:
    id: str
    nome: str
    local: str
    ip: str
    usuario: str
    senha: str
    porta_rtsp: int
    porta_onvif: int
    caminho_principal: str
    caminho_substream: str
    onvif: bool
    detectar: bool
    deteccao: dict[str, int] = field(default_factory=dict)
    retencao: dict[str, int] = field(default_factory=dict)
    senha_env: str = ""
    senha_ausente: bool = False

    # ------------------------------------------------------------------ URLs
    def _rtsp(self, caminho: str) -> str:
        cred = ""
        if self.usuario:
            cred = f"{_escapa(self.usuario)}:{_escapa(self.senha)}@"
        if not caminho.startswith("/"):
            caminho = "/" + caminho
        return f"rtsp://{cred}{self.ip}:{self.porta_rtsp}{caminho}"

    @property
    def rtsp_principal(self) -> str:
        return self._rtsp(self.caminho_principal)

    @property
    def rtsp_substream(self) -> str:
        return self._rtsp(self.caminho_substream)

    @property
    def stream_principal(self) -> str:
        """Nome do stream principal dentro do go2rtc."""
        return self.id

    @property
    def stream_sub(self) -> str:
        """Nome do substream dentro do go2rtc."""
        return f"{self.id}_sub"

    @property
    def url_onvif(self) -> str:
        return f"http://{self.ip}:{self.porta_onvif}/onvif/device_service"

    def rtsp_go2rtc(self, host: str, porta: int = 8554, sub: bool = False) -> str:
        nome = self.stream_sub if sub else self.stream_principal
        return f"rtsp://{host}:{porta}/{nome}"

    def como_dict(self) -> dict[str, Any]:
        """Versão segura (sem senha) para a API do painel."""
        return {
            "id": self.id,
            "nome": self.nome,
            "local": self.local,
            "ip": self.ip,
            "porta_rtsp": self.porta_rtsp,
            "porta_onvif": self.porta_onvif,
            "onvif": self.onvif,
            "detectar": self.detectar,
            "stream": self.stream_principal,
            "stream_sub": self.stream_sub,
        }


def _escapa(valor: str) -> str:
    """Escapa caracteres especiais de usuário/senha dentro da URL RTSP."""
    from urllib.parse import quote

    return quote(str(valor), safe="")


def _mescla(padrao: Any, especifico: Any) -> Any:
    if isinstance(padrao, dict) and isinstance(especifico, dict):
        saida = dict(padrao)
        for chave, valor in especifico.items():
            saida[chave] = _mescla(padrao.get(chave), valor)
        return saida
    return padrao if especifico is None else especifico


def caminho_padrao() -> Path:
    """Caminho do cameras.yaml (env CAMERAS_YAML tem prioridade)."""
    env = os.environ.get("CAMERAS_YAML")
    if env:
        return Path(env)
    return Path(__file__).resolve().parent.parent / "cameras.yaml"


def carregar(caminho: str | Path | None = None, exigir_senha: bool = False) -> list[Camera]:
    caminho = Path(caminho) if caminho else caminho_padrao()
    if not caminho.exists():
        raise ErroConfig(f"Arquivo de câmeras não encontrado: {caminho}")

    try:
        dados = yaml.safe_load(caminho.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        raise ErroConfig(f"YAML inválido em {caminho}: {exc}") from exc

    if not isinstance(dados, dict):
        raise ErroConfig(f"{caminho}: o arquivo precisa ter as chaves 'padroes' e 'cameras'.")

    padroes = _mescla(PADROES_BASE, dados.get("padroes") or {})
    brutas = dados.get("cameras") or []
    if not isinstance(brutas, list) or not brutas:
        raise ErroConfig(f"{caminho}: nenhuma câmera cadastrada na lista 'cameras'.")

    cameras: list[Camera] = []
    vistos: set[str] = set()
    faltando_senha: list[str] = []

    for indice, bruta in enumerate(brutas, start=1):
        if not isinstance(bruta, dict):
            raise ErroConfig(f"{caminho}: a câmera nº {indice} não é um bloco válido.")
        cfg = _mescla(padroes, bruta)

        cam_id = str(cfg.get("id") or "").strip()
        if not RE_ID.match(cam_id):
            raise ErroConfig(
                f"{caminho}: id inválido na câmera nº {indice} ('{cam_id}'). "
                "Use apenas letras minúsculas, números e '_' (ex.: salao_principal)."
            )
        if cam_id in vistos:
            raise ErroConfig(f"{caminho}: id repetido '{cam_id}'.")
        vistos.add(cam_id)

        ip = str(cfg.get("ip") or "").strip()
        if not ip:
            raise ErroConfig(f"{caminho}: câmera '{cam_id}' está sem 'ip'.")

        usuario = str(cfg.get("usuario") or "")
        senha_env = str(cfg.get("senha_env") or "")
        senha = os.environ.get(senha_env, "") if senha_env else ""
        sem_senha = bool(usuario) and not senha
        if sem_senha:
            faltando_senha.append(f"{cam_id} -> {senha_env}")

        cameras.append(
            Camera(
                id=cam_id,
                nome=str(cfg.get("nome") or cam_id),
                local=str(cfg.get("local") or ""),
                ip=ip,
                usuario=usuario,
                senha=senha,
                porta_rtsp=int(cfg.get("porta_rtsp") or 554),
                porta_onvif=int(cfg.get("porta_onvif") or 5000),
                caminho_principal=str(cfg.get("caminho_principal") or "/onvif1"),
                caminho_substream=str(cfg.get("caminho_substream") or "/onvif2"),
                onvif=bool(cfg.get("onvif", True)),
                detectar=bool(cfg.get("detectar", True)),
                deteccao=dict(cfg.get("deteccao") or {}),
                retencao=dict(cfg.get("retencao") or {}),
                senha_env=senha_env,
                senha_ausente=sem_senha,
            )
        )

    if exigir_senha and faltando_senha:
        lista = "\n  - ".join(faltando_senha)
        raise ErroConfig(
            "Senha não definida no .env para as câmeras abaixo:\n  - "
            + lista
            + "\n\nCrie o arquivo .env (copie o .env.example) e preencha essas variáveis."
        )

    return cameras
