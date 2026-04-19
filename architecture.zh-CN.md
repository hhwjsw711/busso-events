# Busso Events 架构说明

## 1. 项目概述

Busso Events 是一个全栈 TypeScript 应用，用于聚合本地活动、抓取并补充活动详情、提供语义化搜索发现能力，并通过邮件向订阅用户发送通知。

系统主要分为两部分：

- **前端 SPA**：位于 `src/` 的 React + Vite 应用
- **后端平台**：位于 `convex/` 的 Convex 函数、数据库、认证、调度与异步任务系统

从整体上看，产品主流程如下：

1. 管理员配置活动来源
2. 抓取来源页面，提取候选活动
3. 新活动写入 Convex
4. 对每个活动再次抓取，补全更丰富的活动详情
5. 为活动生成 embedding，用于语义搜索与匹配
6. 将活跃订阅与未来活动进行匹配
7. 将匹配结果写入邮件队列
8. 由邮件任务批量向用户发送通知

## 2. 技术栈

### 前端
- **React 19**
- **Vite 6**
- **Mantine**：UI 组件、通知、表单、日期组件
- **type-route**：前端路由

### 后端 / 平台
- **Convex**：数据库、query、mutation、action、定时任务与 HTTP 认证路由
- **@convex-dev/auth**：认证
- **@convex-dev/workpool**：受控并发的后台异步任务
- **convex-helpers**：管理员权限包装器

### 外部集成
- **OpenAI** 用于：
  - 从抓取内容中提取活动信息
  - 提取活动详情
  - 生成文本 embedding
- **Jina Reader API**：将网页抓取为 markdown 文本
- **Resend**：发送邮件

### 工具链
- **TypeScript**
- **Vitest**：测试
- **ESLint**
- **Prettier**
- **Cloudflare Wrangler**：静态前端部署配置

## 3. 仓库结构

```text
busso-events/
├── convex/                 # 后端逻辑、schema、认证、任务
│   ├── events/             # 活动 API 与异步处理
│   ├── eventSources/       # 来源管理、调度、测试抓取
│   ├── scraping/           # Jina + OpenAI 抓取流水线
│   ├── embeddings/         # Embedding 生成
│   ├── subscriptions/      # 订阅 CRUD 与匹配
│   ├── emails/             # 邮件队列与投递
│   ├── _generated/         # Convex 生成的类型与 API
│   ├── auth.ts             # Convex Auth 配置
│   ├── schema.ts           # 数据库 schema
│   ├── crons.ts            # 周期性清理任务
│   ├── http.ts             # HTTP 路由 + 认证路由
│   └── convex.config.ts    # Workpool 组件注册
├── src/                    # React 前端
│   ├── components/         # 共享组件与管理页面
│   ├── events/             # 活动 UI 与调试页面
│   ├── subscriptions/      # 订阅 UI 与调试页面
│   ├── utils/              # 前端工具函数
│   ├── App.tsx
│   ├── Routes.tsx
│   └── router.ts
├── shared/                 # 共享 TypeScript 工具
├── public/                 # 静态资源
├── setup.mjs               # 开发环境下的 Convex Auth 初始化辅助脚本
├── wrangler.jsonc          # 静态资源部署配置
└── TESTING_REQUIREMENTS.md # 测试策略与要求
```

## 4. 前端架构

前端是一个单页应用。

### 启动入口
- `src/main.tsx` 使用 `VITE_CONVEX_URL` 创建 `ConvexReactClient`
- 应用外层包裹：
  - `ConvexAuthProvider`
  - `MantineProvider`
  - `Notifications`

### 路由
路由定义集中在 `src/router.ts`，由 `src/Routes.tsx` 负责渲染。

#### 公开路由
- `/` 首页
- `/login`
- `/event/:eventId`

#### 已登录用户路由
- `/subscriptions`
- `/subscriptions/create`
- `/subscriptions/:subscriptionId`

#### 管理员路由
- `/admin`
- `/admin/sources`
- `/admin/sources/add`
- `/admin/sources/:sourceId`
- `/admin/event/:eventId/debug`
- `/admin/subscriptions/debug`
- `/admin/workpools/:workpoolType/debug`

### UI 访问控制
- `AuthRequired`：保护登录后页面
- `AdminRequired`：保护管理员页面
- `AuthenticatedPageLayout`：登录后页面的统一布局

### 前端职责边界
前端整体上是 Convex 的薄客户端：
- 通过 Convex query 读取状态
- 通过 mutation / action 触发流程
- 授权与业务编排主要依赖后端实现

