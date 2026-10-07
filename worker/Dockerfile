# Video worker image: Node + system ffmpeg + Noto Devanagari fonts (correct Hindi text in social / flash videos).
FROM node:22-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-noto-core fontconfig ca-certificates \
 && rm -rf /var/lib/apt/lists/* && fc-cache -f
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NODE_ENV=production \
    RUN_MIGRATIONS=false \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    VIDEO_FONT="Noto Sans Devanagari" \
    NODE_OPTIONS=--no-deprecation
CMD ["npx", "payload", "run", "worker/run.ts"]
