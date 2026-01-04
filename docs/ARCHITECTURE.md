# Star 系统架构

## 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层                                  │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│  Web App    │  Mobile App │  小程序      │  智能体      │  其他    │
│  (React)    │  (Flutter)  │  (WeChat)   │  (Agent)    │         │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────┬────┘
       │             │             │             │           │
       └─────────────┴─────────────┴─────────────┴───────────┘
                                   │
                          ┌────────▼────────┐
                          │   REST API 层    │
                          │  (Next.js API)   │
                          └────────┬────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
┌──────▼──────┐           ┌────────▼────────┐         ┌───────▼───────┐
│  用户服务    │           │   智能体服务     │         │   预测服务     │
│ UserService │           │  AgentService   │         │ ForecastService│
└──────┬──────┘           └────────┬────────┘         └───────┬───────┘
       │                           │                           │
       └───────────────────────────┴───────────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │   占星计算核心    │
                          │   (lib/astro)   │
                          └────────┬────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
┌──────▼──────┐           ┌────────▼────────┐         ┌───────▼───────┐
│   星历计算   │           │    相位计算      │         │   趋势计算     │
│  Ephemeris  │           │    Aspects      │         │   Trends      │
└─────────────┘           └─────────────────┘         └───────────────┘
```

---

## 模块说明

### 1. 占星计算核心 (`src/lib/astro/`)

纯 TypeScript 实现，无任何 UI 依赖，可独立使用。

| 模块 | 文件 | 功能 |
|------|------|------|
| 常量 | `constants.ts` | 星座、行星、宫位、相位定义 |
| 星历 | `ephemeris.ts` | 行星位置计算、儒略日转换 |
| 相位 | `aspects.ts` | 相位检测、图案识别 |
| 本命 | `natal-chart.ts` | 本命盘计算 |
| 行运 | `transits.ts` | 行运相位、重大行运 |
| 推运 | `progressions.ts` | 次限法推运 |
| 年限 | `profections.ts` | 年限法 |
| 每日 | `daily-forecast.ts` | 每时/每日/每周预测 |
| 趋势 | `life-trend.ts` | 人生趋势函数 |

### 2. 服务层 (`src/lib/services/`)

业务逻辑封装，连接计算核心与 API 层。

| 服务 | 功能 |
|------|------|
| `UserService` | 用户 CRUD、快照生成、批量查询 |

### 3. API 层 (`src/app/api/`)

RESTful 接口，供各端调用。

```
/api/
├── users/                    # 用户管理
│   ├── GET/POST             # 列表/创建
│   └── [id]/
│       ├── GET/PATCH/DELETE # 详情/更新/删除
│       ├── snapshot/        # 实时快照
│       └── forecast/        # 预测数据
│
└── agent/                    # 智能体接口
    ├── context/             # 上下文构建
    └── query/               # 查询处理
```

### 4. 前端层 (`src/components/`, `src/app/`)

React + HeroUI 实现的 Web 界面。

---

## 数据流

### 用户创建流程

```
Client                API              Service           Astro
  │                    │                 │                │
  │ POST /users        │                 │                │
  ├───────────────────►│                 │                │
  │                    │ createUser()    │                │
  │                    ├────────────────►│                │
  │                    │                 │ calculateNatalChart()
  │                    │                 ├───────────────►│
  │                    │                 │                │
  │                    │                 │◄───────────────┤
  │                    │                 │   NatalChart   │
  │                    │◄────────────────┤                │
  │                    │    UserProfile  │                │
  │◄───────────────────┤                 │                │
  │      Response      │                 │                │
```

### 智能体查询流程

```
Agent             API              Service           LLM
  │                │                 │                │
  │ POST /agent/query               │                │
  ├───────────────►│                 │                │
  │                │ getUserSnapshot()               │
  │                ├────────────────►│                │
  │                │◄────────────────┤                │
  │                │                 │                │
  │                │ buildPromptContext()            │
  │                ├────────────────►│                │
  │                │◄────────────────┤                │
  │                │                 │                │
  │                │ [可选] LLM 调用   │                │
  │                ├─────────────────┼───────────────►│
  │                │                 │                │
  │                │◄────────────────┼────────────────┤
  │◄───────────────┤                 │                │
  │  AgentResponse │                 │                │
```

---

## 扩展指南

### 添加新的预测类型

1. 在 `lib/astro/` 下创建计算模块
2. 在 `index.ts` 中导出
3. 在 `user-service.ts` 中添加服务方法
4. 在 API 路由中添加端点

### 接入 LLM

修改 `src/app/api/agent/query/route.ts`:

```typescript
// 替换 generateRuleBasedResponse 为:
async function generateLLMResponse(context, query) {
  const prompt = buildPromptContext(context);
  
  // OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt + '\n\n' + query }
    ]
  });
  
  return {
    content: response.choices[0].message.content,
    // ...
  };
}
```

### 添加数据库持久化

1. 安装数据库驱动 (如 `prisma`, `mongoose`)
2. 定义数据模型
3. 修改 `user-service.ts` 中的存储逻辑

```typescript
// 将内存存储替换为数据库
// const userStore = new Map();
// 改为:
import { prisma } from './prisma';

export async function createUser(id, birthData) {
  return prisma.user.create({
    data: { id, birthData, natalChart: calculateNatalChart(birthData) }
  });
}
```

### 添加认证

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.headers.get('Authorization');
  
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 性能考虑

### 计算缓存

本命盘计算结果在用户创建时缓存，避免重复计算。

### 预测缓存

对于频繁访问的预测数据，可添加 Redis 缓存：

```typescript
async function getCachedDailyForecast(userId: string, date: string) {
  const cacheKey = `forecast:${userId}:${date}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const forecast = calculateDailyForecast(...);
  await redis.set(cacheKey, JSON.stringify(forecast), 'EX', 3600);
  
  return forecast;
}
```

### 批量处理

对于智能体批量查询，使用 `batchGetUserSnapshots`:

```typescript
const snapshots = batchGetUserSnapshots(['user_001', 'user_002', 'user_003']);
```

---

## 安全考虑

1. **输入验证**: 所有 API 输入都应验证
2. **速率限制**: 防止滥用
3. **数据隔离**: 用户只能访问自己的数据
4. **敏感信息**: 出生数据属于敏感信息，需加密存储