这意味着核心业务逻辑主要集中在 `convex/`，而不是 React 组件内。

## 5. 后端架构

后端按领域划分，组织在 `convex/` 目录下。

### 5.1 认证
认证在 `convex/auth.ts` 中通过 Convex Auth 配置。

当前状态：
- **已启用 Google provider**
- `Password` 已导入，但暂未启用

`convex/http.ts` 会把认证相关 HTTP 路由挂载到 Convex router 上。

与用户认证状态相关的查询包括：
- `convex/auth.ts` -> `loggedInUser`
- `convex/users.ts` -> `current`、`isCurrentUserAdmin`

### 5.2 管理员授权
管理员授权通过 `convex/utils.ts` 中的 `adminQuery`、`adminMutation`、`adminAction` 实现。

管理员判定依据为 `users.isAdmin === true`。

这意味着：
- 前端路由守卫主要提升使用体验
- 真正的权限边界在 Convex 侧的管理员包装器中

### 5.3 领域模块

#### Events
`convex/events/` 负责：
- 活动公开列表与搜索
- 活动详情读取
- 管理员操作
- 抓取 / embedding / 匹配的异步编排
- workpool 状态与调试支持

#### Event sources
`convex/eventSources/` 负责：
- 来源 CRUD
- 测试抓取
- 定时重复抓取
- 来源抓取状态记录

#### Scraping
`convex/scraping/` 负责：
- Jina 抓取
- 内容清洗
- 基于 OpenAI prompt 的信息提取
- 区分来源页抓取和活动详情页抓取

#### Embeddings
`convex/embeddings/` 负责：
- 通用 embedding 生成
- 活动描述 embedding
- 订阅 prompt embedding
- 缺失 embedding 的批量补全

#### Subscriptions
`convex/subscriptions/` 负责：
- 用户订阅 CRUD
- 订阅数据校验
- 带队列信息的订阅读取
- 活动与订阅匹配
- 邮件 workpool 调度

#### Emails
`convex/emails/` 负责：
- 邮件队列读写
- 队列清理
- 通过 Resend 投递邮件
- 管理员邮件相关操作

## 6. 数据模型

schema 定义在 `convex/schema.ts` 中，包含 Convex Auth 默认表以及应用自定义表。

### 6.1 `events`
用于存储标准化后的活动记录。

关键字段：
- `title`、`description`、`eventDate`、`imageUrl`、`url`
- `sourceId`
- `lastScraped`
- `scrapedData`：包含 location、organizer、price、category、tags、registration URL 等提取出的元数据
- `descriptionEmbedding`
- 与抓取、embedding、订阅匹配相关的 workpool 跟踪字段

索引：
- 按日期
- 按 URL
- 标题全文搜索
- 描述全文搜索
- embedding 向量索引

### 6.2 `eventSources`
用于存储待抓取的网站来源。

关键字段：
- `name`
- `startingUrl`
- `isActive`
- `dateLastScrape`
- 下一次定时抓取的任务 ID / 时间

### 6.3 `testScrapes`
用于记录管理员手动触发的测试抓取任务。

字段包括：
- URL
- 状态
- 进度阶段 / 文案
- 结果载荷
- 时间戳

### 6.4 `subscriptions`
这是一个带判别字段的 union，有两种类型：

#### Prompt 订阅
- `kind: "prompt"`
- `prompt`
- `promptEmbedding`
- 活跃状态与邮件调度字段

#### 全部活动订阅
- `kind: "all_events"`
- 没有 prompt 文本
- 其余活跃状态与邮件调度字段相同

两类订阅共有字段：
- `userId`
- `isActive`
- `lastEmailSent`
- `nextEmailScheduled`
- `emailFrequencyHours`
- 邮件 workpool 跟踪字段

### 6.5 `emailQueue`
用于存储每个订阅对应的待发送或已发送活动通知。

字段：
- `subscriptionId`
- `eventId`
- `matchScore`
- `matchType`
- `queuedAt`
- `emailSent`
- `emailSentAt`

### 6.6 `jobs`
用于跟踪批量抓取相关任务的进度。

### 6.7 `users`
在认证用户表基础上扩展，重点增加了 `isAdmin` 字段。

## 7. 运行时数据流

## 7.1 来源采集流程

1. 管理员创建或启用一个 `eventSource`
2. `performSourceScrape` 通过 Jina 抓取 `startingUrl`
3. OpenAI 从抓取到的 markdown 中提取候选活动
4. 按 URL 做去重
5. 新活动写入 `events`
6. `updateLastScrapeTime` 记录本次抓取时间并安排下一次抓取

