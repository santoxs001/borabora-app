# Imagem do gerador de configs: roda uma vez a cada "docker compose up"
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
RUN pip install --no-cache-dir PyYAML==6.0.2 bcrypt==4.2.1

WORKDIR /projeto
CMD ["python", "/projeto/scripts/gerar_configs.py"]
