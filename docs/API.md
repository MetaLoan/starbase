# Star API 文档

> 占星时间系统 REST API 参考

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **编码**: UTF-8

---

## 用户管理 API

### 创建用户

创建新用户并计算本命盘。

```http
POST /api/users
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 用户唯一标识 |
| `birthData.date` | string | ✅ | 出生时间 (ISO 8601) |
| `birthData.latitude` | number | ✅ | 出生地纬度 |
| `birthData.longitude` | number | ✅ | 出生地经度 |
| `birthData.timezone` | string | ✅ | 时区 (如 `Asia/Shanghai`) |
| `birthData.name` | string | - | 用户姓名 |
| `preferences` | object | - | 用户偏好设置 |

**示例请求**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user_001",
    "birthData": {
      "date": "1990-03-15T08:30:00",
      "latitude": 39.9042,
      "longitude": 116.4074,
      "timezone": "Asia/Shanghai",
      "name": "张三"
    }
  }'
```

**成功响应** `200 OK`

```json
{
  "success": true,
  "user": {
    "id": "user_001",
    "name": "张三",
    "createdAt": "2026-01-04T10:30:00.000Z",
    "sunSign": "双鱼座",
    "moonSign": "狮子座"
  }
}
```

---

### 获取用户列表

```http
GET /api/users
```

**查询参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `sunSign` | string | 按太阳星座筛选 (如 `aries`) |
| `moonSign` | string | 按月亮星座筛选 |
| `minAge` | number | 最小年龄 |
| `maxAge` | number | 最大年龄 |

**成功响应** `200 OK`

```json
{
  "count": 2,
  "userIds": ["user_001", "user_002"]
}
```

---

### 获取用户详情

```http
GET /api/users/:id
```

**成功响应** `200 OK`

```json
{
  "id": "user_001",
  "name": "张三",
  "createdAt": "2026-01-04T10:30:00.000Z",
  "birthData": {
    "date": "1990-03-15T08:30:00.000Z",
    "latitude": 39.9042,
    "longitude": 116.4074,
    "timezone": "Asia/Shanghai"
  },
  "natalChart": {
    "planets": [
      {
        "id": "sun",
        "name": "太阳",
        "symbol": "☉",
        "sign": "pisces",
        "signName": "双鱼座",
        "house": 10,
        "degree": 24.5
      }
    ],
    "ascendant": 75.3,
    "midheaven": 345.2,
    "dominantPlanets": ["venus", "neptune", "moon"],
    "chartRuler": "mercury",
    "elementBalance": {
      "fire": 3,
      "earth": 2,
      "air": 4,
      "water": 5
    },
    "modalityBalance": {
      "cardinal": 3,
      "fixed": 4,
      "mutable": 7
    }
  },
  "preferences": {
    "timezone": "Asia/Shanghai",
    "language": "zh-CN",
    "houseSystem": "equal"
  }
}
```

---

### 更新用户

```http
PATCH /api/users/:id
```

**请求体**: 需要更新的字段

**成功响应** `200 OK`

```json
{
  "success": true,
  "updatedAt": "2026-01-04T11:00:00.000Z"
}
```

---

### 删除用户

```http
DELETE /api/users/:id
```

**成功响应** `200 OK`

```json
{
  "success": true,
  "message": "User user_001 deleted"
}
```

---

## 用户快照 API ⭐

### 获取用户实时状态快照

这是智能体最常用的接口，一次调用获取用户的所有实时占星数据。

```http
GET /api/users/:id/snapshot
```

**成功响应** `200 OK`

```json
{
  "userId": "user_001",
  "timestamp": "2026-01-04T10:30:00.000Z",
  
  "natal": {
    "sunSign": "pisces",
    "moonSign": "leo",
    "risingSign": "gemini",
    "dominantPlanets": ["venus", "neptune", "moon"],
    "chartRuler": "mercury"
  },
  
  "current": {
    "age": 35,
    "profectionHouse": 12,
    "profectionTheme": "超越",
    "lordOfYear": "neptune",
    "progressedLunarPhase": "盈凸月期",
    "todayScore": 72,
    "todayMoonSign": "pisces",
    "todayTheme": "双鱼月亮 · 金星日",
    "weekScore": 65,
    "weekTheme": "平稳过渡的一周"
  },
  
  "activeTransits": [
    {
      "transitPlanet": "saturn",
      "natalPlanet": "sun",
      "aspect": "square",
      "exactness": 85,
      "interpretation": "行运土星入相本命太阳"
    }
  ],
  
  "upcomingEvents": [
    {
      "date": "2026-03-15T00:00:00.000Z",
      "event": "木星回归 (36岁)",
      "significance": "medium"
    }
  ],
  
  "lifeCycle": {
    "saturnCyclePhase": "成长期",
    "jupiterCyclePhase": "巩固期",
    "profectionCycle": 3,
    "overallTrend": "stable"
  }
}
```