关键行为：
- 来源的重复抓取采用**按来源单独调度**，而不是由 cron 做统一 fanout
- 下一次抓取通常安排在大约 **3 天后**
- 调度信息持久化在 source 行上，避免出现孤儿任务

## 7.2 活动补全流程

当一个新活动被创建时：

1. `createInternal` 写入基础活动记录
2. 将活动详情抓取任务加入 `eventScrapeWorkpool`
3. `performEventScrape` 抓取活动详情页
4. 将抓取结果标准化写入 `scrapedData`
5. 可能基于抓取结果更新描述和图片
6. 抓取完成回调继续安排 embedding 生成
7. 同一个回调也会安排延迟的订阅匹配任务

关键行为：
- 订阅匹配会在抓取完成后延迟约 **8 小时**执行
- 即使详情抓取失败，系统仍会安排 embedding fallback 和匹配流程

## 7.3 搜索流程

系统里有两种搜索路径。

### 基础搜索
`convex/events/events.ts` -> `search`
- 对标题和描述做全文搜索
- 支持可选日期过滤
- 结果按活动日期排序

### 增强搜索
`convex/events/events.ts` -> `enhancedSearch`
- 先为搜索词生成 embedding
- 再通过 `ctx.vectorSearch` 搜索 `events.by_embedding`
- 合并文本匹配与语义匹配结果
- 去重后再做日期过滤

这条路径是应用中语义化活动发现的主要实现。

## 7.4 订阅匹配流程

系统里有两种匹配场景：

### 真正用于邮件通知的后台匹配流程
`convex/subscriptions/subscriptionsMatching.ts`

对每个未来活动：
1. 读取全部活跃订阅
2. 对 `all_events` 类型直接命中
3. 对 prompt 订阅：
   - 如果订阅和活动都已有 embedding，则直接计算余弦相似度
   - 否则回退到标题 / 描述上的关键词匹配
4. 将匹配结果写入 `emailQueue`

这说明真正的通知流水线在 embedding 存在时，**是支持语义匹配的**。

### 预览 / 辅助查询路径
部分辅助查询，例如 `searchEventsByEmbedding`，当前仍然是返回 `[]` 的占位实现，因为那条路径里没有真正执行 Convex 向量搜索。

影响：
- 订阅预览类功能的语义匹配还不完整
- 但主通知链路仍然可用，因为它依赖的是已存储 embedding 之间的直接余弦相似度计算，而不是那个占位 query

## 7.5 邮件队列与投递流程

1. 匹配成功的活动写入 `emailQueue`
2. 队列插入时会按 `(subscriptionId, eventId)` 去重
3. 如有需要，`ensureEmailWorkpoolJobScheduled` 会为该订阅安排一个邮件任务
4. 延迟时间由 `emailFrequencyHours` 决定
5. `performSubscriptionEmail` 调用 `sendSubscriptionEmailInternal`
6. 生产环境下由 Resend 实际发送邮件
7. 队列项被标记为已发送
8. 更新 `lastEmailSent` 与 `nextEmailScheduled`

关键行为：
- 邮件任务是**以订阅为中心**，不是全局批量统一发送
- 每个订阅始终只保留一个活跃的邮件 workpool 任务
- 在开发模式下（`IS_PROD != "true"`），系统会跳过真实 Resend 调用，但仍然把队列推进到“已发送”状态

## 8. 异步处理模型

系统同时使用两种异步机制。

### 8.1 Workpool
在 `convex/convex.config.ts` 中注册，但真正的并发限制是在各模块实例化 pool 时设置的。

当前 workpool：
- `eventScrapeWorkpool` -> 最大并发 1
- `eventEmbeddingWorkpool` -> 最大并发 2
- `subscriptionMatchWorkpool` -> 最大并发 1
- `subscriptionEmailWorkpool` -> 最大并发 2

用途包括：
- 限制第三方 API 压力
- 在必要场景下串行化关键处理步骤
- 提供状态检查与取消能力

### 8.2 Scheduled functions / cron
目前用于：
- 按来源安排下一次抓取
- 每 3 小时清理一次过期的 `emailQueue` 数据

## 9. 外部服务边界

### Jina
作为原始网页内容获取层。

需要：
- `JINA_API_KEY`

### OpenAI
承担两类职责：
- 用 chat completion 从 markdown 中抽取结构化活动数据
- 用 embeddings 支持语义搜索与订阅匹配

需要：
- `OPENAI_API_KEY`

### Resend
用于发送订阅邮件。

