# Expo App + Express.js

## 目录结构规范（严格遵循）

当前仓库是一个 monorepo（基于 pnpm 的 workspace）

- Expo 代码在 client 目录，Express.js 代码在 server 目录
- 本模板默认无 Tab Bar，可按需改造

├── client/                     # React Native 前端代码
│   ├── app/                    # Expo Router 路由目录（仅路由配置）
│   │   ├── _layout.tsx         # 根布局文件（必需，务必阅读）
│   │   └── index.tsx           # 首页
│   ├── screens/                # 页面实现目录（与 app/ 路由对应）
│   │   └── demo/               # 示例页面
│   │       └── index.tsx
│   ├── components/             # 可复用组件
│   │   └── Screen.tsx          # 页面容器组件（必用）
│   ├── hooks/                  # 自定义 Hooks
│   ├── contexts/               # React Context 代码
│   ├── utils/                  # 工具函数
│   ├── assets/                 # 静态资源
|   └── package.json            # Expo 应用 package.json
├── server/                     # 服务端代码根目录 (Express.js)
|   ├── src/
│   │   └── index.ts            # 服务端入口文件
|   └── package.json            # 服务端 package.json
├── package.json
├── .cozeproj                   # 预置脚手架脚本（禁止修改）
└── .coze                       # 配置文件（禁止修改）

## 样式方案

基于 tailwindcss 进行样式开发（底层基于 Uniwind）

写法示例：

```tsx
<View className="flex-1 bg-white dark:bg-gray-900 p-4"></View>
```

```tsx
<Text
  className="text-lg font-bold text-gray-900 dark:text-white"
  selectionColorClassName="accent-blue-500"
>
  Hello World
</Text>
```

Uniwind 官方文档：https://docs.uniwind.dev/llms.txt

## 如何进行静态校验（TSC + ESLint）

```bash
# 对 client 和 server 目录同时进行校验
pnpm -w lint:all

# 对 client 目录进行校验
pnpm -w lint:client

# 对 server 目录进行校验
pnpm -w lint:server
```

## 如何修改主题模式（跟随系统、固定暗色、固定亮色）

默认为跟随系统，如果用户明确指定为“暗色”或“亮色”，需要修改 `client/components/ColorSchemeUpdater.tsx` 的 `DEFAULT_THEME` 变量为合适的值

## 如何定制主题 design tokens

当前项目的**设计系统**基于 tailwindcss 实现，核心入口文件为 `client/global.css`，如果需要定制主题，应该**阅读并修改 `client/global.css` 文件**

## 路由及 Tab Bar 实现规范

### 方案一：无 Tab Bar（Stack 导航）

适用于线性流程应用，采用简化的目录结构：

```
client/app/
├── _layout.tsx         # 根布局（Stack 导航配置）
├── index.tsx           # 应用入口
├── detail.tsx          # 详情页（通过 params 传递数据）
└── +not-found.tsx      # 404 页面
```

**根布局配置** `client/app/_layout.tsx`：

以下仅为代码片段供写法参考

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="index" />
  <Stack.Screen name="detail" />
</Stack>
```

**应用入口** `client/app/index.tsx`：
```tsx
export { default } from "@/screens/home";
```
> **禁止事项**：无 Tab Bar 场景下，不得创建 `(tabs)` 目录。

### 方案二：有 Tab Bar（Tabs 导航）

采用路由分组实现底部导航栏：
```
client/app/
├── _layout.tsx              # 根布局
├── (tabs)/
│   ├── _layout.tsx          # Tab 导航配置
│   ├── index.tsx            # 默认 Tab（必须存在）
│   ├── discover.tsx         # 发现页
│   └── profile.tsx          # 个人中心
├── detail.tsx               # Tab 外的独立页面（通过 params 传递数据）
└── +not-found.tsx
```
> **⚠️ [CRITICAL]**： `app/index.tsx` 优先级高于 `(tabs)/index.tsx`，会导致首页无 Tab Bar。**当有(tabs)/index.tsx时必须删除 `app/index.tsx`**。

**根布局配置** `client/app/_layout.tsx`：

以下仅为代码片段供写法参考

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="detail" />
</Stack>
```

