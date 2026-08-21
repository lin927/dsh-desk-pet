# Notes — 从动态插件到静态 bundle：桌宠插件实战经验

这篇记录把一个「Web 桌宠」从 DSH 动态 Cordis 插件演进成可一键安装的静态
bundle 的全过程、架构决策，以及踩过的坑。**DSH 开发者装/改同类 Web 客户端
插件时可直接参考。**

## 1. 两种插件形态的本质区别

| | 动态插件（cordis_define/run） | 静态插件（仓库扩展包） |
|---|---|---|
| 定义 | 运行时由 Agent 现场创建 | 写进 `packages/extensions/<name>/` |
| 存放 | **进程内存，重启即失** | **磁盘/仓库，重启常驻** |
| 运行环境 | 沙箱受限（无网络/文件；root context） | 完整源码环境 |
| 分发 | 不可分发 | 可构建、可装、可 git 分发 |
| 适用 | 临时 / 会话级 / Agent 自建玩具 | 正式产品功能 / 要常驻的东西 |

**结论**：桌面宠物这种「重启后还要在」的，必须是静态插件。

## 2. 静态 Web 客户端插件怎么搭（模板）

```
packages/extensions/desk-pet/
  package.json        # @deepseek-ai/dsh-desk-pet
                      #   dsh.bundle: { patch: "./cordis.patch.yml" }   ← 可被 dsh plugin add 识别为 bundle
                      #   dsh.client: { platform:'web', inject:[...] }   ← web 客户端声明
                      #   exports: { "./client" → lib/client.js, "./cordis.patch.yml", ... }
  cordis.patch.yml    # - insert: [ { id: desk-pet, name: '@deepseek-ai/dsh-desk-pet' } ]
  tsconfig.json       # extends tsconfig.base.client.json + references 各 client 包
  tsdown.config.ts    # clientBundle('@deepseek-ai/dsh-desk-pet', ['lib/types/index.js','lib/types/invariant.js'])
  src/index.ts        # node 半身（纯客户端插件可 no-op）
  src/invariant.ts    # 包不变量伴生
  src/client/index.ts # 注册 shell.overlay 槽位
  src/client/DeskPet.tsx
  src/client/assets.ts# 素材 base64 内嵌（scripts/generate-assets.py 生成）
  lib/client.js       # 构建产物（分发必需，已提交）

# 构建（在 harness 工作区，@deepseek-ai 依赖在此可解析）：
pnpm exec tsc -p packages/extensions/desk-pet/tsconfig.json
pnpm --filter @deepseek-ai/dsh-desk-pet bundle
```

**纯客户端设计**：用槽位标准 hook `useSessions(s => s)` 读会话 running/completed，
不需要 host 半身、无 RPC；素材内嵌 data URL，零网络。

## 3. 安装 / 分发方式

**bundle 方式（推荐，一条命令）**：
```bash
dsh plugin --profile web add git+https://github.com/lin927/dsh-desk-pet.git
dsh web   # 重启
```
`dsh plugin add` 会自动把声明了 `dsh.bundle` 的包加进 `dsh.profile.bundles`
（对齐 dshmarket 的做法），profile 启动时应用其 `cordis.patch.yml` 插入
`desk-pet` 行，`clientModules` 发现 `dsh.client` 后服务其 bundle。

**web-app bundle 方式（开发者内置）**：在 `packages/bundle/web-app/` 的
`cordis.patch.yml` 加行 + `package.json` 加 `workspace:^` 依赖。改动
`cordis.patch.yml` 源文件即可，**无需重构建**（组合是运行时读源文件）。

## 4. 踩过的坑（最重要）

1. **这台机器浏览器无法访问外网**（连 github / codexpet.top 都连不上，curl 却
   可以）→ 不能依赖远程图片 URL，必须内嵌 base64 或走同源服务。
2. **动态 Host 在 root context**，`fs`/`sandboxPolicy` 不一定可用，且
   `workspaceRoot` ≠ 会话工作区（是 `apps/cli/src`）。所以「Host 读文件 →
   RPC 下发素材」在动态沙箱里不可靠。
3. **动态插件客户端只在激活时已连接的页面加载**，刷新/新页面拿不到——这也是
   动态版反复「看不到」的原因。
4. **拖拽用 window 级监听**（pointerdown 后挂 `window.pointermove/up/cancel`），
   别依赖 pointer capture（宠物元素小，指针易移出）。
5. **最关键的一条**：> "a row whose package no manifest declares fails to import"
   光在 `cordis.patch.yml` 加行 + 软链进 node_modules **不够**——包必须被某个
   **已加载的 manifest 声明为依赖**（profile 或 bundle 的 `package.json`）。
   dshmarket 能加载就是因为 `dsh plugin add` 把它写进了 profile 依赖。
6. **独立分发包不能带 `workspace:^` 的 @deepseek-ai 依赖**（pnpm 在非 harness
   工作区解析不了）。分发版去掉这些依赖、提交预构建的 `lib/`，运行时由应用的
   模块表提供 `@deepseek-ai/*` 外部依赖。

## 5. 验证步骤（重启后）

```bash
# 1) boot 清单里有它
curl -s http://127.0.0.1:3080/ | grep -o "dsh-desk-pet" | head -1
# 2) 客户端 bundle 可下载（应返回 200）
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3080/plugins/@deepseek-ai/dsh-desk-pet/client.js
# 3) 右下角肉眼看到透明背景的桌宠
```
或用 Cordis 面板 / inspect 确认 `shell.overlay` 槽位里 `desk-pet` 条目 active。

## 6. 快速 checklist（给下次做同类插件）

1. 判断形态：临时用 → 动态；常驻/分发 → 静态 bundle。
2. 静态包照 `meeting-recorder` 结构；纯客户端优先，用 `useSessions` 读状态。
3. 素材内嵌 base64 或同源服务，别依赖浏览器外网。
4. 分发做 bundle：`dsh.bundle` + `cordis.patch.yml`，让 `dsh plugin add` 自动纳入。
5. 分发版去掉 @deepseek-ai 依赖、提交 `lib/`。
6. 拖拽用 window 级监听。
7. 验证：boot 清单 + `/plugins/<id>/client.js` 200 + 槽位 active。
