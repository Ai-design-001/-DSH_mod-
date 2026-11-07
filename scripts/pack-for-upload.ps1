<#
.SYNOPSIS
    Build an upload-ready zip of this plugin for the GitHub web UI.

.DESCRIPTION
    Copies the repository into a temp folder, fills in the placeholders
    (GitHub user / author / optional package name), and zips the result to
    dist\<name>-upload.zip. Your working tree is left untouched, so the
    repository stays unpolarized until you actually decide to commit.

    Upload the *contents* of the zip (not the zip itself) with GitHub's
    "Add file -> Upload files". See docs/UPLOAD-VIA-WEB.md.

    ASCII-only on purpose: Windows PowerShell 5.1 decodes a BOM-less UTF-8
    .ps1 as ANSI, so a non-ASCII literal would break parsing.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/pack-for-upload.ps1 -GitHubUser zhangsan -Author "Zhang San"
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
    $RepoName = ($PluginName -split '/')[-1]
}

if ($GitHubUser -notmatch '^[A-Za-z0-9][A-Za-z0-9-]{0,38}$') {
    throw "GitHubUser is not valid: '$GitHubUser'"
}
if ($Author -match '[<>]') {
    throw "Author must not contain angle brackets: $Author"
}
if ($PluginName -notmatch '^(@[a-z0-9][a-z0-9-._~]*/)?[a-z0-9][a-z0-9-._~]*$') {
    throw "PluginName is not valid: '$PluginName'"
}
if ($RepoName -notmatch '^[A-Za-z0-9._-]+$') {
    throw "RepoName is not valid: '$RepoName' (letters, digits, dot, underscore, hyphen; no slashes)"
}

$excludedDirs = @('.git', 'node_modules', 'dist', '.vscode', '.idea')
$stage = Join-Path $env:TEMP ('dsh-upload-' + [guid]::NewGuid().ToString('N'))

New-Item -ItemType Directory -Path $stage -Force | Out-Null

try {
    Get-ChildItem -Path $root -Recurse -Force -File | ForEach-Object {
        $relative = $_.FullName.Substring($root.Length + 1)
        $segments = $relative -split '\\'

        if ($segments | Where-Object { $excludedDirs -contains $_ }) { return }
        if ($relative -like '*.tgz') { return }

        $target = Join-Path $stage $relative
        $targetDir = Split-Path -Parent $target
        if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
        Copy-Item -LiteralPath $_.FullName -Destination $target -Force
    }

    $textTargets = @('package.json', 'client.js', 'README.md', 'LICENSE', 'CHANGELOG.md', 'cordis.patch.yml', 'docs/PUBLISHING.md')
    foreach ($relative in $textTargets) {
        $path = Join-Path $stage $relative
        if (-not (Test-Path $path)) { continue }

        $text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
        $text = $text.Replace('__GITHUB_USER__', $GitHubUser)
        $text = $text.Replace('__REPO_NAME__', $RepoName)
        $text = $text.Replace('__AUTHOR__', $Author)
        if ($PluginName -ne $defaultName) { $text = $text.Replace($defaultName, $PluginName) }
        [System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
    }

    # Only the files we actually rewrite can still hold a placeholder. The
    # scripts themselves mention these strings on purpose, so leave them out.
    $leftover = @($textTargets | Where-Object {
        $p = Join-Path $stage $_
        (Test-Path $p) -and (Select-String -Path $p -Pattern '__GITHUB_USER__|__REPO_NAME__|__AUTHOR__' -SimpleMatch -Quiet)
    })
    if ($leftover.Count -gt 0) {
        throw "Placeholders left in: $($leftover -join ', ')"
    }

    $dist = Join-Path $root 'dist'
    if (-not (Test-Path $dist)) { New-Item -ItemType Directory -Path $dist -Force | Out-Null }

    $zip = Join-Path $dist ($PluginName.Replace('@', '').Replace('/', '-') + '-upload.zip')
    if (Test-Path $zip) { Remove-Item $zip -Force }
    Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -Force

    $files = Get-ChildItem -Path $stage -Recurse -File
    Write-Host "Packed $($files.Count) files:"
    $files | ForEach-Object { Write-Host ("  " + $_.FullName.Substring($stage.Length + 1)) }
    Write-Host ''
    Write-Host "Zip: $zip"
    Write-Host ''
    Write-Host 'Next: docs/UPLOAD-VIA-WEB.md'
    Write-Host 'Note: .gitignore is a dotfile - browsers usually skip it when you drag a folder.'
    Write-Host '      Create it separately with "Add file -> Create new file".'
}
finally {
    if (Test-Path $stage) { Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue }
}
