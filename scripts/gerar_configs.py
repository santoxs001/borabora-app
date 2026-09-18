#!/usr/bin/env python3
"""Gera as configurações do go2rtc e do Frigate a partir do cameras.yaml.

Uso típico:
    python3 scripts/gerar_configs.py                      # usa cameras.yaml
    python3 scripts/gerar_configs.py -c cameras.teste.yaml
    python3 scripts/gerar_configs.py --urls                # mostra URLs p/ VLC

Os arquivos gerados ficam em config/go2rtc/go2rtc.yaml e config/frigate/config.yml
e NÃO devem ser editados à mão: eles são reescritos a cada execução.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

try:
    import yaml  # noqa: E402

    from comum.cameras import Camera, ErroConfig, carregar  # noqa: E402
except ImportError:  # pragma: no cover - ajuda para quem não tem Python preparado
    print(
        "Falta a biblioteca PyYAML neste computador.\n"
        "  Instale com:  pip install pyyaml\n"
        "  Ou rode pelo Docker, sem instalar nada:\n"
        "      docker compose run --rm gerador python scripts/gerar_configs.py --urls\n",
        file=sys.stderr,
    )
    raise SystemExit(1)

CABECALHO = (
    "# =====================================================================\n"
    "# ARQUIVO GERADO AUTOMATICAMENTE - NAO EDITE A MAO\n"
    "# Fonte: {fonte}\n"
    "# Gerado em: {quando}\n"
    "# Para mudar algo, edite o cameras.yaml e rode:\n"
    "#     python3 scripts/gerar_configs.py\n"
    "# =====================================================================\n"
)


def _carrega_dotenv(caminho: Path) -> None:
    """Lê o .env sem depender de bibliotecas externas."""
    if not caminho.exists():
        return
    for linha in caminho.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, _, valor = linha.partition("=")
        chave = chave.strip()
        valor = valor.strip().strip('"').strip("'")
        os.environ.setdefault(chave, valor)


# --------------------------------------------------------------------- go2rtc
def config_go2rtc(cameras: list[Camera]) -> dict:
    streams: dict[str, list[str]] = {}
    for cam in cameras:
        # backchannel=0 evita o áudio de retorno que trava câmeras Yoosee/Gwell.
        streams[cam.stream_principal] = [f"{cam.rtsp_principal}#backchannel=0"]
        streams[cam.stream_sub] = [f"{cam.rtsp_substream}#backchannel=0"]

    cfg: dict = {
        "api": {"listen": ":1984", "origin": "*"},
        "rtsp": {"listen": ":8554"},
        "webrtc": {"listen": ":8555/tcp"},
        "log": {"level": os.environ.get("GO2RTC_LOG_LEVEL", "info")},
        "streams": streams,
    }

    # IP do servidor na rede local: sem isso o WebRTC não fecha conexão com o
    # celular. Ex.: GO2RTC_CANDIDATE=192.168.0.10
    # Sem STUN de propósito: o sistema roda sem internet. Sem esse IP o WebRTC
    # não conecta e o painel cai para MSE sozinho.
    candidato = os.environ.get("GO2RTC_CANDIDATE", "").strip()
    if candidato:
        porta = "" if ":" in candidato else ":8555"
        cfg["webrtc"]["candidates"] = [f"{candidato}{porta}"]

    return cfg


# -------------------------------------------------------------------- Frigate
def _bloco_gravacao(cam: Camera) -> dict:
    continuo = int(cam.retencao.get("continuo_dias", 7))
    eventos = int(cam.retencao.get("eventos_dias", 14))
    return {
        "enabled": True,
        "retain": {"days": continuo, "mode": "all"},
        "alerts": {"retain": {"days": eventos}},
        "detections": {"retain": {"days": eventos}},
    }


def config_frigate(cameras: list[Camera], host_go2rtc: str, porta_go2rtc: int) -> dict:
    blocos: dict[str, dict] = {}
    for ordem, cam in enumerate(cameras):
        det = cam.deteccao or {}
        blocos[cam.id] = {
            "enabled": True,
            "ffmpeg": {
                "inputs": [
                    {
                        "path": cam.rtsp_go2rtc(host_go2rtc, porta_go2rtc, sub=False),
                        "input_args": "preset-rtsp-restream",
                        "roles": ["record"],
                    },
                    {
                        "path": cam.rtsp_go2rtc(host_go2rtc, porta_go2rtc, sub=True),
                        "input_args": "preset-rtsp-restream",
                        "roles": ["detect"],
                    },
                ]
            },
            "detect": {
                "enabled": bool(cam.detectar),
                "width": int(det.get("largura", 640)),
                "height": int(det.get("altura", 360)),
                "fps": int(det.get("fps", 5)),
            },
            "record": _bloco_gravacao(cam),
            "snapshots": {
                "enabled": True,
                "retain": {"default": int(cam.retencao.get("eventos_dias", 14))},
            },
            "objects": {"track": ["person"]},
            "motion": {"improve_contrast": True},
            "ui": {"order": ordem},
        }

    return {
        "mqtt": {"enabled": False},
        # O painel Bora Bora faz a autenticação; o Frigate fica só na rede
        # interna do Docker, sem porta publicada.
        "auth": {"enabled": False},
        "tls": {"enabled": False},
        "logger": {"default": "info"},
        "detectors": {"cpu1": {"type": "cpu"}},
        "ffmpeg": {"retry_interval": 10},
        "objects": {"track": ["person"]},
        "record": {"enabled": True, "retain": {"days": 7, "mode": "all"}},
        "snapshots": {"enabled": True},
        "cameras": blocos,
    }


# ----------------------------------------------------------------------- util
def escreve(caminho: Path, cfg: dict, fonte: Path, segredo: bool = False) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    corpo = yaml.safe_dump(cfg, allow_unicode=True, sort_keys=False, width=200)
    cabecalho = CABECALHO.format(
        fonte=fonte, quando=datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    )
    caminho.write_text(cabecalho + corpo, encoding="utf-8")
    if segredo:
        try:
            caminho.chmod(0o600)  # contém as senhas das câmeras
        except OSError:
            pass


def mascara(url: str) -> str:
    if "@" not in url:
        return url
    inicio, _, resto = url.partition("://")
    cred, _, host = resto.partition("@")
    usuario, _, _senha = cred.partition(":")
    return f"{inicio}://{usuario}:*****@{host}"


def mostra_urls(cameras: list[Camera], com_senha: bool) -> None:
    print("\nURLs RTSP das câmeras (cole no VLC: Mídia > Abrir Fluxo de Rede)\n")
    for cam in cameras:
        print(f"  {cam.nome}  [{cam.id}] - {cam.ip}")
        p = cam.rtsp_principal if com_senha else mascara(cam.rtsp_principal)
        s = cam.rtsp_substream if com_senha else mascara(cam.rtsp_substream)
        print(f"     principal : {p}")
        print(f"     substream : {s}")
        print(f"     onvif     : {cam.url_onvif}\n")
    if not com_senha:
        print("  (use --com-senha para exibir as senhas em texto puro)\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Gera configs do go2rtc e do Frigate.")
    parser.add_argument(
        "-c",
        "--cameras",
        default=os.environ.get("CAMERAS_YAML") or os.environ.get("CAMERAS_FILE") or str(RAIZ / "cameras.yaml"),
        help="arquivo de câmeras (padrão: cameras.yaml)",
    )
    parser.add_argument("-s", "--saida", default=str(RAIZ / "config"), help="pasta de saída das configs")
    parser.add_argument("--env", default=str(RAIZ / ".env"), help="arquivo .env com as senhas")
    parser.add_argument("--go2rtc-host", default=os.environ.get("GO2RTC_HOST", "go2rtc"))
    parser.add_argument("--go2rtc-porta-rtsp", type=int, default=int(os.environ.get("GO2RTC_PORTA_RTSP", "8554")))
    parser.add_argument("--urls", action="store_true", help="apenas mostra as URLs RTSP (teste no VLC)")
    parser.add_argument("--com-senha", action="store_true", help="mostra as senhas em --urls")
    args = parser.parse_args(argv)

    _carrega_dotenv(Path(args.env))

    arquivo = Path(args.cameras)
    if not arquivo.is_absolute():
        arquivo = (RAIZ / arquivo) if not arquivo.exists() else arquivo

    try:
        cameras = carregar(arquivo, exigir_senha=not args.urls)
    except ErroConfig as exc:
        print(f"\nERRO DE CONFIGURAÇÃO\n{exc}\n", file=sys.stderr)
        return 2

    if args.urls:
        mostra_urls(cameras, args.com_senha)
        return 0

    saida = Path(args.saida)
    alvo_go2rtc = saida / "go2rtc" / "go2rtc.yaml"
    alvo_frigate = saida / "frigate" / "config.yml"

    escreve(alvo_go2rtc, config_go2rtc(cameras), arquivo, segredo=True)
    escreve(alvo_frigate, config_frigate(cameras, args.go2rtc_host, args.go2rtc_porta_rtsp), arquivo)

    print(f"Câmeras lidas de {arquivo}: {len(cameras)}")
    for cam in cameras:
        marca = "detecção ON " if cam.detectar else "detecção OFF"
        print(f"  - {cam.id:<16} {cam.nome:<24} {cam.ip:<16} {marca}")
    print(f"\nGerado: {alvo_go2rtc}")
    print(f"Gerado: {alvo_frigate}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
