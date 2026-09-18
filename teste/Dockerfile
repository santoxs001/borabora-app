# Serviço ONVIF falso das câmeras de teste (sem dependências externas)
FROM python:3.12-alpine

ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY teste/onvif_stub.py /app/onvif_stub.py

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${ONVIF_PORTA:-5000}/estado" || exit 1

CMD ["python", "/app/onvif_stub.py"]
