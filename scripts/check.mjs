#!/usr/bin/env node
/**
 * Pre-publish sanity check. No dependencies — runs on a bare Node 18+.
 *
 *   node scripts/check.mjs
 *
 * It catches the failure modes that actually bite this kind of package:
 * a package name that drifted apart from the Cordis patch or the client
 * module id, `exports`/`files` pointing at files that were renamed, and
 * leftover personalization placeholders inside the publishable tree.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];
const passed = [];

function check(label, condition, detail = '') {
  if (condition) {
    passed.push(label);
  } else {
    failures.push(detail ? `${label} — ${detail}` : label);
  }
}

function warn(label, detail) {
  warnings.push(`${label} — ${detail}`);
}

function read(relPath) {
  return readFileSync(join(root, relPath), 'utf8');
}

// ---- package.json ---------------------------------------------------------

let pkg;
try {
  pkg = JSON.parse(read('package.json'));
  passed.push('package.json 可解析');
} catch (error) {
  console.error(`✗ package.json 无法解析: ${error.message}`);
  process.exit(1);
}

check('name 不是占位用的 @local/* 或 private 包', !pkg.name.startsWith('@local/') && pkg.private !== true,
  `当前 name = ${pkg.name}`);
check('version 是合法 semver', /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(pkg.version ?? ''),
  `当前 version = ${pkg.version}`);
check('license 已声明', Boolean(pkg.license));

// ---- name must agree in three places -------------------------------------

const patchPath = pkg.dsh?.bundle?.patch ?? './cordis.patch.yml';
check('dsh.bundle.patch 已声明', Boolean(pkg.dsh?.bundle?.patch));
check('cordis.patch.yml 存在', existsSync(join(root, patchPath.replace(/^\.\//, ''))), patchPath);
check('dsh.client 已声明', Boolean(pkg.dsh?.client));

if (existsSync(join(root, 'cordis.patch.yml'))) {
  const patch = read('cordis.patch.yml');
  check('cordis.patch.yml 里的 name 与包名一致', patch.includes(`'${pkg.name}'`) || patch.includes(`"${pkg.name}"`) || patch.includes(`: ${pkg.name}`),
    `期望出现 ${pkg.name}`);
}

if (existsSync(join(root, 'client.js'))) {
  const client = read('client.js');
  check('client.js 的模块 id 与包名一致', client.includes(`'${pkg.name}'`), `期望出现 '${pkg.name}'`);
  check('client.js 里没有残留 @local/', !client.includes('@local/'));
}

// ---- exports / files point at real files ---------------------------------

for (const [key, target] of Object.entries(pkg.exports ?? {})) {
  if (typeof target !== 'string' || target.includes('*')) continue;
  check(`exports["${key}"] 指向的文件存在`, existsSync(join(root, target)), target);
}

for (const entry of pkg.files ?? []) {
  if (entry.includes('*')) continue;
  const abs = join(root, entry);
  if (!existsSync(abs)) {
    failures.push(`files 里的 ${entry} 不存在`);
    continue;
  }
  check(`files 条目 ${entry} 存在`, true);
}

// ---- personalization leftovers -------------------------------------------

const placeholderFiles = ['package.json', 'README.md', 'LICENSE', 'docs/PUBLISHING.md'];
for (const file of placeholderFiles) {
  if (!existsSync(join(root, file))) continue;
  const text = read(file);
  if (/__GITHUB_USER__|__AUTHOR__|__REPO_NAME__/.test(text)) {
    warn(`占位符残留 in ${file}`, '发布前运行 scripts/personalize.ps1');
  }
}

if (/__GITHUB_USER__|__REPO_NAME__/.test(pkg.repository?.url ?? '')) {
  warn('repository.url 仍是占位符', 'npm 依靠它把包挂回仓库');
}

// ---- report --------------------------------------------------------------

for (const line of passed) console.log(`✓ ${line}`);
for (const line of warnings) console.log(`! ${line}`);
for (const line of failures) console.log(`✗ ${line}`);

console.log('');
if (failures.length > 0) {
  console.log(`失败 ${failures.length} 项，先修好再发布。`);
  process.exit(1);
}
console.log(`通过。${warnings.length > 0 ? `还有 ${warnings.length} 条提醒。` : '没有需要处理的问题。'}`);
