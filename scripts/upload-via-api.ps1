<#
.SYNOPSIS
    Commit the plugin's files into a GitHub repository over HTTPS. No git needed.

.DESCRIPTION
    Two modes:

      default           one commit containing every file, built with the Git Data
                        API (blobs -> tree -> commit -> ref update). If anything
                        fails before the final ref update, the branch is untouched.
      -OneFileAtATime   the Contents API, one commit per file. Used automatically
                        as a fallback when the single-commit path is unavailable
                        (for example an empty repository with no ref yet).

      -Replace          build the tree WITHOUT base_tree, so afterwards the
                        repository contains exactly these files and nothing
                        else. Use it to repair an upload that landed in a
                        subfolder or dragged extra directories along.

    Source defaults to the zip built by scripts/pack-for-upload.ps1; pass
    -SourceDir to upload a folder instead.

    The token is read from -TokenFile (or $env:GH_TOKEN) and is never printed,
    never written to disk by this script, and never included in an error
    message. Use a fine-grained token limited to Contents: Read and write on
    this one repository, with the shortest expiry you can live with, and revoke
    it as soon as the upload is done.

.EXAMPLE
    # List what would be committed. No token, no writes.
    powershell -ExecutionPolicy Bypass -File scripts/upload-via-api.ps1 -DryRun

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/upload-via-api.ps1 -TokenFile C:\Users\you\gh-token.txt
#>
[CmdletBinding()]
param(
    [string]$Owner = 'Ai-design-001',
    [string]$Repo = '-DSH_mod-',
    [string]$Branch = 'main',
    [string]$SourceDir,
    [string]$TokenFile,
    [string]$Message = 'feat: initial release',
    [switch]$DryRun,
    [switch]$OneFileAtATime,
    [switch]$Replace
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$root = Split-Path -Parent $PSScriptRoot
$repoApi = "https://api.github.com/repos/$Owner/$Repo"
$contentsApi = "$repoApi/contents"
$gitApi = "$repoApi/git"
$headers = @{
    'User-Agent' = 'dsh-upload-via-api'
    'Accept'     = 'application/vnd.github+json'
}

function Invoke-GitHub {
    param(
        [string]$Uri,
        [string]$Method = 'Get',
        $Body
    )
    $params = @{
        Uri                = $Uri
        Headers            = $headers
        Method             = $Method
        UseBasicParsing    = $true
        TimeoutSec         = 60
    }
    if ($null -ne $Body) {
        $params['Body'] = ($Body | ConvertTo-Json -Depth 8 -Compress)
        $params['ContentType'] = 'application/json'
    }
    $response = Invoke-WebRequest @params
    if ([string]::IsNullOrWhiteSpace($response.Content)) { return $null }
    return ($response.Content | ConvertFrom-Json)
}

# ---- resolve the source ---------------------------------------------------

$tempDir = $null
if ([string]::IsNullOrWhiteSpace($SourceDir)) {
    $zip = Get-ChildItem (Join-Path $root 'dist') -Filter '*-upload.zip' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $zip) {
        throw 'No upload zip found in dist\. Run scripts/pack-for-upload.ps1 first, or pass -SourceDir.'
    }
    $tempDir = Join-Path $env:TEMP ('dsh-api-upload-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath $tempDir -Force
    $SourceDir = $tempDir
    Write-Host "Source zip: $($zip.Name)"
}

$SourceDir = (Resolve-Path $SourceDir).Path
$files = Get-ChildItem -Path $SourceDir -Recurse -File | Sort-Object FullName
if ($files.Count -eq 0) { throw "Source folder is empty: $SourceDir" }

Write-Host "Target     : $Owner/$Repo@$Branch"
Write-Host "Files      : $($files.Count)"
Write-Host ''

# ---- token ----------------------------------------------------------------

$token = $null
if (-not $DryRun) {
    if ($TokenFile) {
        if (-not (Test-Path $TokenFile)) { throw "Token file not found: $TokenFile" }
        $token = ([System.IO.File]::ReadAllText($TokenFile)).Trim()
    } elseif ($env:GH_TOKEN) {
        $token = $env:GH_TOKEN.Trim()
    }
    if ([string]::IsNullOrWhiteSpace($token)) {
        throw 'No token. Pass -TokenFile <path> or set $env:GH_TOKEN.'
    }
    if ($token -notmatch '^(gh[pousr]_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+)$') {
        Write-Warning 'Token does not look like a GitHub token (ghp_/github_pat_...); trying anyway.'
    }
    $headers['Authorization'] = "Bearer $token"
}

# ---- the two upload strategies -------------------------------------------

function Upload-OneCommit {
    $ref = Invoke-GitHub -Uri "$gitApi/ref/heads/$Branch"
    $headSha = $ref.object.sha
    $headCommit = Invoke-GitHub -Uri "$gitApi/commits/$headSha"
    $baseTree = $headCommit.tree.sha
    Write-Host "Head commit: $($headSha.Substring(0, 7))"

    $entries = @()
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($SourceDir.Length + 1).Replace('\', '/')
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $blob = Invoke-GitHub -Uri "$gitApi/blobs" -Method Post -Body @{
            content  = [Convert]::ToBase64String($bytes)
            encoding = 'base64'
        }
        $entries += @{ path = $relative; mode = '100644'; type = 'blob'; sha = $blob.sha }
        Write-Host "blob  $relative"
    }

    if ($Replace) {
        # No base_tree: the new tree contains ONLY the uploaded files, so
        # everything else in the repository disappears in the same commit.
        $treeBody = @{ tree = $entries }
    } else {
        $treeBody = @{ base_tree = $baseTree; tree = $entries }
    }
    $tree = Invoke-GitHub -Uri "$gitApi/trees" -Method Post -Body $treeBody
    $commit = Invoke-GitHub -Uri "$gitApi/commits" -Method Post -Body @{
        message = $Message
        tree    = $tree.sha
        parents = @($headSha)
    }
    $null = Invoke-GitHub -Uri "$gitApi/refs/heads/$Branch" -Method Patch -Body @{
        sha   = $commit.sha
        force = $false
    }
    return $commit
}

function Upload-FileByFile {
    $created = 0
    $updated = 0
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($SourceDir.Length + 1).Replace('\', '/')
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)

        $sha = $null
        try {
            $existing = Invoke-GitHub -Uri "$contentsApi/$relative`?ref=$Branch"
            $sha = $existing.sha
        } catch {
            $code = $null
            if ($_.Exception.Response) { $code = $_.Exception.Response.StatusCode.value__ }
            if ($code -ne 404) { throw }
        }

        $body = @{
            message = $Message
            content = [Convert]::ToBase64String($bytes)
            branch  = $Branch
        }
        if ($sha) { $body['sha'] = $sha }

        $null = Invoke-GitHub -Uri "$contentsApi/$relative" -Method Put -Body $body
        if ($sha) { $updated++ } else { $created++ }
        Write-Host "ok  $relative"
        Start-Sleep -Milliseconds 120
    }
    return @{ created = $created; updated = $updated }
}