需要：
- `RESEND_API_KEY`
- 可选 `EMAIL_FROM_ADDRESS`

### Site URL
用于邮件模板中的站点链接：
- `CONVEX_SITE_URL`

## 10. 部署与环境

### 本地开发
`npm run dev` 会同时运行前端和后端。

从 `package.json` 可以看到的特点：
- `predev` 会先执行 Convex 相关初始化步骤
- `setup.mjs` 用于帮助完成 Convex Auth 的环境初始化
- 启动过程中会打开 `convex dashboard`

### 前端部署
`wrangler.jsonc` 表明前端是以 `dist/` 静态资源的形式部署，并启用了 SPA fallback。

所以前端部署模型本质上是：
- 使用 Vite 构建静态 SPA
- 用兼容 Cloudflare 的静态资源托管方式对外提供服务

### 后端部署
Convex 独立承载后端函数与数据，与静态前端部署分离。

## 11. 测试现状

从仓库中可见的测试主要集中在抓取逻辑。

当前信号：
- 存在 `convex/scraping/scraping.test.ts`
- `TESTING_REQUIREMENTS.md` 定义了偏行为驱动的测试风格
- 测试中预期对外部服务进行 mock

测试理念强调：
- 使用清晰、像需求描述一样的测试命名
- mock Jina / OpenAI / fetch
- 同时覆盖成功路径与失败路径
- 尽量保证抓取代码有较高覆盖率

从当前仓库形态看，自动化测试在抓取层面的覆盖比完整通知链路更成熟。

## 12. 当前架构的优点

- `convex/` 下的领域划分清晰
- 核心业务逻辑主要在后端，不散落在 UI 中
- 对活动发现使用了较合适的 Convex 索引与向量搜索能力
- 抓取 -> embedding -> 匹配 -> 邮件 的异步编排链路明确
- 使用 workpool 控制外部 API 并发，运维上更稳妥
- 已经具备来源、活动、订阅、workpool 的管理和调试页面

## 13. 重要实现缺口与注意点

这些点在继续开发时很值得注意：

1. **订阅预览的语义搜索尚未完整实现**
   - `searchEventsByEmbedding` 目前仍是返回 `[]` 的占位实现
   - 这更影响预览 / 辅助路径，而不是主通知链路

2. **Embedding 统计仍有占位逻辑**
   - `getEmbeddingStats` 里还有 placeholder 计数，尚未完全实现

3. **开发环境下的邮件行为是“乐观推进”的**
   - 虽然不会真的发邮件，但仍会把队列标记为已发送并推进调度状态
   - 这对本地流程验证有帮助，但并不等同于真正的 dry-run

4. **搜索与匹配采用了不同的语义机制**
   - 应用搜索依赖 Convex 向量索引搜索
   - 后台订阅匹配依赖已存储 embedding 的直接余弦相似度计算

5. **很多运行状态可观测性依赖调试 / 管理页面**
   - 开发和排障时，这些页面是观察 workpool 与队列状态的重要入口

## 14. 后续改动时的思维模型

修改这个项目时，比较适合按下面几层来理解：

- **UI 层**：导航、表单、列表 / 详情页、管理后台
- **API 层**：Convex 对外暴露的 query / mutation / action
- **领域层**：各模块内部 query / mutation / action
- **异步编排层**：workpool、scheduled functions、队列状态
- **集成层**：Jina、OpenAI、Resend
- **持久化层**：Convex schema 与索引

大多数有意义的产品改动都会同时涉及至少两层，但业务规则最适合放在 Convex 领域层，而不是 React 层。

## 15. 建议优先阅读的关键文件

如果要快速建立项目整体认知，最值得先看的入口文件是：

- `package.json`
- `src/main.tsx`
- `src/Routes.tsx`
- `src/router.ts`
- `convex/schema.ts`
- `convex/auth.ts`
- `convex/utils.ts`
- `convex/events/events.ts`
- `convex/events/eventsInternal.ts`
- `convex/eventSources/eventSourcesInternal.ts`
- `convex/scraping/scrapingInternal.ts`
- `convex/embeddings/embeddingsInternal.ts`
- `convex/subscriptions/subscriptions.ts`
- `convex/subscriptions/subscriptionsInternal.ts`
- `convex/subscriptions/subscriptionsMatching.ts`
- `convex/emails/emailsInternal.ts`
- `convex/crons.ts`

## 16. 一句话总结

这个项目本质上是一个以 Convex 为中心的活动聚合系统：React 前端比较轻，Convex 负责数据与流程编排，核心架构围绕异步采集、详情补全、语义匹配和延迟邮件通知展开。