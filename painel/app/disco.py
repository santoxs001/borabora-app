"""Uso de disco da pasta de gravações."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from .config import CFG


def _gb(valor: int | float) -> float:
    return round(valor / (1024 ** 3), 1)


def uso() -> dict[str, Any]:
    caminho = Path(CFG.pasta_gravacoes)
    if not caminho.exists():
        return {
            "ok": False,
            "mensagem": f"pasta de gravações não encontrada ({caminho})",
            "total_gb": 0, "usado_gb": 0, "livre_gb": 0, "percentual": 0,
        }
    try:
        total, usado, livre = shutil.disk_usage(caminho)
    except OSError as exc:
        return {
            "ok": False,
            "mensagem": f"não consegui ler o disco: {exc}",
            "total_gb": 0, "usado_gb": 0, "livre_gb": 0, "percentual": 0,
        }

    percentual = round(usado / total * 100) if total else 0
    if percentual >= 95:
        alerta = "critico"
    elif percentual >= 85:
        alerta = "atencao"
    else:
        alerta = "ok"
    return {
        "ok": True,
        "caminho": str(caminho),
        "total_gb": _gb(total),
        "usado_gb": _gb(usado),
        "livre_gb": _gb(livre),
        "percentual": percentual,
        "alerta": alerta,
    }