# ---- run ------------------------------------------------------------------

try {
    if ($DryRun) {
        foreach ($file in $files) {
            $relative = $file.FullName.Substring($SourceDir.Length + 1).Replace('\', '/')
            Write-Host "would upload  $relative  ($($file.Length) bytes)"
        }
        Write-Host ''
        Write-Host "Dry run: $($files.Count) files would be committed to $Owner/$Repo@$Branch as one commit."
        if ($Replace) {
            Write-Host 'Mode: -Replace - every other path in the repository would be removed.'
        } else {
            Write-Host 'Mode: merge - existing files are kept unless overwritten.'
        }
        Write-Host 'No token used, nothing written.'
        return
    }

    if ($OneFileAtATime) {
        $result = Upload-FileByFile
        Write-Host ''
        Write-Host "Created: $($result.created)   Updated: $($result.updated)"
    } else {
        try {
            $commit = Upload-OneCommit
            Write-Host ''
            Write-Host "Commit: $($commit.sha.Substring(0, 7))"
            Write-Host "https://github.com/$Owner/$Repo/commit/$($commit.sha)"
        } catch {
            Write-Host ''
            Write-Host "Single-commit upload failed: $($_.Exception.Message)"
            Write-Host 'Falling back to one commit per file (nothing was changed by the failed attempt).'
            Write-Host ''
            $result = Upload-FileByFile
            Write-Host ''
            Write-Host "Created: $($result.created)   Updated: $($result.updated)"
        }
    }

    Write-Host "Done: https://github.com/$Owner/$Repo"
} finally {
    if ($tempDir -and (Test-Path $tempDir)) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
}