---

## 预测 API

### 获取用户预测

```http
GET /api/users/:id/forecast
```

**查询参数**

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `type` | string | 预测类型 | `daily` |
| `date` | string | 日期 (ISO 8601) | 当前日期 |
| `startYear` | number | 起始年份 (yearly) | - |
| `endYear` | number | 结束年份 (yearly) | - |
| `age` | number | 年龄 (profection) | 当前年龄 |

**预测类型**

| type | 说明 |
|------|------|
| `daily` | 每日预测（含24小时详情） |
| `weekly` | 每周预测 |
| `yearly` | 人生趋势 |
| `profection` | 年限法 |
| `progression` | 推运 |

---

#### 每日预测

```http
GET /api/users/:id/forecast?type=daily&date=2026-01-04
```

**响应**

```json
{
  "type": "daily",
  "date": "2026-01-04T00:00:00.000Z",
  "dayOfWeek": "周六",
  "planetaryDay": "saturn",
  "planetaryHour": "jupiter",
  
  "moonPhase": {
    "phase": "上弦月",
    "illumination": 52.3,
    "isVoidOfCourse": false
  },
  "moonSign": "pisces",
  "moonSignName": "双鱼座",
  
  "overallScore": 72,
  "dimensions": {
    "action": 65,
    "communication": 70,
    "emotion": 80,
    "creativity": 75,
    "focus": 60
  },
  
  "activeAspects": [...],
  "theme": "双鱼月亮 · 土星日",
  "advice": "今日能量平稳，按计划行事即可。",
  "luckyHours": [9, 10, 14, 15],
  "challengingHours": [6, 7, 22, 23],
  
  "hourlyBreakdown": [
    {
      "hour": 0,
      "score": 55,
      "mood": "neutral",
      "moonSign": "pisces",
      "keywords": ["情感", "直觉", "融合"]
    }
  ]
}
```

---

#### 每周预测

```http
GET /api/users/:id/forecast?type=weekly&date=2026-01-04
```

**响应**

```json
{
  "type": "weekly",
  "startDate": "2025-12-30T00:00:00.000Z",
  "endDate": "2026-01-05T00:00:00.000Z",
  "weekNumber": 1,
  "overallTheme": "积极进取的一周",
  
  "keyDates": [
    {
      "date": "2026-01-01T00:00:00.000Z",
      "event": "新月",
      "significance": "high"
    }
  ],
  
  "dailySummaries": [
    {
      "date": "2025-12-30T00:00:00.000Z",
      "dayOfWeek": "周一",
      "score": 68,
      "moonSign": "capricorn",
      "theme": "摩羯月亮 · 月亮日"
    }
  ],
  
  "weeklyTransits": [...],
  
  "bestDaysFor": {
    "action": ["2026-01-02"],
    "communication": ["2026-01-03"],
    "rest": ["2026-01-05"],
    "creativity": ["2026-01-04"]
  }
}
```

---

#### 年限法

```http
GET /api/users/:id/forecast?type=profection&age=35
```

**响应**

```json
{
  "type": "profection",
  "year": 2025,
  "age": 35,
  "house": 12,
  "houseName": "第十二宫",
  "houseTheme": "超越",
  "houseKeywords": ["潜意识", "隐藏", "灵性", "自我消融"],
  "sign": "taurus",
  "signName": "金牛座",
  "lordOfYear": "venus",
  "lordName": "金星",
  "lordSymbol": "♀",
  "lordNatalHouse": 7,
  "lordNatalSign": "libra",
  "description": "这是内省与超越的一年..."
}
```

---

## 智能体 API ⭐

### 构建智能体上下文

为 LLM 构建格式化的用户上下文。

```http
POST /api/agent/context
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID |
| `query` | string | - | 用户问题 |
| `intent` | string | - | 意图: `forecast`, `analysis`, `advice`, `explanation` |
| `focusArea` | string | - | 关注领域: `career`, `relationship`, `health`, `finance`, `spiritual` |
| `format` | string | - | 返回格式: `json`, `text`, `prompt` |

**format 说明**

| format | 说明 | 用途 |
|--------|------|------|
| `json` | 完整 JSON 数据 | 程序处理 |
| `text` | 人类可读文本 | 日志、调试 |
| `prompt` | LLM 提示词格式 | 直接传给 LLM |

---

#### 示例：获取 LLM 提示词

```bash
curl -X POST http://localhost:3000/api/agent/context \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "query": "我的事业运势如何？",
    "focusArea": "career",
    "format": "prompt"
  }'
