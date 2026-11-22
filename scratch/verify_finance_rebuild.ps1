$secret = "ElectroSL_Super_Secret_Key_At_Least_32_Characters_Long_For_Jwt_Security!"
$baseUrl = "http://localhost:5192"

function New-JwtToken {
    param([int]$userId, [string]$email, [string]$role, [string]$secret)
    $header = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes('{"alg":"HS256","typ":"JWT"}')).TrimEnd('=').Replace('+','-').Replace('/','_')
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $exp = $now + 7200
    $payloadJson = "{`"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier`":`"$userId`",`"sub`":`"$userId`",`"email`":`"$email`",`"http://schemas.microsoft.com/ws/2008/06/identity/claims/role`":`"$role`",`"role`":`"$role`",`"nbf`":$now,`"exp`":$exp,`"iat`":$now,`"iss`":`"ElectroSL`",`"aud`":`"ElectroSL_Clients`"}"
    $payload = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($payloadJson)).TrimEnd('=').Replace('+','-').Replace('/','_')
    $toSign = "$header.$payload"
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
    $sig = [Convert]::ToBase64String($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($toSign))).TrimEnd('=').Replace('+','-').Replace('/','_')
    return "$toSign.$sig"
}

$adminToken = New-JwtToken -userId 1 -email "admin@electrosl.lk" -role "Admin" -secret $secret
$custToken  = New-JwtToken -userId 9 -email "cust_debug@electrosl.lk" -role "Customer" -secret $secret
$elecToken  = New-JwtToken -userId 10 -email "elec_debug@electrosl.lk" -role "Electrician" -secret $secret

function Invoke-Api {
    param(
        [string]$method,
        [string]$path,
        [object]$body = $null,
        [string]$token = ""
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }

    $bodyJson = $null
    if ($body -ne $null) {
        $bodyJson = $body | ConvertTo-Json -Compress
    }

    try {
        if ($bodyJson -ne $null) {
            $resp = Invoke-RestMethod -Uri "$baseUrl$path" -Method $method -Headers $headers -Body $bodyJson -TimeoutSec 15
        } else {
            $resp = Invoke-RestMethod -Uri "$baseUrl$path" -Method $method -Headers $headers -TimeoutSec 15
        }
        return @{ Success = $true; Data = $resp; StatusCode = 200 }
    } catch {
        $statusCode = 500
        $errBody = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $errBody = $reader.ReadToEnd()
                $reader.Close()
            }
        }
        return @{ Success = $false; StatusCode = $statusCode; Error = $errBody }
    }
}

$passed = 0
$failed = 0

