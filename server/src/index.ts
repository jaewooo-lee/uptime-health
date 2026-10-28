import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { initDatabase } from './db/index.js';
import { monitorRoutes } from './routes/monitors.js';
import { SchedulerService } from './services/scheduler.service.js';
import type { WebSocket } from 'ws';

const fastify = Fastify({
  logger: true,
});

// 웹소켓 클라이언트 풀 관리
const connectedClients = new Set<WebSocket>();

// 스케줄러 브로드캐스트 등록
SchedulerService.setBroadcaster((event, data) => {
  const payload = JSON.stringify({ type: event, data });
  for (const client of connectedClients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(payload);
    }
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

async function start() {
  try {
    await fastify.register(cors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    await fastify.register(websocket);

    fastify.register(async function (app) {
      app.get('/ws', { websocket: true }, (socket: WebSocket) => {
        connectedClients.add(socket);
        socket.send(JSON.stringify({ type: 'connected', message: 'Uptime-Health WebSocket Connected' }));

        socket.on('close', () => {
          connectedClients.delete(socket);
        });

        socket.on('error', () => {
          connectedClients.delete(socket);
        });
      });
    });

    // 라우트 등록
    await fastify.register(monitorRoutes);

    // 기본 헬스 체크
    fastify.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

    // 정적 프론트엔드 파일 서빙 (프로덕션 / Docker 환경)
    const possibleStaticPaths = [
      process.env.STATIC_DIR,
      path.resolve(process.cwd(), 'public'),
      path.resolve(process.cwd(), '../client/dist'),
    ].filter(Boolean) as string[];

    const staticPath = possibleStaticPaths.find((p) => fs.existsSync(p));

    if (staticPath) {
      console.log(`[Static] Serving UI from: ${staticPath}`);
      await fastify.register(fastifyStatic, {
        root: staticPath,
        prefix: '/',
      });

      fastify.setNotFoundHandler((req, reply) => {
        if (req.raw.url && (req.raw.url.startsWith('/api') || req.raw.url.startsWith('/ws'))) {
          reply.code(404).send({ error: 'Route not found' });
        } else {
          reply.sendFile('index.html');
        }
      });
    }

    initDatabase();
    await SchedulerService.startAll();

    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Uptime-Health Backend running at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

