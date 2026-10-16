$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$packageInfo = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json
$releaseName = 'Coin-Clicker-' + $packageInfo.version
$releaseDirectory = Join-Path $projectRoot 'releases'
$stage = Join-Path $projectRoot ('tmp/package-' + [Guid]::NewGuid().ToString('N'))
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'dist/index.html'))) { throw 'Run npm run build before packaging.' }
New-Item -ItemType Directory -Path $stage, $releaseDirectory -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage 'scripts') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'dist') -Destination $stage -Recurse
Copy-Item -LiteralPath (Join-Path $projectRoot 'scripts/serve-local.mjs') -Destination (Join-Path $stage 'scripts')
Copy-Item -LiteralPath (Join-Path $projectRoot 'Mo-Coin-Clicker.cmd') -Destination $stage
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/PLAY-LOCAL.md') -Destination (Join-Path $stage 'README.md')
$archive = Join-Path $releaseDirectory ($releaseName + '.zip')
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $archive -Force
$hash = Get-FileHash -LiteralPath $archive -Algorithm SHA256
($hash.Hash + '  ' + [System.IO.Path]::GetFileName($archive)) | Set-Content -LiteralPath ($archive + '.sha256') -Encoding ASCII
# Delete only this script's verified staging directory, never source or user saves.
$resolvedStage = [System.IO.Path]::GetFullPath($stage)
$expectedParent = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'tmp'))
if ([System.IO.Path]::GetDirectoryName($resolvedStage) -ne $expectedParent -or -not ([System.IO.Path]::GetFileName($resolvedStage).StartsWith('package-'))) { throw 'Unsafe staging path.' }
Remove-Item -LiteralPath $resolvedStage -Recurse -Force
Write-Output $archive
Write-Output ('SHA256: ' + $hash.Hash)
