# Painel web - Buffet Bora Bora
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=America/Sao_Paulo

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY painel/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY comum /app/comum
COPY painel/app /app/app
COPY painel/static /app/static

# hls.js toca a gravação contínua. Baixado no build para o sistema rodar depois
# sem nenhum acesso à internet. Se o download falhar, o painel continua
# funcionando (os clipes de movimento são MP4 e tocam em qualquer navegador).
RUN curl -fsSL --retry 3 -o /app/static/js/hls.min.js \
        https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js \
    || echo "AVISO: nao consegui baixar o hls.js - gravacao continua so no Safari/iPhone"

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--log-level", "warning"]
