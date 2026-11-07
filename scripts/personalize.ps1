<#
.SYNOPSIS
    Fill in the three values that must be personalized before publishing:
    GitHub user, author name, and (optionally) the package name.

.DESCRIPTION
    Replaces the placeholders so that none of them reaches npm or GitHub:

        __GITHUB_USER__  ->  -GitHubUser
        __REPO_NAME__    ->  -RepoName     (GitHub repo segment in every URL)
        __AUTHOR__       ->  -Author
        default name     ->  -PluginName   (optional; also rewrites the module id in
                                            client.js and the row name in cordis.patch.yml)

    The GitHub repo name and the npm package name are independent: a repo called
    "my-dsh-mod" can still ship a package called
    "dsh-plugin-session-delete-and-appearance". -RepoName defaults to the package
    name without its npm scope.

    Safe to re-run: already-replaced files are left untouched.

    This script is deliberately ASCII-only. Windows PowerShell 5.1 decodes a
    BOM-less UTF-8 .ps1 as ANSI, so any non-ASCII literal would break parsing
    the moment an editor strips the BOM.

.EXAMPLE
    powershell -File scripts/personalize.ps1 -GitHubUser zhangsan -Author "Zhang San"

.EXAMPLE
    # Repo name differs from the package name
    powershell -File scripts/personalize.ps1 -GitHubUser zhangsan -Author "Zhang San" `
      -RepoName "-DSH_mod-"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$GitHubUser,

    [Parameter(Mandatory = $true)]
    [string]$Author,

    [string]$PluginName = 'dsh-plugin-session-delete-and-appearance',

    [string]$RepoName
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$defaultName = 'dsh-plugin-session-delete-and-appearance'

if ([string]::IsNullOrWhiteSpace($RepoName)) {
    # GitHub repo name defaults to the package name without its npm scope.
    $RepoName = ($PluginName -split '/')[-1]
}

if ($GitHubUser -notmatch '^[A-Za-z0-9][A-Za-z0-9-]{0,38}$') {
    throw "GitHubUser is not valid: '$GitHubUser' (letters, digits and hyphens only; cannot start with a hyphen)"
}

if ($PluginName -notmatch '^(@[a-z0-9][a-z0-9-._~]*/)?[a-z0-9][a-z0-9-._~]*$') {
    throw "PluginName is not valid: '$PluginName' (npm names are lowercase; scope looks like @user/name)"
}

if ($RepoName -notmatch '^[A-Za-z0-9._-]+$') {
    throw "RepoName is not valid: '$RepoName' (letters, digits, dot, underscore, hyphen; no slashes)"
}

if ($Author -match '[<>]') {
    throw "Author must not contain angle brackets: $Author"
}

$targets = @(
    'package.json',
    'client.js',
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    'cordis.patch.yml',
    'docs/PUBLISHING.md'
)

$changed = @()

foreach ($relative in $targets) {
    $path = Join-Path $root $relative
    if (-not (Test-Path $path)) { continue }

    $before = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $after = $before

    # String.Replace, not -replace: a "$" in the replacement text is literal here.
    $after = $after.Replace('__GITHUB_USER__', $GitHubUser)
    $after = $after.Replace('__REPO_NAME__', $RepoName)
    $after = $after.Replace('__AUTHOR__', $Author)

    if ($PluginName -ne $defaultName) {
        $after = $after.Replace($defaultName, $PluginName)
    }

    if ($after -ne $before) {
        [System.IO.File]::WriteAllText($path, $after, (New-Object System.Text.UTF8Encoding($false)))
        $changed += $relative
    }
}

if ($changed.Count -eq 0) {
    Write-Host 'Nothing to replace (already personalized?).'
} else {
    Write-Host "Updated $($changed.Count) file(s):"
    $changed | ForEach-Object { Write-Host "  - $_" }
}

Write-Host ''
Write-Host 'Next:'
Write-Host '  1. node scripts/check.mjs          # name consistency, no placeholders left'
Write-Host '  2. git init -b main && git add . && git commit -m "feat: initial release"'
Write-Host '  3. push to a GitHub repo with the same name'
Write-Host '  4. npm publish'
Write-Host '  5. open the PR against awesome-dsh-plugin (see docs/PUBLISHING.md)'
