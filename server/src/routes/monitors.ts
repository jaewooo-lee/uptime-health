import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { MonitorService } from '../services/monitor.service.js';
import { SchedulerService } from '../services/scheduler.service.js';
import { probeMonitor } from '../probers/index.js';

const monitorSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  type: z.enum(['HTTP', 'TCP', 'PING']),
  target: z.string().min(1, '대상 호스트/URL을 입력해주세요'),
  port: z.number().int().min(1).max(65535).optional().nullable(),
  interval: z.number().int().min(5).default(60),
  timeout: z.number().int().min(1).max(60).default(10),
  max_retries: z.number().int().min(1).max(10).default(1),
  expected_status: z.string().optional().nullable(),
  keyword: z.string().optional().nullable(),
});

export const monitorRoutes: FastifyPluginAsync = async (fastify) => {
  // 모니터 목록 + 최근 60개 하트비트 & 통계
  fastify.get('/api/monitors', async () => {
    const monitors = MonitorService.getAllMonitors();
    return monitors.map((m) => {
      const stats = MonitorService.getMonitorStats(m.id);
      return {
        ...m,
        heartbeats: stats.heartbeats,
        uptime24h: stats.uptime24h,
        avgLatency: stats.avgLatency,
      };
    });
  });

  // 단건 상세 조회
  fastify.get('/api/monitors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const monitor = MonitorService.getMonitorById(Number(id));
    if (!monitor) {
      return reply.code(404).send({ error: 'Monitor not found' });
    }
    const stats = MonitorService.getMonitorStats(monitor.id);
    return {
      ...monitor,
      ...stats,
    };
  });

  // 모니터 생성
  fastify.post('/api/monitors', async (request, reply) => {
    const parsed = monitorSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }

    const monitor = MonitorService.createMonitor(parsed.data);
    SchedulerService.scheduleMonitor(monitor);
    // 즉시 첫 프로빙 실행
    setTimeout(() => SchedulerService.runProbe(monitor.id), 100);

    return reply.code(201).send(monitor);
  });

  // 모니터 수정
  fastify.put('/api/monitors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = monitorSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }

    const updated = MonitorService.updateMonitor(Number(id), parsed.data);
    if (!updated) {
      return reply.code(404).send({ error: 'Monitor not found' });
    }

    SchedulerService.scheduleMonitor(updated);
    return updated;
  });

  // 모니터 삭제
  fastify.delete('/api/monitors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const monitorId = Number(id);

    SchedulerService.stopMonitor(monitorId);
    const success = MonitorService.deleteMonitor(monitorId);
    if (!success) {
      return reply.code(404).send({ error: 'Monitor not found' });
    }
    return { success: true };
  });

  // 즉시 프로빙 실행 (Manual Check)
  fastify.post('/api/monitors/:id/probe', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await SchedulerService.runProbe(Number(id));
    if (!result) {
      return reply.code(404).send({ error: 'Monitor not found or inactive' });
    }
    return result;
  });

  // 단발성 테스트 (등록 전 확인용)
  fastify.post('/api/monitors/test', async (request, reply) => {
    const parsed = monitorSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }

    const dummyMonitor: any = {
      ...parsed.data,
      id: 0,
      active: 1,
      current_status: 'PENDING',
    };

    const result = await probeMonitor(dummyMonitor);
    return result;
  });
};
