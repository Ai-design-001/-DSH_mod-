# 发布与上架流程

这个目录是本地 `@local/session-delete-and-appearance`（`link:` 安装的私有包）的**发布副本**。
你 profile 里已经装好的那份不受影响，可以继续用；确认新包能装之后，再决定是否把 local 那份换成仓库。

整件事分三道关：

| 步骤 | 做什么 | 是否必须 |
| --- | --- | --- |
| 1 | 仓库推到 GitHub | 必须 |
| 2 | 发布到 npm | 可选，但推荐（市场里才显示下载量） |
| 3 | 给 awesome-dsh-plugin 提 PR | **「收录」只看这一步** |

---

## 1. 装工具

这台机器上**没有 git / node / npm**（我查过 PATH 和常见安装目录）。用 winget 装：

```powershell
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

装完**重开一个终端**，确认：

```powershell
git --version
node -v      # 18 以上即可
npm -v
```

## 2. 填好占位符

仓库里的 `Ai-design-001`、`Ai-design-001` 必须换成真实值，否则会被一起发出去。

```powershell
powershell -File scripts/personalize.ps1 -GitHubUser 你的GitHub用户名 -Author "你的名字"
```

想用带 scope 的 npm 包名（例如 `@zhangsan/dsh-plugin-session-delete-and-appearance`）：

```powershell
powershell -File scripts/personalize.ps1 -GitHubUser zhangsan -Author "Zhang San" `
  -PluginName "@zhangsan/dsh-plugin-session-delete-and-appearance"
```

> 脚本刻意写成**纯 ASCII**：Windows PowerShell 5.1 会把无 BOM 的 UTF-8 `.ps1` 按 ANSI 解码，一旦编辑器把 BOM 去掉，脚本里的中文就会让解析直接失败。纯 ASCII 没有这个问题，`powershell`（5.1）和 `pwsh`（7+）都能跑。

脚本会同步改 `package.json`、`cordis.patch.yml`、`client.js` 里的模块 id 和文档里的安装命令——这三处包名必须完全一致，这也是最容易出错的地方。

## 3. 自检

```powershell
node scripts/check.mjs       # 包名一致性 / exports 与 files 是否指向真实文件 / 占位符残留
node --check client.js       # 语法
npm pack --dry-run           # 真正会进包的文件清单
```

`npm pack --dry-run` 应该列出 12 个文件（`index.js`、`client.js`、`cordis.patch.yml`、`icon.svg`、两个 PNG、两个 locale JSON、README、LICENSE、CHANGELOG、`package.json`）。少了 `assets/` 或 `locale/` 就说明 `files` 写错了。

## 4. 建仓并推送

> 没装 git、想全程在浏览器里点？看 [UPLOAD-VIA-WEB.md](UPLOAD-VIA-WEB.md)，那条路不需要命令行。

GitHub → **New repository**：

- 名字：`dsh-plugin-session-delete-and-appearance`（建议和包名一致）
- **不要**勾选自动生成 README / .gitignore / License（本地已有）
- 可见性选 Public

然后：

```powershell
git init -b main
git add .
git commit -m "feat: session delete and appearance customization"
git remote add origin https://github.com/Ai-design-001/-DSH_mod-.git
git push -u origin main
```

推完回到仓库主页，右侧 **About → 齿轮 → Topics**，加上 `dsh-plugin`。这是收录的硬性条件，容易漏。

## 5. 发 npm（可选，推荐）

```powershell
npm login
npm publish
npm view dsh-plugin-session-delete-and-appearance version
```

以后发新版：

```powershell
npm version patch
npm publish
git push --follow-tags
```

两个坑：

- 包名带 scope 时必须 `npm publish --access public`（`package.json` 里已经写了 `publishConfig.access: public`，但老版本 npm 仍可能要求显式传）。
- `repository` 字段必须指回第 4 步那个仓库。市场靠它把 npm 包和仓库关联起来——对不上就只当两个无关的东西。

## 6. 验证安装（别跳过）