**应用入口** `client/app/(tabs)/index.tsx`：
```tsx
export { default } from "@/screens/home";
```

**Tab 布局配置** `client/app/(tabs)/_layout.tsx`：

```tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [background, muted, accent, border] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
    '--color-border',
  ]) as string[];

  let tabBarStyle = {
    backgroundColor: background,
    borderTopWidth: 1,
    borderTopColor: border,
  };

  // 用于修复 Web 上高度异常的问题（这个 if 逻辑必须添加）
  if (Platform.OS === 'web') {
    tabBarStyle = {
      ...tabBarStyle,
      height: 'auto',
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
      }}
    >
      {/* name 必须与文件名完全一致 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: '发现',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="compass" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Tab 页面文件** `client/app/(tabs)/index.tsx`：
```tsx
export { default } from "@/screens/home";
```

### 注意事项

在改动 `client/app/_layout.tsx` 前，必须先阅读该文件，再进行修改操作

以下是需要保留的重要逻辑

- 保留 global.css 引入（tailwindcss 生效的关键）
- 保留 Provider 的使用

## 依赖管理与模块导入规范

### 依赖安装
**禁止**使用 `npm` 或 `yarn`，按目录区分安装命令：

| 目录 | 安装命令 | 说明 |
|------|----------|------|
| `client/` | `npx expo install <package>` | Expo 会自动选择与 SDK 兼容的版本 |
| `server/` | `pnpm add <package>` | 使用 pnpm 管理后端依赖 |

```bash
# client 目录（Expo 项目）
cd client && npx expo install expo-camera expo-image-picker

# server 目录（Express 项目）
cd server && pnpm add axios cors
```

**网络问题处理**：`npx expo install` 可能因网络原因失败，失败时重试 2 次，仍失败则改用 `pnpm add` 安装

## Expo 开发规范

### 路径别名

Expo 配置了 `@/` 路径别名指向 `client/` 目录：

```tsx
// 正确
import { Screen } from '@/components/Screen';

// 避免相对路径
import { Screen } from '../../../components/Screen';
```

## 本地开发

`coze-dev dev`：用来首次启动前后端服务，也可以用来重启前后端服务（该命令会先尝试杀掉占用端口的进程，再启动服务）

## 数据持久化与自举机制（重要）

**重启前后端服务不会丢失机型数据。** 数据的存储分三层理解：

| 层 | 存放位置 | 重启是否受影响 |
|----|----------|----------------|
| 数据库实例 | Supabase Postgres（develop 库），独立于沙箱进程、一直在线 | 不受影响 |
| 表结构 | `server/src/storage/database/shared/schema.ts`，后端启动时自动同步 | 不受影响 |
| 行数据（16 台机型） | 数据库表里的记录 | 不受影响 |

### 启动自举（seed）

后端启动时会执行 `server/src/storage/database/seed.ts`：

- 仅当 `phone_models` 表**为空**时，从 `seed-data.ts`（全量快照）灌入 16 台种子机型
- 非空则跳过（幂等），永远不会重复插入或覆盖线上数据
- 自引用外键（`upgrade_model_id`）分两步：先插基础行，再按 id 回填引用

### 「机型不见了」的排查思路

数据消失 ≠ 数据被删。多数情况是**链路断了**（后端没起、手机端 API 不通、前端报错后渲染了空列表），而非数据库问题。按顺序验证：

```bash
# 1. 后端活着吗
curl http://localhost:9091/api/v1/health

