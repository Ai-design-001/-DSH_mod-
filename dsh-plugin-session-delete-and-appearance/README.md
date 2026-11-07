# 会话删除与外观定制

> dsh-plugin-session-delete-and-appearance

在 **DeepSeek Harness（dsh）** 侧栏直接删除会话，并在设置里集中调整字号与分区配色。
纯前端、零运行时依赖、零网络请求。

[English](#english) · [安装](#安装) · [权限与隐私](#权限与隐私) · [常见问题](#常见问题)

---

## 功能

### 1. 会话删除

提供两个入口，覆盖不同场景：

| 入口 | 位置 | 说明 |
| --- | --- | --- |
| 行内图标 | 会话行右侧（悬停时出现） | 常规会话行 |
| 悬停卡片里的「删除会话」 | 会话行悬停卡片的底部 | **对空白的「新会话」行同样生效**，行内图标那一条不渲染这种行 |

删除后列表立即收起，不需要手动刷新。

### 2. 外观定制

**设置 → 外观定制**，分两组：

- **字体大小** — 正文（10–22px）、代码（10–16px）、终端（10–20px），逐档步进，到边界自动禁用按钮。
- **分区颜色** — 侧边栏背景、主背景、层级背景（一级 / 二级）、品牌强调色、边框（一级 / 二级）。每个区域可单独设置为任意颜色，也可单独「恢复默认」或一次性「全部恢复默认」。

颜色同时覆盖浅色与深色两套主题；改动即时生效，无需重启。

## 关于「删除」

dsh 的会话接口**没有硬删除**能力，插件调用的是平台提供的 `archiveSession`，随后把侧栏切回「隐藏已归档」视图——所以现象上是"删掉了"，数据仍在归档里，可以从归档恢复。

这是刻意的：删错了还有退路。如果你想彻底清理磁盘上的会话记录，需要自己在文件系统里处理，插件不会替你做这件事。

## 截图

> 建议放两张：会话行的删除入口、设置页的外观定制分组。图片放到 `assets/`，然后在下面取消注释。
> 如果之后要上架插件市场，另需在仓库根目录放 `screenshots.json`（`["assets/xxx.png"]`，1–8 张相对路径）。

<!--
![侧栏删除入口](assets/screenshot-sidebar.png)
![外观定制设置页](assets/screenshot-settings.png)
-->

## 安装

把下面的 `desktop` 换成你自己的 profile 名（桌面端通常是 `desktop`，Web 端常见 `web`）。

**方式一 · 插件市场**（收录后可用）

在 dsh 的 **插件 → 发现** 里搜索「会话删除」或包名，点安装。

**方式二 · npm**

```bash
dsh plugin --profile desktop add dsh-plugin-session-delete-and-appearance
```

**方式三 · GitHub**

```bash
dsh plugin --profile desktop add github:__GITHUB_USER__/__REPO_NAME__
```

**方式四 · 本地目录**（开发调试用）

```bash
dsh plugin --profile desktop add link:D:\path\to\dsh-plugin-session-delete-and-appearance
```

装完重启 dsh（或在插件页里重载该插件）。

## 使用

1. 重启后看侧栏：把鼠标移到任意会话行上，右侧出现垃圾桶图标；悬停卡片底部多一行「删除会话」。
2. 打开 **设置 → 外观定制**：调整字号、给分区挑颜色。
3. 想还原：颜色行右边点「恢复默认」，或整组点「全部恢复默认」。

## 兼容性

- 开发与验证环境：**dsh Desktop 0.2.2-rc.1 / Windows 11 / 内置 Chromium**。
- 依赖以下宿主席位与服务，版本过旧时对应界面只是不出现，不会报错：

  | 类型 | 名称 |
  | --- | --- |
  | 槽位 | `sidebar.workspaces.session.row.action` |
  | 槽位 | `sidebar.session.row.hover` |
  | 槽位 | `settings.section` |
  | 服务 | `uiWorkspace.archiveSession`、`theme.overrideTokens`、`theme.setFontSize`、`locale.register` |

- 颜色写入的是主题 token（`--dsw-*`）。宿主改名 token 后旧颜色会失效，插件会退回默认配色，不会崩。

## 权限与隐私

- **没有 Host 逻辑**：`index.js` 的 `apply()` 是空的，插件全部行为在浏览器端。
- **不发任何网络请求**，不读文件，不碰凭据，不执行命令。
- **唯一的持久化**：`localStorage` 里的 `dsh.session-delete-and-appearance.colors.v1`，只存颜色值（形如 `{"sidebar":"#1f2430"}`）。
- 删除会话走的是宿主自己的 `archiveSession`，权限与你在界面上点归档完全一致。

## 卸载与还原

```bash
dsh plugin --profile desktop remove dsh-plugin-session-delete-and-appearance
```

卸载（或禁用）后，颜色覆盖层会随插件一起消失，界面恢复主题默认值。`localStorage` 里的旧颜色记录会保留——重装插件后会再次生效；不想保留就先点「全部恢复默认」再卸载。

## 开发

没有构建步骤，改完 `client.js` 重载页面即可（`link:` 安装时也可配合宿主的 HMR）。

```bash
# 语法与清单一致性检查（不需要额外依赖）
node scripts/check.mjs

# 重新生成 PNG 图标（改了 icon.svg 之后）
python scripts/make-icon.py

# 打成可直接在 GitHub 网页上传的 zip（见 docs/UPLOAD-VIA-WEB.md）
powershell -ExecutionPolicy Bypass -File scripts/pack-for-upload.ps1 -GitHubUser 你的用户名 -Author "你的名字"
```

`scripts/check.mjs` 会校验：三处包名是否一致（`package.json` / `cordis.patch.yml` / `client.js` 的模块 id）、`exports` 与 `files` 指向的文件是否真实存在、JSON 是否可解析。发版前跑一下。

## 目录结构

```
dsh-plugin-session-delete-and-appearance/
├── package.json          # 清单：dsh.bundle + dsh.client
├── cordis.patch.yml      # 把插件插进 profile 的 patch 层
├── index.js              # Host 半侧（空实现，仅满足可安装要求）
├── client.js             # Client 半侧：删除入口 + 外观定制设置页
├── icon.svg              # 图标源文件
├── assets/
│   ├── icon-180.png      # 市场卡片图标（位图，SVG 会被市场拒绝）
│   └── icon-512.png
├── locale/
│   ├── zh.json           # 市场/设置页展示用的标题与简介
│   └── en.json
├── scripts/
│   ├── check.mjs         # 清单一致性检查
│   ├── make-icon.py      # icon.svg → PNG
│   ├── personalize.ps1   # 填入 GitHub 用户名与作者名
│   └── pack-for-upload.ps1 # 打成可直接网页上传的 zip
├── docs/
│   ├── PUBLISHING.md     # 发布与上架流程
│   └── UPLOAD-VIA-WEB.md # 纯浏览器上传（无需 git）
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## 常见问题

**删掉的会话还能找回来吗？**
能。删除即归档，把侧栏的「显示已归档」打开就能看到并恢复。插件不提供硬删除——平台没有这个接口。

**「新会话」那行删不掉？**
行内图标对空白的临时新会话行不渲染（该行没有操作区），请用悬停卡片底部的「删除会话」那一行。

**改完颜色，深色主题没变化？**
每个颜色会同时写入浅色和深色两套值。若某个区域看起来没变，通常是该区域用的是别的 token —— 目前只覆盖 README 里列出的 7 个 token。

**支持手机端吗？**
插件本身是浏览器端实现，触屏可用；但侧栏悬停卡片在触屏上没有 hover，实际只有行内图标入口。

## English

A dsh (DeepSeek Harness) plugin with two halves of one idea: make sessions deletable from the sidebar, and let the user shape how the harness looks.

- **Session delete** — an icon on each session row, plus a "Delete session" row inside the hover card (the only surface that also renders for the blank provisional *New Session* row). Deletion maps to the platform's `archiveSession`, then switches the sidebar back to "hide archived", so the row disappears immediately and stays recoverable from the archive.
- **Appearance** — a dedicated settings section with body/code/terminal font sizes (steppers, clamped) and per-region color overrides for sidebar, base background, two background layers, brand accent and two border levels. Colors are written to both light and dark themes and persist in `localStorage`.

Zero runtime dependencies, no network requests, no host-side logic. Requires dsh 0.2.x. MIT licensed.

## License

[MIT](LICENSE)
