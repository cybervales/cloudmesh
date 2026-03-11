# CloudMesh Stable Starter (Binary Mode)
# Starts compiled Go binaries and Vite frontend

Write-Host "--- Initializing CloudMesh Stable Boot ---" -ForegroundColor Cyan

function Start-MeshService {
    param($Name, $Path, $Port)
    Write-Host "[*] Launching $Name on :$Port..."
    Start-Process -FilePath ".\$Name.exe" -WorkingDirectory $Path -NoNewWindow
    
    # Health check
    Start-Sleep -Seconds 2
    $check = netstat -ano | findstr "LISTENING" | findstr ":$Port"
    if ($check) {
        Write-Host "[OK] $Name is ACTIVE" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $Name failed to start on :$Port" -ForegroundColor Red
    }
}

# 1. Telemetry Hub
Start-MeshService "telemetry-svc" "backend\telemetry-svc" 8080

# 2. Inventory Service
Start-MeshService "inventory-svc" "backend\inventory-svc" 8084

# 3. Orders Service
Start-MeshService "orders-svc" "backend\orders-svc" 8083

# 4. Auth Service
Start-MeshService "auth-svc" "backend\auth-svc" 8082

# 5. Gateway Service
Start-MeshService "gateway-svc" "backend\gateway-svc" 8081

# 6. Vite Frontend
Write-Host "[*] Starting Vite Frontend on :5173..."
Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow

Write-Host "--- CloudMesh Deployment Complete ---" -ForegroundColor Cyan
Write-Host "Dashboard: http://localhost:5173"
Write-Host "Trigger Trace: http://localhost:8081/"
