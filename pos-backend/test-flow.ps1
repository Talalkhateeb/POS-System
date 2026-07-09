# =====================================================================
#  Returns Test Suite
#  Covers UC-03/03a/03b, FR-5.1–FR-5.4, FR-4.5 (price snapshot integrity)
# =====================================================================

$base = "http://localhost:8000/api"
$script:pass = 0
$script:fail = 0

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    $Headers["Accept"] = "application/json"
    $params = @{
        Uri                 = $Uri
        Method              = $Method
        Headers             = $Headers
        UseBasicParsing     = $true
        MaximumRedirection  = 0
        ErrorAction         = "Stop"
    }
    if ($Body) {
        $params.Body        = ($Body | ConvertTo-Json -Depth 10)
        $params.ContentType = "application/json"
    }
    try {
        $r = Invoke-WebRequest @params
        return [PSCustomObject]@{
            Status = [int]$r.StatusCode
            Data   = if ($r.Content) { $r.Content | ConvertFrom-Json } else { $null }
        }
    } catch {
        $status = $null; $content = $null
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode.value__
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $content = $reader.ReadToEnd()
        }
        return [PSCustomObject]@{
            Status = $status
            Data   = if ($content) { try { $content | ConvertFrom-Json } catch { $null } } else { $null }
        }
    }
}

