# Starts the FastAPI backend (port 8000) and the Next.js frontend (port 3000).
# Usage (from the repo root):   powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
#   add -Mock to run without API keys:   ... -File scripts\dev.ps1 -Mock
param([switch]$Mock)

$root = Split-Path -Parent $PSScriptRoot
if ($Mock) { $env:RESUMELENS_MOCK = "1" }

$backend = Start-Process -PassThru -NoNewWindow -WorkingDirectory "$root\backend" `
  -FilePath "$root\backend\.venv\Scripts\python.exe" `
  -ArgumentList "-m", "uvicorn", "app.main:app", "--port", "8000", "--reload"

Write-Host "Backend  -> http://localhost:8000/docs"
Write-Host "Frontend -> http://localhost:3000   (Ctrl+C to stop both)"
try {
  Set-Location "$root\frontend"
  npm run dev
} finally {
  Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
}