function Assert-Test {
    param([string]$name, [bool]$condition, [string]$details = "")
    if ($condition) {
        Write-Host " [PASS] $name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host " [FAIL] $name - $details" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     ElectroSL Finance & Wallet Management Verification Suite   " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Pre-test setup: Ensure Jobs 3 and 4 have AgreedLabourAmount = 10000.00 and Status = 'InProgress'
& "d:\downloads\wapp\mysql\bin\mysql.exe" -u root ElectroSL_DB -e "UPDATE Jobs SET AgreedLabourAmount = 10000.00, AgreedLabourAmountSetAtUtc = NOW(), Status = 'InProgress' WHERE JobId IN (3, 4);"

# ------------------------------------------------------------------------------------------------
# TEST 1: Payment Method Validation (Rejection of Invalid / Missing Method)
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 1: Payment Method Validation ---" -ForegroundColor Yellow
$invalidRes = Invoke-Api -method "POST" -path "/api/payment/process" -body @{ JobId = 3; PaymentMethod = "crypto" } -token $custToken
Assert-Test -name "T1.1: Reject invalid payment method ('crypto')" -condition ($invalidRes.StatusCode -eq 400 -or $invalidRes.Success -eq $false) -details "Got: $($invalidRes.StatusCode) $($invalidRes.Error)"

# ------------------------------------------------------------------------------------------------
# TEST 2: Cash Payment Recording & Commission Debt Debit (Job 3)
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 2: Cash Payment & Commission Debt Debit (Job 3) ---" -ForegroundColor Yellow
$cashRes = Invoke-Api -method "POST" -path "/api/payment/process" -body @{ JobId = 3; PaymentMethod = "Cash" } -token $custToken
Assert-Test -name "T2.1: Process cash payment successfully" -condition ($cashRes.Success -eq $true) -details "$($cashRes.Error)"

if ($cashRes.Success) {
    $data = $cashRes.Data
    Assert-Test -name "T2.2: Cash payment GMV is 10,000.00" -condition ($data.grossJobValue -eq 10000.00) -details "GMV: $($data.grossJobValue)"
    Assert-Test -name "T2.3: Platform commission is 1,500.00 (15%)" -condition ($data.platformCommission -eq 1500.00) -details "Commission: $($data.platformCommission)"
    Assert-Test -name "T2.4: Electrician earnings is 8,500.00 (85%)" -condition ($data.electricianEarnings -eq 8500.00) -details "Earnings: $($data.electricianEarnings)"
    Assert-Test -name "T2.5: Customer paid online is 0.00" -condition ($data.customerPaidOnline -eq 0.00) -details "Paid Online: $($data.customerPaidOnline)"
    Assert-Test -name "T2.6: Customer direct cash is 10,000.00" -condition ($data.customerDirectCash -eq 10000.00) -details "Direct Cash: $($data.customerDirectCash)"
    Assert-Test -name "T2.7: Wallet balance debited to -1,500.00" -condition ($data.updatedWalletBalance -eq -1500.00) -details "Balance: $($data.updatedWalletBalance)"
}

# ------------------------------------------------------------------------------------------------
# TEST 3: Inspect Electrician Profile 4 State After Cash Job
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 3: Technician Wallet State Inspection ---" -ForegroundColor Yellow
$walletRes = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/4/wallet" -token $adminToken
Assert-Test -name "T3.1: Get technician wallet details" -condition ($walletRes.Success -eq $true) -details "$($walletRes.Error)"

if ($walletRes.Success) {
    $w = $walletRes.Data
    Assert-Test -name "T3.2: AppWalletBalance is -1,500.00" -condition ($w.currentWalletBalance -eq -1500.00) -details "Balance: $($w.currentWalletBalance)"
    Assert-Test -name "T3.3: OutstandingCommissionDebt is 1,500.00" -condition ($w.outstandingCommissionDebt -eq 1500.00) -details "Debt: $($w.outstandingCommissionDebt)"
    Assert-Test -name "T3.4: AvailablePayoutBalance is 0.00 (Zero-Debt Gate)" -condition ($w.availablePayoutBalance -eq 0.00) -details "Available: $($w.availablePayoutBalance)"
}

# ------------------------------------------------------------------------------------------------
# TEST 4: Payout Locked While Commission Debt Remains
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 4: Zero-Debt Gate Payout Blocking ---" -ForegroundColor Yellow
$payoutBlockedRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts" -body @{
    ElectricianProfileId = 4
    Amount = 1000.00
    BankName = "Commercial Bank"
    AccountNumberMasked = "****1234"
    BankTransferReference = "SLIPS-TEST-001"
    AdminNotes = "Test payout while in debt"
    ConfirmBankTransferCompleted = $true
} -token $adminToken

Assert-Test -name "T4.1: Payout rejected while commission debt active" -condition ($payoutBlockedRes.Data.success -eq $false -or $payoutBlockedRes.StatusCode -eq 400) -details "Message: $($payoutBlockedRes.Data.message)"

# ------------------------------------------------------------------------------------------------
# TEST 5: Manual Admin Adjustment & Commission Debt Protection
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 5: Manual Admin Credit & Debt Protection ---" -ForegroundColor Yellow
$adjRes = Invoke-Api -method "POST" -path "/api/admin/financial/technicians/4/adjust" -body @{
    Type = "Credit"
    Amount = 2000.00
    Reason = "Goodwill administrative compensation for platform issue"
    ExternalReferenceNumber = "ADJ-TEST-001"
} -token $adminToken

Assert-Test -name "T5.1: Admin credit applied successfully" -condition ($adjRes.Success -eq $true -and $adjRes.Data.success -eq $true) -details "$($adjRes.Data.message)"

$walletAfterAdj = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/4/wallet" -token $adminToken
if ($walletAfterAdj.Success) {
    $wAdj = $walletAfterAdj.Data
    Assert-Test -name "T5.2: Wallet balance becomes +500.00 (-1500 + 2000)" -condition ($wAdj.currentWalletBalance -eq 500.00) -details "Balance: $($wAdj.currentWalletBalance)"
    Assert-Test -name "T5.3: OutstandingCommissionDebt remains 1,500.00 (Untouched!)" -condition ($wAdj.outstandingCommissionDebt -eq 1500.00) -details "Debt: $($wAdj.outstandingCommissionDebt)"
    Assert-Test -name "T5.4: AvailablePayoutBalance remains 0.00 (Zero-Debt Gate protected!)" -condition ($wAdj.availablePayoutBalance -eq 0.00) -details "Available: $($wAdj.availablePayoutBalance)"
}

# ------------------------------------------------------------------------------------------------
# TEST 6: Digital Payment with Automatic Debt Recovery (Job 4)
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 6: Digital Payment & Automatic Debt Recovery (Job 4) ---" -ForegroundColor Yellow
$digitalRes = Invoke-Api -method "POST" -path "/api/payment/process" -body @{ JobId = 4; PaymentMethod = "FullDigital" } -token $custToken
Assert-Test -name "T6.1: Process digital payment successfully" -condition ($digitalRes.Success -eq $true) -details "$($digitalRes.Error)"

if ($digitalRes.Success) {
    $dData = $digitalRes.Data
    Assert-Test -name "T6.2: Digital payment GMV is 10,000.00" -condition ($dData.grossJobValue -eq 10000.00) -details "GMV: $($dData.grossJobValue)"
    Assert-Test -name "T6.3: Electrician earnings is 8,500.00" -condition ($dData.electricianEarnings -eq 8500.00) -details "Earnings: $($dData.electricianEarnings)"
    Assert-Test -name "T6.4: Customer paid online is 10,000.00" -condition ($dData.customerPaidOnline -eq 10000.00) -details "Paid Online: $($dData.customerPaidOnline)"
    Assert-Test -name "T6.5: Direct cash is 0.00" -condition ($dData.customerDirectCash -eq 0.00) -details "Direct Cash: $($dData.customerDirectCash)"
    Assert-Test -name "T6.6: Wallet balance credited to +9,000.00 (500 + 8500)" -condition ($dData.updatedWalletBalance -eq 9000.00) -details "Balance: $($dData.updatedWalletBalance)"
}

$walletAfterDigital = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/4/wallet" -token $adminToken
if ($walletAfterDigital.Success) {
    $wDig = $walletAfterDigital.Data
    Assert-Test -name "T6.7: OutstandingCommissionDebt recovered to 0.00" -condition ($wDig.outstandingCommissionDebt -eq 0.00) -details "Debt: $($wDig.outstandingCommissionDebt)"
    Assert-Test -name "T6.8: AvailablePayoutBalance unlocked to 9,000.00" -condition ($wDig.availablePayoutBalance -eq 9000.00) -details "Available: $($wDig.availablePayoutBalance)"
}

# ------------------------------------------------------------------------------------------------
# TEST 7: Minimum Payout Threshold Enforcement (LKR 1,000.00)
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 7: Minimum Payout Threshold Enforcement ---" -ForegroundColor Yellow
$belowMinRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts" -body @{
    ElectricianProfileId = 4
    Amount = 500.00
    BankName = "Bank of Ceylon"
    AccountNumberMasked = "****5678"
    BankTransferReference = "CEFT-LOW-001"
    AdminNotes = "Test payout below minimum threshold"
    ConfirmBankTransferCompleted = $true
} -token $adminToken

