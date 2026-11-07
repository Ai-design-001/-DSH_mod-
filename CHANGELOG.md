# Changelog

遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2026-11-07

首个公开版本。此前以本地 `link:` 安装的私有包形式使用，包名 `@local/session-delete-and-appearance`。

### 新增

- 会话删除：会话行行内图标（悬停出现），以及悬停卡片底部的「删除会话」一行（对空白的「新会话」行同样生效）。
- 删除实现走宿主 `archiveSession`，成功后自动把侧栏切回「隐藏已归档」，列表立即收起。
- 「外观定制」设置分区：
  - 字号：正文 10–22px、代码 10–16px、终端 10–20px，步进到边界自动禁用。
  - 分区颜色：侧边栏、主背景、层级背景（一/二）、品牌强调色、边框（一/二），每个区域可单独恢复默认，也可全部恢复。
  - 颜色同时写入浅色与深色主题，持久化到 `localStorage`。
- 中英双语字典，跟随宿主语言切换。
- `scripts/check.mjs`：发版前校验包名一致性、`exports` / `files` 完整性、占位符残留。
- `scripts/make-icon.py`：由 `icon.svg` 生成市场所需的 PNG 图标。