```

**响应**

```json
{
  "prompt": "## 用户占星档案\n\n### 本命配置\n- **太阳星座**: 双鱼座 (♓)\n- **月亮星座**: 狮子座 (♌)\n..."
}
```

---

### 智能体查询

处理用户问题并返回占星解读。

```http
POST /api/agent/query
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | ✅ | 用户ID |
| `query` | string | ✅ | 用户问题 |
| `intent` | string | - | 意图类型 |
| `focusArea` | string | - | 关注领域 |

**示例请求**

```bash
curl -X POST http://localhost:3000/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "query": "今天适合做什么？"
  }'
```

**响应**

```json
{
  "content": "今天是双鱼月亮日，整体能量评分 72/100...",
  
  "structured": {
    "summary": "今天是双鱼月亮日...",
    "keyPoints": [
      "今日评分: 72/100",
      "月亮在双鱼座",
      "双鱼月亮 · 土星日"
    ],
    "advice": [
      "适合开始新项目",
      "人际沟通会比较顺利"
    ]
  },
  
  "references": [
    {
      "type": "transit",
      "description": "行运木星三分本命金星"
    }
  ],
  
  "suggestedFollowUps": [
    "今天适合做什么？",
    "本周有什么需要注意的？",
    "我的事业运势如何？"
  ]
}
```

---

## 错误响应

所有错误响应遵循统一格式：

```json
{
  "error": "错误描述",
  "details": "详细信息（可选）"
}
```

**常见错误码**

| 状态码 | 说明 |
|--------|------|
| `400` | 请求参数错误 |
| `404` | 用户不存在 |
| `500` | 服务器内部错误 |

---

## 数据类型参考

### 星座 ID (ZodiacId)

```
aries, taurus, gemini, cancer, leo, virgo,
libra, scorpio, sagittarius, capricorn, aquarius, pisces
```

### 行星 ID (PlanetId)

```
sun, moon, mercury, venus, mars, jupiter,
saturn, uranus, neptune, pluto, northNode, chiron
```

### 元素 (Element)

```
fire, earth, air, water
```

### 模式 (Modality)

```
cardinal, fixed, mutable
```

---

## SDK 示例

### TypeScript/JavaScript

```typescript
class StarClient {
  constructor(private baseUrl = 'http://localhost:3000/api') {}

  async createUser(id: string, birthData: BirthData) {
    const res = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, birthData })
    });
    return res.json();
  }

  async getSnapshot(userId: string) {
    const res = await fetch(`${this.baseUrl}/users/${userId}/snapshot`);
    return res.json();
  }

  async getDailyForecast(userId: string, date?: string) {
    const params = new URLSearchParams({ type: 'daily' });
    if (date) params.set('date', date);
    const res = await fetch(`${this.baseUrl}/users/${userId}/forecast?${params}`);
    return res.json();
  }

  async askAgent(userId: string, query: string) {
    const res = await fetch(`${this.baseUrl}/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, query })
    });
    return res.json();
  }
}

// 使用
const client = new StarClient();
const snapshot = await client.getSnapshot('user_001');
const response = await client.askAgent('user_001', '今天运势如何？');
```

### Python

```python
import requests

class StarClient:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
    
    def create_user(self, user_id: str, birth_data: dict):
        return requests.post(
            f'{self.base_url}/users',
            json={'id': user_id, 'birthData': birth_data}
        ).json()
    
    def get_snapshot(self, user_id: str):
        return requests.get(
            f'{self.base_url}/users/{user_id}/snapshot'
        ).json()
    
    def get_daily_forecast(self, user_id: str, date: str = None):
        params = {'type': 'daily'}
        if date:
            params['date'] = date
        return requests.get(
            f'{self.base_url}/users/{user_id}/forecast',
            params=params
        ).json()
    
    def ask_agent(self, user_id: str, query: str):
        return requests.post(
            f'{self.base_url}/agent/query',
            json={'userId': user_id, 'query': query}
        ).json()

# 使用
client = StarClient()
snapshot = client.get_snapshot('user_001')
response = client.ask_agent('user_001', '今天运势如何？')
```

