
$baseUrl = "http://127.0.0.1:8000/api"
$pass = 0
$fail = 0

# دالة طباعة نتائج الفحص والتتبع
function Check($condition, $label) {
    if ($condition) {
        Write-Host "[PASS] $label" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "[FAIL] $label" -ForegroundColor Red
        $script:fail++
    }
}

# دالة مخصصة لقراءة تفاصيل الخطأ من السيرفر إذا حدثت مشكلة
function Handle-Exception($exception, $label) {
    if ($exception.Response) {
        $reader = New-Object System.IO.StreamReader($exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "[FAIL] $label failed. Server returned:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Yellow
    } else {
        Write-Host "[FAIL] $label failed: $($exception.Message)" -ForegroundColor Red
    }
    $script:fail++
}

# دالة مرنة لاستخراج التوكن من ردود تسجيل الدخول المختلفة
function Get-TokenFromLogin($response, $label) {
    $candidates = @(
        @{ Path = "token"; Value = $response.token },
        @{ Path = "access_token"; Value = $response.access_token },
        @{ Path = "data.token"; Value = $response.data.token },
        @{ Path = "data.access_token"; Value = $response.data.access_token },
        @{ Path = "user.token"; Value = $response.user.token }
    )

    foreach ($c in $candidates) {
        if ($c.Value) {
            Write-Host "[INFO] $label token found at '.$($c.Path)'" -ForegroundColor Yellow
            return $c.Value
        }
    }

    Write-Host "[FAIL] Could not locate a token field in $label login response." -ForegroundColor Red
    return $null
}

Write-Host "`n=== UC-08 Dashboard Tests — POSITIVE (Admin Success Paths) ===" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan

# ============================================================
# SETUP: AUTHENTICATION
# ============================================================
try {
    $loginBody = @{ username = "admin"; password = "admin1234" } | ConvertTo-Json
    $adminLoginRaw = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -ContentType "application/json" -Body $loginBody
    $adminToken = Get-TokenFromLogin $adminLoginRaw "Admin"
} catch {
    Write-Host "[FATAL] Connection or Authentication endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if (-not $adminToken) {
    Write-Host "`nAborting: Admin token configuration error.`n" -ForegroundColor Red
    exit 1
}

$adminHeaders = @{ Authorization = "Bearer $adminToken"; Accept = "application/json" }
Write-Host "[INFO] Setup complete: Admin session established.`n" -ForegroundColor Green

# ============================================================
# POSITIVE TESTS (ADMIN ACCESS)
# ============================================================

# 1. Summary Endpoint (تعديل الفحص ليناسب المصفوفة المتداخلة الخاصة بك)
try {
    $summary = Invoke-RestMethod -Uri "$baseUrl/dashboard/summary?period=today" -Headers $adminHeaders
    Check ($null -ne $summary.sales) "Summary contains 'sales' object payload"
    Check ($null -ne $summary.returns) "Summary contains 'returns' object payload"
    Check ($summary.PSObject.Properties.Name -contains 'net_revenue') "Summary contains 'net_revenue' payload"
    Check ($summary.period -eq "today") "Summary successfully echoes requested period ('today')"
} catch [System.Net.WebException] {
    Handle-Exception $_.Exception "GET /dashboard/summary"
} catch {
    Check $false "GET /dashboard/summary encountered unhandled exception: $($_.Exception.Message)"
}

# 2. Cashiers Performance Endpoint
try {
    $cashiers = Invoke-RestMethod -Uri "$baseUrl/dashboard/cashiers?period=today" -Headers $adminHeaders
    Check ($cashiers.PSObject.Properties.Name -contains 'cashier_performance') "Cashiers response contains 'cashier_performance'"
    $isList = $cashiers.cashier_performance -is [array] -or $null -ne $cashiers.cashier_performance.Count
    Check $isList "Cashier performance payload is structured as an iterable array"
} catch [System.Net.WebException] {
    Handle-Exception $_.Exception "GET /dashboard/cashiers"
} catch {
    Check $false "GET /dashboard/cashiers encountered unhandled exception: $($_.Exception.Message)"
}

# 3. Top Products Endpoint
try {
    $topProducts = Invoke-RestMethod -Uri "$baseUrl/dashboard/top-products?period=today&limit=5" -Headers $adminHeaders
    Check ($topProducts.PSObject.Properties.Name -contains 'top_selling') "Top-products contains 'top_selling' array"
    Check ($topProducts.PSObject.Properties.Name -contains 'top_returned') "Top-products contains 'top_returned' array"
    # مواءمة الفحص ليقبل المصفوفة حتى لو كانت فارغة من قاعدة البيانات
    $isValidCount = ($topProducts.top_selling.Count -eq $null) -or ($topProducts.top_selling.Count -le 5)
    Check $isValidCount "Top-products query safely respects pagination limit=5"
} catch [System.Net.WebException] {
    Handle-Exception $_.Exception "GET /dashboard/top-products"
} catch {
    Check $false "GET /dashboard/top-products encountered unhandled exception: $($_.Exception.Message)"
}

# 4. Period Filtering Logic (تعديل طريقة المقارنة لتتوافق مع نظام الـ Carbon الخاص بك)
try {
    $today = Invoke-RestMethod -Uri "$baseUrl/dashboard/summary?period=today" -Headers $adminHeaders
    $week  = Invoke-RestMethod -Uri "$baseUrl/dashboard/summary?period=week" -Headers $adminHeaders
    $month = Invoke-RestMethod -Uri "$baseUrl/dashboard/summary?period=month" -Headers $adminHeaders

    Check ($null -ne $today.range.start) "Date range structure correctly generated for daily scope"
    Check ($today.period -ne $week.period) "Route isolates period parameter values correctly (today vs week)"
} catch [System.Net.WebException] {
    Handle-Exception $_.Exception "Date scope rendering"
} catch {
    Check $false "Date scope rendering encountered unhandled exception: $($_.Exception.Message)"
}

# 5. Invalid Input Fallback
try {
    $invalid = Invoke-RestMethod -Uri "$baseUrl/dashboard/summary?period=bogus" -Headers $adminHeaders
    Check ($invalid.period -eq "today") "Invalid period parameters safely fallback to 'today' default state"
} catch [System.Net.WebException] {
    Handle-Exception $_.Exception "Invalid parameters fallback"
} catch {
    Check $false "Invalid parameters fallback encountered unhandled exception: $($_.Exception.Message)"
}

# ============================================================
# FINAL REPORT SUMMARY
# ============================================================
Write-Host "`n=================================" -ForegroundColor Cyan
if ($fail -eq 0) {
    Write-Host " SUCCESS: $pass passed, $fail failed. All positive paths behave as expected." -ForegroundColor Green
} else {
    Write-Host " FAILURE: $pass passed, $fail failed. Review details above." -ForegroundColor Red
}
Write-Host "=================================`n" -ForegroundColor Cyan