Assert-Test -name "T7.1: Reject payout below minimum threshold of LKR 1,000.00" -condition ($belowMinRes.Data.success -eq $false -or $belowMinRes.StatusCode -eq 400) -details "Message: $($belowMinRes.Data.message)"

# ------------------------------------------------------------------------------------------------
# TEST 8: Valid Bank Payout Recording
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 8: Valid Bank Payout Recording ---" -ForegroundColor Yellow
$validPayoutRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts" -body @{
    ElectricianProfileId = 4
    Amount = 5000.00
    BankName = "Commercial Bank of Ceylon"
    AccountNumberMasked = "****4321"
    BankTransferReference = "CEFT-20261122-0099"
    AdminNotes = "Confirmed SLIPS bank transfer to electrician account"
    ConfirmBankTransferCompleted = $true
} -token $adminToken

Assert-Test -name "T8.1: Record bank payout of LKR 5,000.00" -condition ($validPayoutRes.Success -eq $true -and $validPayoutRes.Data.success -eq $true) -details "$($validPayoutRes.Data.message)"

$payoutId = $validPayoutRes.Data.payoutId
$walletAfterPayout = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/4/wallet" -token $adminToken
if ($walletAfterPayout.Success) {
    $wPay = $walletAfterPayout.Data
    Assert-Test -name "T8.2: Wallet balance debited to 4,000.00 (9000 - 5000)" -condition ($wPay.currentWalletBalance -eq 4000.00) -details "Balance: $($wPay.currentWalletBalance)"
    Assert-Test -name "T8.3: Available payout balance is 4,000.00" -condition ($wPay.availablePayoutBalance -eq 4000.00) -details "Available: $($wPay.availablePayoutBalance)"
}

# ------------------------------------------------------------------------------------------------
# TEST 9: Payout Reversal & Idempotency
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 9: Payout Reversal & Idempotency ---" -ForegroundColor Yellow
$reversalRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts/$payoutId/reverse" -body @{
    ReversalReason = "Bank transfer failed: account branch mismatch notice received"
    BankNoticeReference = "BNK-REJ-2026"
} -token $adminToken

