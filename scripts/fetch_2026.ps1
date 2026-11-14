# Fetch 2026 global FIRMS hotspots through the area API (5-day windows), respecting the MAP_KEY
# transaction budget. Developed with SI (Claude, Anthropic) assistance. See AI_USAGE.md.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\fetch_2026.ps1 [-End 2026-11-14]
param([string]$End = (Get-Date).ToString('yyyy-MM-dd'))
$root = Split-Path $PSScriptRoot -Parent
$key = (Get-Content (Join-Path $PSScriptRoot 'firms_key.txt') -Raw).Trim()
# Backup key: used only when the primary key is rejected (expired or revoked), never to exceed the per-key limit.
$backupFile = Join-Path $PSScriptRoot 'firms_key_backup.txt'
try { $st = curl.exe -s "https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=$key" | ConvertFrom-Json } catch { $st = $null }
if ((-not $st -or $null -eq $st.transaction_limit) -and (Test-Path $backupFile)) { $key = (Get-Content $backupFile -Raw).Trim(); Write-Host 'Primary MAP_KEY rejected; using backup key.' }
$out = Join-Path $root 'data\raw\api'
$log = Join-Path $out 'fetch.log'
New-Item -ItemType Directory -Force $out | Out-Null
function Log($m) { $line = (Get-Date -Format 'HH:mm:ss') + ' ' + $m; Add-Content -Path $log -Value $line; Write-Host $line }

# source, first day, last day (SP and NRT ranges from /api/data_availability on 2026-11-14)
$jobs = @(
  @('VIIRS_SNPP_SP',    '2026-01-01', '2026-07-31'),
  @('VIIRS_SNPP_NRT',   '2026-08-01', '2026-11-02'),
  @('VIIRS_NOAA20_NRT', '2026-10-01', $End),
  @('MODIS_SP',         '2026-01-01', '2026-08-31'),
  @('MODIS_NRT',        '2026-09-01', $End)
)

function Wait-Budget {
  while ($true) {
    try {
      $s = curl.exe -s "https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=$key" | ConvertFrom-Json
      if ($s.current_transactions -lt 4300) { return }
      Log "budget $($s.current_transactions)/5000, waiting 45 s"
    } catch { Log 'status check failed, waiting 30 s' }
    Start-Sleep -Seconds 45
  }
}

foreach ($j in $jobs) {
  $src = $j[0]; $d = [datetime]$j[1]; $last = [datetime]$j[2]
  $dir = Join-Path $out $src; New-Item -ItemType Directory -Force $dir | Out-Null
  while ($d -le $last) {
    $span = [math]::Min(5, ($last - $d).Days + 1)
    $file = Join-Path $dir ($d.ToString('yyyy-MM-dd') + "_$span.csv")
    if ((Test-Path $file) -and (Get-Item $file).Length -gt 100) { $d = $d.AddDays($span); continue }
    Wait-Budget
    $tmp = "$file.part"
    $url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/$key/$src/world/$span/" + $d.ToString('yyyy-MM-dd')
    $ok = $false
    for ($try = 1; $try -le 4 -and -not $ok; $try++) {
      $code = curl.exe -s -o $tmp -w '%{http_code}' --max-time 600 $url
      $head = if (Test-Path $tmp) { (Get-Content $tmp -TotalCount 1) } else { '' }
      if ($code -eq '200' -and $head -like 'latitude*') { $ok = $true }
      else { Log "retry $try $src $($d.ToString('yyyy-MM-dd')) http=$code head=$head"; Start-Sleep -Seconds (20 * $try) }
    }
    if ($ok) { Move-Item -Force $tmp $file; Log "ok $src $($d.ToString('yyyy-MM-dd')) +$span d $([math]::Round((Get-Item $file).Length/1MB,1)) MB" }
    else { Log "FAILED $src $($d.ToString('yyyy-MM-dd'))"; Remove-Item $tmp -ErrorAction SilentlyContinue }
    $d = $d.AddDays($span)
  }
}
Log 'DONE'
