# FireSync local static server (no Python/Node needed). Developed with SI (Claude, Anthropic) assistance.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\serve.ps1 [-Port 8080]
param([int]$Port = 8080, [string]$Root = "")
if (-not $Root) { $Root = Join-Path $PSScriptRoot '..\web' }
$Root = (Resolve-Path $Root).Path.TrimEnd('\')
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'
  '.svg' = 'image/svg+xml'; '.csv' = 'text/csv; charset=utf-8'; '.ico' = 'image/x-icon'; '.webp' = 'image/webp'; '.md' = 'text/markdown; charset=utf-8'
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "FireSync dev server on http://localhost:$Port/  (root: $Root)"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '') { $rel = 'index.html' }
      $path = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
      if (-not $path.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $res.StatusCode = 404
        $b = [Text.Encoding]::UTF8.GetBytes('Not found')
        $res.OutputStream.Write($b, 0, $b.Length)
      } else {
        $ext = [IO.Path]::GetExtension($path).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-cache')
        $bytes = [IO.File]::ReadAllBytes($path)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } catch { try { $res.StatusCode = 500 } catch {} }
    finally { try { $res.OutputStream.Close() } catch {} }
  }
} finally { $listener.Stop() }
