FROM python:3.12-slim

WORKDIR /app

COPY server.py /app/server.py
COPY ui /app/ui

EXPOSE 8000

CMD ["python", "/app/server.py"]