**不要**直接装到你现在正在用的 profile 上：那里已经 `link:` 了旧副本，包名不同会打架。开一个干净的 profile 试：

```powershell
# npm 路线
dsh plugin --profile scratch add dsh-plugin-session-delete-and-appearance

# 或者 GitHub 路线（还没发 npm 时用这个）
dsh plugin --profile scratch add github:Ai-design-001/-DSH_mod-
```

重启后确认两件事：侧栏会话行悬停有垃圾桶图标；**设置**里多出「外观定制」。都正常再上架。

## 7. 提 PR 上架

1. Fork <https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>
2. **新建一个文件** `data/plugins/<你的用户名>__<仓库名>.yml`——一个文件就是全部投稿，不要改生成的 README：

```yaml
url: https://github.com/Ai-design-001/-DSH_mod-
name: Ai-design-001/-DSH_mod-
category: ui
description:
  en: Adds a delete entry to every session row in the dsh sidebar, including the blank New Session row, plus a settings section for font sizes and per-region colors.
  zh: 为 dsh 侧栏的每个会话行增加删除入口（含空白的「新会话」行），并提供字号与分区颜色的外观定制设置页。
icon: https://raw.githubusercontent.com/Ai-design-001/-DSH_mod-/main/assets/icon-180.png
```

3. 提 PR，标题例如 `Add Ai-design-001/-DSH_mod- (ui)`。一个 PR 只加这一条（上限 3 条）。

### 为什么 category 选 `ui` 而不是 `theme`

指南里写明：`theme` 分类的条目会自动进市场的「主题」Tab，那里放的是主题/皮肤包。这个插件不是换肤，而是「删除按钮 + 设置分区」，所以归 `ui`。哪天它变成整套换肤包，再改成 `theme`。

### CI 会卡的条件（提前对齐，省一轮返工）

| 条件 | 本仓库状态 |
| --- | --- |
| `package.json` 声明 `dsh.bundle`（只声明 `dsh.client` 会被拒） | ✅ 已声明 |
| 仓库创建满 1 天 | ⏳ 刚建仓当天会被挡，几小时后自动放行，**不用重提** |
| 仓库带 `dsh-plugin` topic | ⏳ 第 4 步手动加 |
| 图标是 GitHub 托管的位图（png/jpg/webp），SVG 拒收 | ✅ `assets/icon-180.png` |
| 条目里不手写 `npm:` 字段（会被校验拒绝） | ✅ 别加 |
| 描述属实、无营销词；含 `": "` 必须加引号 | ✅ 上面的模板已避开 |
| 一个 PR 最多 3 条 | ✅ 只提 1 条 |

评审时会**实际读代码**核对描述里的每句话，所以描述别夸大。被打回不等于被拒——改那一行再推同一个分支即可。

## 8. 之后要改东西

- **改功能 / 发新版**：改代码 → `npm version patch` → `git push` → `npm publish`
- **改描述或分类**：只改你自己那个 `data/plugins/<你>__<仓库>.yml`，另提一个 PR。别手改生成的 README，行号会漂。
- **换截图**：在仓库根放 `screenshots.json`（`["assets/a.png","assets/b.png"]`，1–8 张相对路径，不能越出仓库），下次构建自动生效，不用来提 PR。

## 9. 本机现状与限制

说实话，避免你踩空：

- **我没有你的 GitHub / npm 凭证，也没有在这台机器上装 git 和 node。** 所以第 4–7 步的推送、发布、提 PR 只能由你执行；第 2、3 步我可以代跑，也已经跑过。
- 校验用的是 DSH 自带的 Node v24.21.0（`node --check` 与 `scripts/check.mjs` 都通过了）。**真正的 `npm publish` 我没有跑过**——没有 npm，也没有账号。
- **「从 npm 包装载」这条路径我还没有在真实环境验证过**。本地能跑的是 `link:` 的副本，理论上两者加载方式一致，但第 6 步就是专门用来兜这个风险的，别省。

如果第 6 步装不上（比如客户端入口没被加载），把报错发我，我按宿主的加载方式改入口文件。
