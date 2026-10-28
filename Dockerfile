# ==========================================
# Stage 1: Build Frontend (React + Vite)
# ==========================================
FROM node:24-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend (Fastify + TS)
# ==========================================
FROM node:24-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# ==========================================
# Stage 3: Production Runner (Single Container)
# ==========================================
FROM node:24-alpine AS runner

# Ping (ICMP) 지원을 위한 패키지 설치
RUN apk add --no-cache iputils-ping ca-certificates

WORKDIR /app

# 프로덕션 의존성만 설치
COPY server/package*.json ./
RUN npm ci --omit=dev

# 서버 빌드 파일 및 프론트엔드 정적 파일 복사
COPY --from=server-builder /app/server/dist ./dist
COPY --from=client-builder /app/client/dist ./public

# SQLite 데이터 저장을 위한 볼륨 디렉터리 준비
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3001
ENV STATIC_DIR=/app/public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/health || exit 1

CMD ["node", "dist/index.js"]