function Assert-Status {
    param([string]$Name, [int]$Expected, [int]$Actual, [string]$Detail = "")
    if ($Actual -eq $Expected) {
        Write-Host "PASS  $Name" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "FAIL  $Name (expected $Expected, got $Actual) $Detail" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host "`n=== SETUP ===" -ForegroundColor Cyan

$loginA = Invoke-Api -Method Post -Uri "$base/login" -Body @{ username = "admin"; password = "admin1234" }
$hAdmin = @{ Authorization = "Bearer $($loginA.Data.token)" }

$login1 = Invoke-Api -Method Post -Uri "$base/login" -Body @{ username = "cashier1"; password = "password" }
$h1 = @{ Authorization = "Bearer $($login1.Data.token)" }

# Second cashier — needed for the cross-cashier visibility negative test
$newCashierUsername = "test_cashier_$(Get-Random)"
$createC2 = Invoke-Api -Method Post -Uri "$base/users" -Headers $hAdmin -Body @{
    name = "Test Cashier 2"; username = $newCashierUsername
    email = "$newCashierUsername@example.com"; role = "cashier"
}
$login2 = Invoke-Api -Method Post -Uri "$base/login" -Body @{
    username = $newCashierUsername; password = $createC2.Data.temp_password
}
$h2 = @{ Authorization = "Bearer $($login2.Data.token)" }

# Fresh products every run — never rely on existing rows or their stock levels
$productA = Invoke-Api -Method Post -Uri "$base/products" -Headers $hAdmin -Body @{
    name = "Return Test Item $(Get-Random)"; price = 10; stock = 20; min_stock_threshold = 5
}
$productAId = $productA.Data.data.id

$productB = Invoke-Api -Method Post -Uri "$base/products" -Headers $hAdmin -Body @{
    name = "Off-Invoice Item $(Get-Random)"; price = 5; stock = 10; min_stock_threshold = 2
}
$productBId = $productB.Data.data.id

Write-Host "Products created: A=$productAId (stock 20), B=$productBId (stock 10)" -ForegroundColor Gray

# Clean shift state, then open one for the whole suite
Invoke-Api -Method Post -Uri "$base/shifts/close" -Headers $h1 -Body @{ counted_balance = 0 } | Out-Null
$shift = Invoke-Api -Method Post -Uri "$base/shifts/open" -Headers $h1 -Body @{ opening_balance = 100000 }

# Sell 5 units of product A (cash) — this is the invoice all return tests target
$invoice = Invoke-Api -Method Post -Uri "$base/invoices" -Headers $h1 -Body @{
    payment_method = "cash"
    items = @(@{ product_id = $productAId; quantity = 5 })
}
$invoiceId = $invoice.Data.data.id
Write-Host "Invoice #$invoiceId created, total = $($invoice.Data.data.total)" -ForegroundColor Gray

Write-Host "`n=== POSITIVE TESTS ===" -ForegroundColor Cyan

# P1 — partial return (2 of 5 units)
$p1 = Invoke-Api -Method Post -Uri "$base/returns" -Headers $h1 -Body @{
    invoice_id = $invoiceId
    items = @(@{ product_id = $productAId; quantity = 2 })
}
Assert-Status "P1: partial return succeeds" 201 $p1.Status
$expectedP1 = 20 + (20 * 0.10)  # base (2 x 10) + 10% tax, matching invoice.tax_rate_applied
if ($p1.Data.data.total_return_amount -eq $expectedP1) {
    Write-Host "PASS  P1b: return amount = base + proportional tax ($expectedP1)" -ForegroundColor Green; $script:pass++
} else {
    Write-Host "FAIL  P1b: return amount was $($p1.Data.data.total_return_amount), wanted $expectedP1" -ForegroundColor Red; $script:fail++
}
$returnId = $p1.Data.data.id

# P2 — return the exact remaining quantity (3 of the remaining 3)
$p2 = Invoke-Api -Method Post -Uri "$base/returns" -Headers $h1 -Body @{
    invoice_id = $invoiceId
    items = @(@{ product_id = $productAId; quantity = 3 })
}
Assert-Status "P2: return of exact remaining quantity succeeds" 201 $p2.Status

# P3 — stock fully restored: 20 - 5 (sold) + 5 (returned) = 20
$productsAfter = Invoke-Api -Method Get -Uri "$base/products" -Headers $h1
$stockAfter = ($productsAfter.Data.data | Where-Object { $_.id -eq $productAId }).stock
if ($stockAfter -eq 20) {
    Write-Host "PASS  P3: stock fully restored to 20" -ForegroundColor Green; $script:pass++
} else {
    Write-Host "FAIL  P3: stock was $stockAfter, wanted 20" -ForegroundColor Red; $script:fail++
}

# P4 — cash balance nets back to opening: full sale (+50) fully returned (-50)
$currentAfter = Invoke-Api -Method Get -Uri "$base/shifts/current" -Headers $h1
if ($currentAfter.Data.expected_balance -eq 100000) {
    Write-Host "PASS  P4: expected_balance nets back to 100000 after full return" -ForegroundColor Green; $script:pass++
} else {
    Write-Host "FAIL  P4: expected_balance was $($currentAfter.Data.expected_balance), wanted 100000" -ForegroundColor Red; $script:fail++
}

Write-Host "`n=== NEGATIVE TESTS ===" -ForegroundColor Cyan

# N1 — return against a nonexistent invoice
$n1 = Invoke-Api -Method Post -Uri "$base/returns" -Headers $h1 -Body @{
    invoice_id = 9999999
    items = @(@{ product_id = $productAId; quantity = 1 })
}
Assert-Status "N1: nonexistent invoice_id -> 422" 422 $n1.Status

# N2 — over-return: everything already returned in P1+P2, so 1 more must fail (FR-5.4)
$n2 = Invoke-Api -Method Post -Uri "$base/returns" -Headers $h1 -Body @{
    invoice_id = $invoiceId
    items = @(@{ product_id = $productAId; quantity = 1 })
}
Assert-Status "N2: over-return beyond remaining qty -> 422" 422 $n2.Status

# N3 — return a product that was never on this invoice
$n3 = Invoke-Api -Method Post -Uri "$base/returns" -Headers $h1 -Body @{
    invoice_id = $invoiceId
    items = @(@{ product_id = $productBId; quantity = 1 })
}
Assert-Status "N3: product not on invoice -> 422" 422 $n3.Status

# N4 — no open shift: close it, then attempt a return
Invoke-Api -Method Post -Uri "$base/shifts/close" -Headers $h1 -Body @{ counted_balance = 100000 } | Out-Null
$n4 = Invoke-Api -Method Post -Uri "$base/returns" -Headers $h1 -Body @{
    invoice_id = $invoiceId
    items = @(@{ product_id = $productAId; quantity = 1 })
}
Assert-Status "N4: return attempted with no open shift -> 422" 422 $n4.Status

# N5 — a different cashier must not view this cashier's return record
$n5 = Invoke-Api -Method Get -Uri "$base/returns/$returnId" -Headers $h2
Assert-Status "N5: cross-cashier return visibility -> 403" 403 $n5.Status

# N6 — unauthenticated request
$n6 = Invoke-Api -Method Post -Uri "$base/returns" -Headers @{} -Body @{
    invoice_id = $invoiceId
    items = @(@{ product_id = $productAId; quantity = 1 })
}
Assert-Status "N6: unauthenticated request -> 401" 401 $n6.Status

Write-Host "`n=== SUMMARY: $($script:pass) passed, $($script:fail) failed ===" -ForegroundColor $(if ($script:fail -eq 0) { "Green" } else { "Red" })