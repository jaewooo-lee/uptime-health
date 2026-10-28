# 🚀 Uptime-Health

> **A fancy, lightweight, self-hosted system health check & uptime monitoring tool**  
> [Uptime Kuma](https://github.com/louislam/uptime-kuma)에서 영감을 받아 제작된 초경량 셀프 호스팅 시스템 헬스체크 및 실시간 가동 모니터링 도구입니다.

---

## 🌟 주요 특징 (Key Features)

- **멀티 프로토콜 헬스체크**:
  - 🌐 **HTTP / HTTPS**: 상태 코드 범위 검증(200-299 등), 응답 시간(Latency), 본문 키워드 매칭, 타임아웃
  - 🔌 **TCP Port**: 지정된 Host:Port 소켓 연결 및 RTT 측정 (MySQL, PostgreSQL, Redis, SSH 등 점검)
  - 📡 **Ping (ICMP)**: 크로스 플랫폼 Ping 실행 래퍼를 통해 별도 관리자 권한 없이 패킷 왕복 시간 및 손실률 점검
- **크로스 플랫폼 반응형 UI (데스크톱 & 모바일 웹 완벽 대응)**:
  - **데스크톱 (Wide 2-Pane)**: 좌측 모니터 검색/필터 사이드바 + 우측 상세 메트릭 및 인시던트 로그 패널
  - **모바일 웹**: 스마트폰 화면에 최적화된 카드 뷰, 화면 폭에 맞춰 32블록으로 자동 적응되는 하트비트 바, 하단 바텀 내비게이션(Bottom Nav), 터치 팝오버 툴팁
  - **PWA 지원**: 모바일 브라우저에서 "홈 화면에 추가" 시 브라우저 바 없는 독립 앱 모드로 구동
- **Uptime Kuma 스타일 Heartbeat Bar & 실시간 그래프**:
  - 최근 점검 내역을 블록(녹색 UP / 적색 DOWN)으로 시각화
  - 순수 SVG 기반의 초경량 실시간 Latency(응답시간 추이) 라인 차트 탑재
- **Zero-Config 내장 SQLite 스토리지**:
  - Node.js 24 내장 `node:sqlite`를 사용하여 외부 DB 설치나 C++ 네이티브 컴파일 없이 파일 하나(`server/data/uptime.db`)로 모든 이력 영속화
- **등록 전 "연결 테스트(Test)" 기능**:
  - 새 모니터 등록 전 대상 서버의 생존 여부와 지연시간(ms)을 즉시 시뮬레이션
- **실시간 WebSocket 연동**:
  - 헬스체크 결과가 기록될 때마다 브라우저 새로고침 없이 대시보드가 실시간으로 자동 갱신

---

## 🛠️ 기술 스택 (Tech Stack)

### Backend
- **Runtime**: Node.js v24+
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: Node.js Built-in SQLite (`node:sqlite`)
- **Realtime**: `@fastify/websocket` (WebSocket)
- **Validation**: Zod

### Frontend
- **Framework**: React 19 + TypeScript (Vite)
- **Styling**: Tailwind CSS v4 (OLED 다크 테마 기본 지원)
- **Icons**: Lucide React
- **Chart**: Custom Responsive SVG Latency Line Chart

---

## 📂 프로젝트 구조 (Directory Structure)

```
uptime-health/
├── PLAN.md                   # 상세 개발 계획서 및 단계별 로드맵
├── README.md                 # 프로젝트 문서 및 사용 가이드
├── package.json              # 루트 통합 실행 스크립트
├── start.bat                 # Windows 원클릭 실행 배치 스크립트
├── server/                   # 백엔드 서버 (Fastify + SQLite + Probers)
│   ├── data/
│   │   └── uptime.db         # 내장 SQLite 데이터베이스
│   ├── src/
│   │   ├── db/               # DB 스키마 및 마이그레이션
│   │   ├── probers/          # HTTP, TCP, Ping 프로빙 모듈
│   │   ├── routes/           # REST API 엔드포인트
│   │   ├── services/         # 모니터 관리 및 스케줄러 서비스
│   │   ├── types.ts          # 백엔드 타입 정의
│   │   └── index.ts          # 백엔드 진입점
│   ├── package.json
│   └── tsconfig.json
└── client/                   # 프론트엔드 대시보드 (React + Vite)
    ├── src/
    │   ├── components/       # Header, MonitorCard, MonitorDetail,
    │   │                     # HeartbeatBar, LatencyChart, AddMonitorModal, BottomNav
    │   ├── hooks/            # useMonitors (REST & WebSocket 통합 훅)
    │   ├── types.ts          # 프론트엔드 타입 정의
    │   ├── App.tsx           # 메인 반응형 레이아웃
    │   └── index.css         # Tailwind 스타일
    ├── index.html            # PWA 메타 태그
    ├── vite.config.ts        # Vite 설정 및 API/WS 프록시
    └── package.json
```

---

## 💻 구동 방법 (How to Run)

### 사전 요구사항 (Prerequisites)
- [Node.js](https://nodejs.org/) v24 이상 (내장 `node:sqlite` 지원 필요)

---

### 방법 1: Docker로 단일 컨테이너 실행 (권장)
복잡한 의존성 설치 없이 Docker 명령어 하나로 백엔드와 프론트엔드가 통합된 단일 컨테이너를 구동할 수 있습니다:

```bash
# Docker Compose로 실행 (가장 간편)
docker compose up -d

# 또는 Docker CLI 직접 실행
docker build -t uptime-health .
docker run -d -p 3001:3001 -v uptime-data:/app/data --name uptime-health --restart unless-stopped uptime-health
```
> 구동 후 브라우저에서 **`http://localhost:3001`** 로 접속하시면 대시보드와 API가 모두 통합 제공됩니다.

---

### 방법 2: Windows 원클릭 실행 (로컬 Node.js 환경)
루트 폴더의 **[`start.bat`](file:///c:/Users/jaewo/workspace/uptime-health/start.bat)** 파일을 더블클릭하면 백엔드(3001)와 프론트엔드(5173)가 동시에 실행됩니다.

---

### 방법 3: 터미널 명령어로 동시 실행 (로컬 Node.js 환경)
루트 디렉터리에서 아래 명령을 실행합니다:

```bash
# 최초 의존성 설치 (필요시)
npm install
npm --prefix server install
npm --prefix client install

# 백엔드 + 프론트엔드 동시 실행
npm run dev
```

---

### 방법 3: 백엔드와 프론트엔드 개별 실행

**1) 백엔드 실행 (Port: 3001)**
```bash
cd server
npm run dev
```

**2) 프론트엔드 실행 (Port: 5173)**
```bash
cd client
npm run dev
```

---

## 📱 대시보드 접속 안내

- **PC / 일반 웹 브라우저**:  
  👉 **[http://localhost:5173](http://localhost:5173)**

- **스마트폰 / 태블릿 (모바일 웹)**:  
  PC와 동일한 Wi-Fi 네트워크에 연결된 기기에서 PC의 로컬 IP로 접속합니다.  
  👉 `http://<내_PC_IP>:5173` (예: `http://172.30.1.180:5173`)
  > **Tip**: Safari 또는 Chrome의 공유 메뉴에서 **"홈 화면에 추가(Add to Home Screen)"**를 누르면 풀스크린 모바일 앱처럼 사용할 수 있습니다.

---

## 🔌 API 명세 (REST Endpoints)

| Method | Endpoint | 설명 |
|:---|:---|:---|
| `GET` | `/health` | 서버 상태 헬스체크 |
| `GET` | `/api/monitors` | 모든 모니터 목록, 최근 하트비트(60개) 및 통계 조회 |
| `POST` | `/api/monitors` | 새 모니터 등록 (HTTP / TCP / PING) |
| `GET` | `/api/monitors/:id` | 특정 모니터 상세 정보 및 통계 조회 |
| `PUT` | `/api/monitors/:id` | 모니터 설정 수정 |
| `DELETE` | `/api/monitors/:id` | 모니터 삭제 |
| `POST` | `/api/monitors/:id/probe` | 즉시 수동 헬스체크 실행 (Manual Probe) |
| `POST` | `/api/monitors/test` | 등록 전 임시 헬스체크 시뮬레이션 (연결 테스트) |
| `WS` | `/ws` | 실시간 하트비트 및 상태 변경 브로드캐스트 WebSocket |

---

## 🗺️ 상세 로드맵
전체 아키텍처 다이어그램 및 향후 계획(Discord/Slack 알림, SSL 만료일 점검, Docker 패키징)은 **[`PLAN.md`](./PLAN.md)** 문서를 참조하세요.
