# Builds FireSync_portable.zip (app + data products + code + docs) to carry the project to another computer.
# Excludes the 9 GB raw archives, intermediate bins, compiled binaries and the private MAP_KEY files.
# Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md.
$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path (Split-Path $root -Parent) 'FireSync_portable.zip'
$stage = Join-Path $env:TEMP 'FireSync_portable'
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory $stage | Out-Null
$exclude = @('data\raw', 'data\work', 'pipeline\bin', 'research_notes')
Get-ChildItem $root -Recurse -File | Where-Object {
  $rel = $_.FullName.Substring($root.Length + 1)
  -not ($exclude | Where-Object { $rel.StartsWith($_) }) -and $_.Name -notlike 'firms_key*' -and $_.Extension -ne '.zip' -and $_.Name -notlike 'UsersAdministrator*'
} | ForEach-Object {
  $rel = $_.FullName.Substring($root.Length + 1)
  $dest = Join-Path $stage "FireSync\$rel"
  New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
  Copy-Item $_.FullName $dest
}
# keep the research notes too (small, useful on the laptop)
Copy-Item -Recurse (Join-Path $root 'research_notes') (Join-Path $stage 'FireSync\research_notes') -ErrorAction SilentlyContinue
if (Test-Path $out) { Remove-Item $out }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($stage, $out, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Remove-Item -Recurse -Force $stage
Write-Host ("Created $out (" + [math]::Round((Get-Item $out).Length / 1MB, 1) + " MB)")