# 2. 数据还在吗（有 16 台即正常）
curl -s http://localhost:9091/api/v1/phones | head -c 200
```

### 强制重置机型数据（开发用）

```bash
# 仅在 develop 库执行，清空后重启后端即可触发自举重灌
TRUNCATE phone_models CASCADE;
```

## 部署后端到 Vercel（可选，用于稳定测试/演示环境）

沙箱开发环境的进程与临时文件会被环境回收，代码与数据库不受影响。如需一个常驻公网的后端（手机测试不依赖沙箱进程存活），可将后端部署到 Vercel：

1. **关联远程仓库并推送**（本地仓库已就绪）：
   ```bash
   git remote add origin https://github.com/epicmike-gpu/waliapp.git
   git push -u origin main
   ```
2. **Vercel 导入项目**：New Project → 选择 `waliapp` 仓库 → **Root Directory 设为 `server`**（前端为原生 App，不部署到 Vercel）→ Framework 选 Other
3. **配置环境变量**（Project Settings → Environment Variables）：
   - `COZE_SUPABASE_URL`、`COZE_SUPABASE_ANON_KEY`、`COZE_SUPABASE_SERVICE_ROLE_KEY`（Supabase 三件套，必配）
   - `COZE_API_TOKEN`（**AI 对比报告必需**：Coze 开放平台「个人访问令牌 PAT」，`pat_` 开头，coze.cn → 头像 → 扣子 API → 个人访问令牌生成；不配置则其余接口正常、仅报告接口返回错误提示）
   - `COZE_BOT_ID`（**AI 对比报告必需**：已发布为「API 服务」渠道的智能体 ID。发布路径：Bot 编辑页 → 发布 → 勾选 API 渠道；未发布会报 `code=4015`）
4. **Deploy**。Git push 自动触发构建并上线生产（若开启了 *Skip automatic Promotion* 需手动 Promote）。函数来源是**仓库内提交的构建产物** `api/*.js`（esbuild 全 bundle 单文件 CJS，依赖全打入）——Express preset 下 `vercel.json` 的 buildCommand 不生效，修改后端代码后需本地执行 `pnpm run build:vercel` 刷新产物并提交。

> **生产上线注意（踩坑记录）**：若项目开启了 *Skip automatic Promotion*，构建 Ready 后需手动到 Deployments → 最新部署 → `···` → **Promote to Production** 才会切流量；也可在 Settings → Git 关闭该开关实现自动上线。

5. **验证**：
   ```bash
   curl https://<your-domain>/api/ping        # {"ok":true,"probe":"ping"} —— 零依赖探针
   curl https://<your-domain>/api/healthz     # 运行时环境信息（Node 版本/region/env 键名）
   curl https://<your-domain>/api/v1/health   # {"status":"ok"}
   curl https://<your-domain>/api/v1/phones   # 机型列表（空库时首个请求自动触发种子自举）
   ```

架构说明：`functions-src/` 为 Vercel 函数源码（index/ping/healthz 三入口），`pnpm run build:vercel` 用 esbuild 打包为 `api/*.js` 单文件 CommonJS（`api/package.json` 锁定 `type: commonjs`）；`src/index.ts` 为本地开发入口（`pnpm run dev`，监听 9091 + seed 自举）；`src/app.ts` 为两端共用的 Express 应用组装。

AI 报告的 LLM 通道：`src/services/report-service.ts` 直连 Coze 官方 OpenAPI `POST {COZE_API_BASE}/v3/chat`（SSE 流式，默认 `https://api.coze.cn`，国际版可用 `COZE_API_BASE` 覆盖）。平台 SDK 的 `LLMClient` 依赖沙箱内部网关凭证（`sat_`/workload identity），在 Vercel 上不可用（会报 `token contains an invalid number of segments`），故生产与本地统一走官方 API。

## 手机真机测试（Expo Go）

### 账号前提（重要，连接失败先查这里）

Expo Go 通过隧道连接 dev server 要求**两端账号一致**：

- **CLI 侧**：`expo login mikelu332`（在 `client/` 目录执行）。沙箱环境重置后凭证会丢失（`npx expo whoami` 显示 Not logged in），需重新登录；登录后隧道主机名会带账号名（如 `yf-6kk0-mikelu332-5000.exp.direct`）
- **手机侧**：Expo Go → Profile → 登录**同一账号** `mikelu332`
- CLI 未登录时隧道为 `*-anonymous-*.exp.direct`，登录了账号的 Expo Go 会被拒绝连接或提示 unauthorized

### 启动（tunnel 模式 + API 直连生产后端）

```bash
# 推荐方式：API 全部直连生产 https://www.waliapp.top（测试的即线上后端 + 线上 Bot）
cd client && EXPO_PUBLIC_BACKEND_BASE_URL=https://www.waliapp.top nohup npx expo start --tunnel --port 5000 > /tmp/expo-test.log 2>&1 &

# 不设 EXPO_PUBLIC_BACKEND_BASE_URL 时走沙箱后端（隧道转发 9091，报告走平台网关凭证）
```

### 获取当前隧道地址

非交互模式下 CLI 不显示二维码，从 ngrok 管理接口取：

```bash
curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1
```

隧道地址每次重启 dev server 都会变（前缀随机），失效就重新取。

### 连接方式

- 新版 Expo Go 已**移除**「Enter URL manually」入口，连接只能靠**扫二维码**
- 二维码来源：CLI 交互模式终端直接显示；非交互模式（沙箱）下把连接 URL `exp://<host>.exp.direct:80` 用 `qrcode` 包生成 PNG，上传对象存储后给用户在电脑上打开、手机扫码
- 电脑/手机浏览器直接打开 `https://<host>.exp.direct` 可以测 Web 版（无需账号、无需扫码）

### 真机测试流

1. 首页浏览机型列表（数据来自后端）
2. 选 2 台机型进入对比页
3. 走换机检测/分析流程
4. 点「Generate AI Report」：观察逐字流式输出（打字机效果）+ TL;DR 结论卡 + 8 章节，约 25~40 秒生成完毕

> 已真机验证通过：Expo Go（登录 mikelu332）扫二维码 → 全流程可用（API 直连生产后端）。

### 已知性能表现（真机实测记录）

| 现象 | 原因 | 定性 |
|------|------|------|
| AI 报告约 30 秒生成完毕 | 耗时主体是 LLM 生成 250~340 words（链路：App → Vercel → api.coze.cn → 流式回传），已收紧过输出长度 | 预期内；流式打字机效果下可见逐字输出，非黑屏等待 |
| dev 模式页面/对比页首次加载偏慢 | Metro bundle、热更新、图片全走 ngrok 公网隧道（手机 → ngrok → 沙箱），链路长 | dev 隧道固有开销，**非 App 性能问题** |
| 正式构建无此开销 | EAS Build 产物（release 包）JS 本地加载，不走隧道 | — |

后续可选优化：报告侧进一步精简 Bot 提示词/换更快模型；页面侧用 EAS Build 正式包替代 Expo Go 开发模式后即无隧道开销。

## 应用双版本机制（cn / intl）

通过构建期环境变量 `EXPO_PUBLIC_EDITION` 切换，核心实现在 `client/config/edition.ts` 与 `client/app.config.ts`：

| 版本 | 显示名 | Bundle ID | 语言 | 备注 |
|------|--------|-----------|------|------|
| `intl`（**默认**） | value | com.wali.value | English | 海外版，报告/分析自动输出英文 |
| `cn`（需显式切换） | 瓦砾 | com.wali.app | 简体中文 | 国内版，京东联盟 CPS |

- **为什么默认是 intl**：平台托管的 dev server 被杀后会自动重启，且重启不携带自定义环境变量；将默认值反转为 `intl` 可保证重启后仍是海外版，避免反复回退
- **启动国内版**：`EXPO_PUBLIC_EDITION=cn npx expo start`（或构建时带上该变量）
- **语言联动**：`client/i18n/index.ts` 的 `LANG` 由 `EDITION` 派生（intl→en，cn→zh），报告接口的 `lang` 参数也由其驱动，无需单独配置
