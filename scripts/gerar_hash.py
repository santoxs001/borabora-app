#!/usr/bin/env python3
"""Gera o hash bcrypt de uma senha para colocar no .env do painel.

Uso:
    python3 scripts/gerar_hash.py                 # pergunta a senha (não aparece na tela)
    python3 scripts/gerar_hash.py "minha senha"   # direto (fica no histórico do terminal!)
"""

from __future__ import annotations

import base64
import getpass
import sys

try:
    import bcrypt
except ImportError:  # pragma: no cover - mensagem de ajuda
    print("Falta a biblioteca bcrypt. Rode:  pip install bcrypt", file=sys.stderr)
    print("Ou use o container:  docker compose run --rm gerador python scripts/gerar_hash.py", file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    if len(sys.argv) > 1:
        senha = sys.argv[1]
    else:
        senha = getpass.getpass("Senha: ")
        if senha != getpass.getpass("Repita a senha: "):
            print("As senhas não conferem.", file=sys.stderr)
            return 1
    if len(senha) < 6:
        print("Use uma senha com pelo menos 6 caracteres.", file=sys.stderr)
        return 1

    hash_ = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("ascii")
    codificado = base64.b64encode(hash_.encode("ascii")).decode("ascii")

    print("\nCole no .env (troque ADMIN por VISUALIZADOR se for o outro perfil).")
    print("As ASPAS SIMPLES são obrigatórias: o hash tem '$', que o Docker entende como variável.\n")
    print(f"PAINEL_ADMIN_HASH='{hash_}'\n")
    print("Se mesmo assim o login não funcionar (costuma acontecer no Windows), use esta linha:\n")
    print(f"PAINEL_ADMIN_HASH_B64={codificado}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