Assert-Test -name "T9.1: Reverse payout successfully" -condition ($reversalRes.Success -eq $true -and $reversalRes.Data.success -eq $true) -details "$($reversalRes.Data.message)"

$walletAfterReversal = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/4/wallet" -token $adminToken
if ($walletAfterReversal.Success) {
    $wRev = $walletAfterReversal.Data
    Assert-Test -name "T9.2: Wallet balance restored to 9,000.00" -condition ($wRev.currentWalletBalance -eq 9000.00) -details "Balance: $($wRev.currentWalletBalance)"
    Assert-Test -name "T9.3: Debt remains 0.00 after reversal" -condition ($wRev.outstandingCommissionDebt -eq 0.00) -details "Debt: $($wRev.outstandingCommissionDebt)"
}

# Duplicate reversal attempt
$dupRevRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts/$payoutId/reverse" -body @{
    ReversalReason = "Duplicate reversal attempt that must be blocked"
} -token $adminToken

Assert-Test -name "T9.4: Duplicate payout reversal strictly blocked" -condition ($dupRevRes.Success -eq $false -or $dupRevRes.Data.success -eq $false -or $dupRevRes.StatusCode -eq 400) -details "Status: $($dupRevRes.StatusCode), Error: $($dupRevRes.Error)"

# ------------------------------------------------------------------------------------------------
# TEST 10: Global Financial Summary & Invariant Reconciliation
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 10: Global Financial Reconciliation Invariants ---" -ForegroundColor Yellow
$summaryRes = Invoke-Api -method "GET" -path "/api/admin/financial/summary" -token $adminToken
Assert-Test -name "T10.1: Get global financial summary" -condition ($summaryRes.Success -eq $true) -details "$($summaryRes.Error)"

if ($summaryRes.Success) {
    $s = $summaryRes.Data
    $gmv = $s.totalGrossJobValue
    $online = $s.totalCollectedOnline
    $cash = $s.totalDirectCashToElectricians
    $comm = $s.totalPlatformCommission
    $earnings = $s.totalElectricianEarnings

    Assert-Test -name "T10.2: Invariant GMV = Online ($online) + Direct Cash ($cash) = $gmv" -condition ($gmv -eq ($online + $cash)) -details "Diff: $($gmv - ($online + $cash))"
    Assert-Test -name "T10.3: Invariant GMV = Commission ($comm) + Earnings ($earnings) = $gmv" -condition ($gmv -eq ($comm + $earnings)) -details "Diff: $($gmv - ($comm + $earnings))"
    Assert-Test -name "T10.4: Platform Commission is 15% of GMV" -condition ($comm -eq ($gmv * 0.15)) -details "Commission: $comm"
    Assert-Test -name "T10.5: Electrician Earnings is 85% of GMV" -condition ($earnings -eq ($gmv * 0.85)) -details "Earnings: $earnings"
}

# ------------------------------------------------------------------------------------------------
# TEST 11: Electrician Portal Wallet Endpoint Verification
# ------------------------------------------------------------------------------------------------
Write-Host "`n--- Test 11: Electrician Portal Wallet Endpoint ---" -ForegroundColor Yellow
$elecWalletRes = Invoke-Api -method "GET" -path "/api/ElectricianProfile/10/wallet" -token $elecToken
Assert-Test -name "T11.1: Electrician can fetch their own wallet" -condition ($elecWalletRes.Success -eq $true) -details "$($elecWalletRes.Error)"

if ($elecWalletRes.Success) {
    $ew = $elecWalletRes.Data
    Assert-Test -name "T11.2: Portal shows correct wallet balance (9,000.00)" -condition ($ew.currentWalletBalance -eq 9000.00) -details "Balance: $($ew.currentWalletBalance)"
    Assert-Test -name "T11.3: Portal shows 0.00 commission debt" -condition ($ew.outstandingCommissionDebt -eq 0.00) -details "Debt: $($ew.outstandingCommissionDebt)"
    Assert-Test -name "T11.4: Portal shows 9,000.00 available for payout" -condition ($ew.availablePayoutBalance -eq 9000.00) -details "Available: $($ew.availablePayoutBalance)"
    Assert-Test -name "T11.5: Payout is not locked" -condition ($ew.isPayoutLocked -eq $false) -details "Locked: $($ew.isPayoutLocked)"
    Assert-Test -name "T11.6: Transaction history contains auditable records" -condition ($ew.transactions.Count -ge 3) -details "Tx count: $($ew.transactions.Count)"
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "                SUMMARY: $passed PASSED, $failed FAILED                  " -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "================================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 } else { exit 0 }
