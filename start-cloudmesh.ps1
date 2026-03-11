# CloudMesh Full Stack Starter
# Starts all Go microservices and the Vite frontend

$GO_BIN = "C:\Program Files\Go\bin\go.exe"

Write-Host "--- Starting CloudMesh Backend ---" -ForegroundColor Cyan

# 1. Telemetry Hub
Write-Host "[1/6] Starting Telemetry Hub on :8080..."
Start-Process powershell -ArgumentList "-NoProfile -Command & '$GO_BIN' run main.go" -WorkingDirectory "backend/telemetry-svc"

# 2. Inventory Service
Write-Host "[2/6] Starting Inventory Service on :8084..."
Start-Process powershell -ArgumentList "-NoProfile -Command & '$GO_BIN' run main.go" -WorkingDirectory "backend/inventory-svc"

# 3. Orders Service
Write-Host "[3/6] Starting Orders Service on :8083..."
Start-Process powershell -ArgumentList "-NoProfile -Command & '$GO_BIN' run main.go" -WorkingDirectory "backend/orders-svc"

# 4. Auth Service
Write-Host "[4/6] Starting Auth Service on :8082..."
Start-Process powershell -ArgumentList "-NoProfile -Command & '$GO_BIN' run main.go" -WorkingDirectory "backend/auth-svc"

# 5. Gateway Service
Write-Host "[5/6] Starting Gateway Service on :8081..."
Start-Process powershell -ArgumentList "-NoProfile -Command & '$GO_BIN' run main.go" -WorkingDirectory "backend/gateway-svc"

Write-Host "--- Starting CloudMesh Frontend ---" -ForegroundColor Cyan

# 6. Vite Frontend
Write-Host "[6/6] Starting Vite Dev Server on :5173..."
Start-Process powershell -ArgumentList "-NoProfile -Command npm run dev"

Write-Host "--- CloudMesh is GO! ---" -ForegroundColor Green
Write-Host "Dashboard: http://localhost:5173"
Write-Host "Trigger a Trace: http://localhost:8081/"
Write-Host "Press Ctrl+C in the main terminals to stop services."
