# 用网页把插件传到 GitHub（不用命令行）

适合：仓库已经在 GitHub 网页上建好，机器上没有 git。
整个过程大约 5 分钟，全程在浏览器里点。

---

## 第 0 步 · 打一个上传包

在仓库目录打开 PowerShell（在文件管理器地址栏输入 `powershell` 回车即可），执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/pack-for-upload.ps1 -GitHubUser 你的用户名 -Author "你的名字"
```

它会：

1. 复制一份仓库到临时目录（**不动你的工作目录**）
2. 把 `__GITHUB_USER__` / `__AUTHOR__` 换成你给的值
3. 检查没有占位符残留
4. 输出 `dist\dsh-plugin-session-delete-and-appearance-upload.zip`

把 zip **解压到一个空文件夹**，例如 `C:\Users\你\Desktop\sdda-upload`。

> 注意：`dist\` 不进版本库，已在 `.gitignore` 里排除。

## 第 1 步 · 上传

1. 打开你的仓库页面 → **Add file** → **Upload files**
2. 打开解压出来的 `sdda-upload` 文件夹，**进去之后**按 `Ctrl+A` 全选，再整体拖到网页的上传区域

   要拖的是「文件夹里的东西」，不是文件夹本身，也不是 zip。

3. 页面会列出 19 个文件（`package.json`、`client.js`、`assets/…`、`locale/…` 等），确认路径形如 `assets/icon-180.png` 而不是 `sdda-upload/assets/icon-180.png`
4. 底部 Commit changes，信息填 `feat: initial release`

> 如果建仓库时勾选了「Add a README」，这里的 `README.md` 会直接覆盖它，属正常。
> GitHub 单次上传上限 100 个文件，这里 19 个，够用。

## 第 2 步 · 补上 `.gitignore`（唯一会漏的文件）

浏览器拖拽**不会带隐藏文件**。上传完成后手工补一个：

1. 仓库页 → **Add file** → **Create new file**
2. 文件名填 `.gitignore`（带前导点）
3. 内容粘贴：

```gitignore
node_modules/
*.tgz
dist/

npm-debug.log*
pnpm-debug.log*
.npmrc.local

.vscode/
.idea/
.DS_Store
Thumbs.db

*.local.*
```

4. Commit changes

## 第 3 步 · 核对目录结构

仓库根目录应该正好是这些：

```
assets/icon-180.png
assets/icon-512.png
docs/PUBLISHING.md
docs/UPLOAD-VIA-WEB.md
locale/en.json
locale/zh.json
scripts/check.mjs
scripts/make-icon.py
scripts/pack-for-upload.ps1
scripts/personalize.ps1
.gitignore
CHANGELOG.md
client.js
cordis.patch.yml
icon.svg
index.js
LICENSE
package.json
README.md
```

出现 `sdda-upload/…` 这种多一层的，说明拖错了对象：删除多余目录重来。

## 第 4 步 · 加 topic（收录硬性要求）

仓库首页右侧 **About** 旁的齿轮 → **Topics** → 输入 `dsh-plugin` → 回车 → **Save changes**。

## 第 5 步 · 把仓库地址发我，我帮你核对

把 `https://github.com/你的用户名/仓库名` 发过来，我用公开页面检查：
文件是否齐全、`package.json` 里的 `name` 与 `repository` 是否已填对、`cordis.patch.yml` 的 name 是否一致。
这一步不用给任何凭证——公开仓库我读得到。

---

## 拖拽不好用怎么办

Quark / 360 这类浏览器对拖拽上传的支持不一定完整，按顺序试：

**A. 换浏览器**：用 Edge 或 Chrome 打开 GitHub 再拖一次（最省事）。

**B. 用 GitHub Desktop**（自带 git，不用命令行）：
1. 装 <https://desktop.github.com/>
2. 登录你的账号
3. **File → Add local repository** → 选解压后的 `sdda-upload` 文件夹
   （它会提示不是 git 仓库，选 **create a repository**）
4. 右上 **Publish repository** → 取消勾选 Private → Publish

   这种方式会把 `.gitignore` 一并推上去，第 2 步可以跳过。

**C. 装 git 走命令行**：装好后告诉我，我把命令按顺序列给你。

---

## 上传之后

- **发 npm**（可选）：`docs/PUBLISHING.md` 第 5 步
- **上架到插件市场**：`docs/PUBLISHING.md` 第 7 步，往 awesome-dsh-plugin 提一个 PR，加一个 `data/plugins/<你>__<仓库名>.yml`
- 记得仓库要**满 1 天**才能过收录 CI（当天提 PR 会被挡，几小时后自动放行，不用重提）
