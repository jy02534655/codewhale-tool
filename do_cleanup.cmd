@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& {
  Remove-Item -LiteralPath 'D:\Code\codewhale-tool\packages\web\src\views\token\edit\' -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath 'D:\Code\codewhale-tool\packages\web\src\views\proxy\edit\' -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host 'Done'
}"