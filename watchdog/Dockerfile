# Watchdog das câmeras - Buffet Bora Bora
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=America/Sao_Paulo

# ffprobe: confere se o vídeo realmente chega. iputils-ping: checagem de rede.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg iputils-ping curl tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY watchdog/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY comum /app/comum
COPY watchdog/app /app/app

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8080/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "warning"]
