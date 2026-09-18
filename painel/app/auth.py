"""Login do painel: bcrypt + cookie de sessão assinado, com dois perfis."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass

import bcrypt
from fastapi import HTTPException, Request, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .config import CFG

log = logging.getLogger("painel.auth")

COOKIE = "bb_sessao"
_serializador = URLSafeTimedSerializer(CFG.segredo, salt="painel-bora-bora")

# Freio simples contra força bruta (na memória do processo).
_TENTATIVAS: dict[str, list[float]] = {}
MAX_TENTATIVAS = 8
JANELA_TENTATIVAS = 300  # 5 minutos


@dataclass(frozen=True)
class Usuario:
    nome: str
    perfil: str  # "admin" ou "visualizador"

    @property
    def admin(self) -> bool:
        return self.perfil == "admin"


def _contas() -> dict[str, tuple[str, str]]:
    contas: dict[str, tuple[str, str]] = {}
    if CFG.admin_usuario and CFG.admin_hash:
        contas[CFG.admin_usuario.lower()] = (CFG.admin_hash, "admin")
    if CFG.visualizador_usuario and CFG.visualizador_hash:
        contas[CFG.visualizador_usuario.lower()] = (CFG.visualizador_hash, "visualizador")
    return contas


def configurado() -> bool:
    return bool(_contas())


def _bloqueado(chave: str) -> bool:
    agora = time.time()
    tentativas = [t for t in _TENTATIVAS.get(chave, []) if agora - t < JANELA_TENTATIVAS]
    _TENTATIVAS[chave] = tentativas
    return len(tentativas) >= MAX_TENTATIVAS


def _registrar_falha(chave: str) -> None:
    _TENTATIVAS.setdefault(chave, []).append(time.time())


def autenticar(usuario: str, senha: str, origem: str = "?") -> Usuario:
    chave = f"{origem}|{usuario.lower()}"
    if _bloqueado(chave):
        log.warning("login bloqueado temporariamente para %s (muitas tentativas)", chave)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Espere 5 minutos e tente de novo.",
        )

    conta = _contas().get(usuario.strip().lower())
    # Compara mesmo sem conta, para não vazar quais usuários existem pelo tempo.
    hash_ = conta[0] if conta else "$2b$12$" + "." * 53
    try:
        confere = bcrypt.checkpw(senha.encode("utf-8"), hash_.encode("utf-8"))
    except ValueError:
        confere = False

    if not conta or not confere:
        _registrar_falha(chave)
        log.warning("login negado para '%s' vindo de %s", usuario, origem)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário ou senha incorretos.")

    _TENTATIVAS.pop(chave, None)
    log.info("login de '%s' (%s) vindo de %s", usuario, conta[1], origem)
    return Usuario(nome=usuario.strip(), perfil=conta[1])


def criar_cookie(usuario: Usuario) -> str:
    return _serializador.dumps({"u": usuario.nome, "p": usuario.perfil})


def ler_cookie(valor: str | None) -> Usuario | None:
    if not valor:
        return None
    try:
        dados = _serializador.loads(valor, max_age=CFG.horas_sessao * 3600)
    except (BadSignature, SignatureExpired):
        return None
    if not isinstance(dados, dict) or "u" not in dados:
        return None
    return Usuario(nome=str(dados["u"]), perfil=str(dados.get("p", "visualizador")))


def usuario_opcional(request: Request) -> Usuario | None:
    return ler_cookie(request.cookies.get(COOKIE))


def usuario_atual(request: Request) -> Usuario:
    usuario = usuario_opcional(request)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Faça login para continuar.")
    return usuario


def apenas_admin(request: Request) -> Usuario:
    usuario = usuario_atual(request)
    if not usuario.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Só o perfil administrador pode fazer isso.")
    return usuario
