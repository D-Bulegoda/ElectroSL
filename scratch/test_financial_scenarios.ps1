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
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($secret))
    $sig = [Convert]::ToBase64String($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($toSign))).TrimEnd('=').Replace('+','-').Replace('/','_')
    return "$toSign.$sig"
}

$adminToken = New-JwtToken -userId 1 -email "admin@electrosl.lk" -role "Admin" -secret $secret
$cust11Token = New-JwtToken -userId 11 -email "test.cust_8661@electrosl.lk" -role "Customer" -secret $secret
$cust14Token = New-JwtToken -userId 14 -email "test.cust_5082@electrosl.lk" -role "Customer" -secret $secret

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
                $reader = [System.IO.StreamReader]::new($stream)
                $errBody = $reader.ReadToEnd()
                $reader.Close()
            }
        }
        return @{ Success = $false; StatusCode = $statusCode; Error = $errBody }
    }
}

$passCount = 0
$failCount = 0

function Assert-Test {
    param([string]$name, [bool]$condition, [string]$details = "")
    if ($condition) {
        Write-Host " [PASS] $name" -ForegroundColor Green
        $script:passCount++
    } else {
        Write-Host " [FAIL] $name - $details" -ForegroundColor Red
        $script:failCount++
    }
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   ElectroSL Focused Financial & Wallet Architecture Verification     " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# ----------------------------------------------------------------------------------------------------
# 1. SCENARIO A: FullDigital Job on Clean Electrician (Electrician 12, Profile 6)
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 1. Scenario A: FullDigital Job (No Debt Created) ---" -ForegroundColor Yellow

# Ensure equipment claim #3 is approved and agreed labour is set
& "d:\downloads\wapp\mysql\bin\mysql.exe" -u root ElectroSL_DB -e "UPDATE JobUsedEquipments SET Status = 'AdminApproved', ReviewedAt = NOW(), ReviewedByAdminId = 1, AdminReviewNotes = 'Verified for Scenario A' WHERE Id = 3; UPDATE Jobs SET AgreedLabourAmount = 10000.00, AgreedLabourAmountSetAtUtc = NOW(), Status = 'InProgress' WHERE JobId = 7;"

$w6Before = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/6/wallet" -token $adminToken
Write-Host " Profile 6 Before: Balance = $($w6Before.Data.currentWalletBalance), Debt = $($w6Before.Data.outstandingCommissionDebt)" -ForegroundColor Gray

# Job 7: Labour 10,000 + Approved Equipment 23,000 = GMV 33,000.00
$resA = Invoke-Api -method "POST" -path "/api/MockPayment/process" -body @{ JobId = 7; PaymentMethod = "FullDigital" } -token $cust11Token
Assert-Test -name "A1: Process FullDigital payment for Job 7 succeeds" -condition ($resA.Success -eq $true) -details "$($resA.Error)"

$w6After = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/6/wallet" -token $adminToken
if ($w6After.Success) {
    $w6 = $w6After.Data
    Write-Host " Profile 6 After:  Balance = $($w6.currentWalletBalance), Debt = $($w6.outstandingCommissionDebt)" -ForegroundColor Gray
    Assert-Test -name "A2: Customer pays 100% online (33,000.00)" -condition ($resA.Data.customerPaidOnline -eq 33000.00) -details "Paid: $($resA.Data.customerPaidOnline)"
    Assert-Test -name "A3: Platform commission is 15% (4,950.00)" -condition ($resA.Data.platformCommission -eq 4950.00) -details "Comm: $($resA.Data.platformCommission)"
    Assert-Test -name "A4: Electrician receives 85% in wallet (+28,050.00)" -condition ($w6.currentWalletBalance -eq 28050.00) -details "Balance: $($w6.currentWalletBalance)"
    Assert-Test -name "A5: No commission debt created (Debt = 0.00)" -condition ($w6.outstandingCommissionDebt -eq 0.00) -details "Debt: $($w6.outstandingCommissionDebt)"
    Assert-Test -name "A6: Available payout unlocked to 28,050.00" -condition ($w6.availablePayoutBalance -eq 28050.00) -details "Available: $($w6.availablePayoutBalance)"
}

# ----------------------------------------------------------------------------------------------------
# 2. SCENARIO B: Cash Job (Commission Debt Created)
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 2. Scenario B: Cash Job (Commission Debt Created) ---" -ForegroundColor Yellow

# Test live Cash job on fresh Electrician 6 (Profile 2)
& "d:\downloads\wapp\mysql\bin\mysql.exe" -u root ElectroSL_DB -e "INSERT INTO Jobs (JobId, CustomerId, ElectricianId, JobType, Description, VoiceNoteUrl, LocationLat, LocationLng, Status, StartOTP, FinalApprovalOTP, CreatedAt, IsEmergency, ConcurrencyVersion, AgreedLabourAmount, AgreedLabourAmountSetAtUtc) VALUES (11, 14, 6, 'Repairs', 'Circuit breaker trip in master bedroom', '', 6.9271, 79.8612, 'InProgress', '1234', '5678', NOW(), 0, 1, 10000.00, NOW()) ON DUPLICATE KEY UPDATE Status = 'InProgress', AgreedLabourAmount = 10000.00;"

$w2Before = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/2/wallet" -token $adminToken
Write-Host " Profile 2 Before: Balance = $($w2Before.Data.currentWalletBalance), Debt = $($w2Before.Data.outstandingCommissionDebt)" -ForegroundColor Gray

# Job 11: Labour 10,000.00, Cash payment
$resB = Invoke-Api -method "POST" -path "/api/MockPayment/process" -body @{ JobId = 11; PaymentMethod = "Cash" } -token $cust14Token
Assert-Test -name "B1: Process Cash payment for Job 11 succeeds" -condition ($resB.Success -eq $true) -details "$($resB.Error)"

$w2AfterB = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/2/wallet" -token $adminToken
if ($w2AfterB.Success) {
    $w2 = $w2AfterB.Data
    Write-Host " Profile 2 After:  Balance = $($w2.currentWalletBalance), Debt = $($w2.outstandingCommissionDebt)" -ForegroundColor Gray
    Assert-Test -name "B2: Customer direct cash is 100% (10,000.00)" -condition ($resB.Data.customerDirectCash -eq 10000.00) -details "Cash: $($resB.Data.customerDirectCash)"
    Assert-Test -name "B3: Platform receives 0.00 online" -condition ($resB.Data.customerPaidOnline -eq 0.00) -details "Online: $($resB.Data.customerPaidOnline)"
    Assert-Test -name "B4: 15% commission becomes outstanding debt (+1,500.00)" -condition ($w2.outstandingCommissionDebt -eq 1500.00) -details "Debt: $($w2.outstandingCommissionDebt)"
    Assert-Test -name "B5: Wallet balance becomes negative (-1,500.00)" -condition ($w2.currentWalletBalance -eq -1500.00) -details "Balance: $($w2.currentWalletBalance)"
    Assert-Test -name "B6: Available payout locked at 0.00" -condition ($w2.availablePayoutBalance -eq 0.00) -details "Available: $($w2.availablePayoutBalance)"
    
    $txB = $w2.recentTransactions | Where-Object { $_.jobId -eq 11 } | Select-Object -First 1
    Assert-Test -name "B7: Ledger records TransactionType = CashJobCommissionDebit (7)" -condition ($txB.transactionType -eq 7) -details "Type: $($txB.transactionType)"
}

# Also verify existing Profile 8 baseline (Debt = 4,725.00, Balance = -4,725.00 from Job 8)
$w8Baseline = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/8/wallet" -token $adminToken
Write-Host " Profile 8 Baseline: Balance = $($w8Baseline.Data.currentWalletBalance), Debt = $($w8Baseline.Data.outstandingCommissionDebt)" -ForegroundColor Gray
Assert-Test -name "B8: Profile 8 has established debt of 4,725.00 from Job 8" -condition ($w8Baseline.Data.outstandingCommissionDebt -eq 4725.00) -details "Debt: $($w8Baseline.Data.outstandingCommissionDebt)"

# ----------------------------------------------------------------------------------------------------
# 3. SCENARIO D: Partial Debt Recovery (Earning < Debt)
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 3. Scenario D: Partial Debt Recovery (Earning < Debt) ---" -ForegroundColor Yellow

# Create Job 9 for Customer 14 and Electrician 15 with AgreedLabourAmount = 1000.00 (earnings = 850.00 < 4725.00 debt)
& "d:\downloads\wapp\mysql\bin\mysql.exe" -u root ElectroSL_DB -e "INSERT INTO Jobs (JobId, CustomerId, ElectricianId, JobType, Description, VoiceNoteUrl, LocationLat, LocationLng, Status, StartOTP, FinalApprovalOTP, CreatedAt, IsEmergency, ConcurrencyVersion, AgreedLabourAmount, AgreedLabourAmountSetAtUtc) VALUES (9, 14, 15, 'Maintenance', 'Small Wiring Inspection', '', 6.9271, 79.8612, 'InProgress', '1234', '5678', NOW(), 0, 1, 1000.00, NOW()) ON DUPLICATE KEY UPDATE Status = 'InProgress', AgreedLabourAmount = 1000.00;"

$resD = Invoke-Api -method "POST" -path "/api/MockPayment/process" -body @{ JobId = 9; PaymentMethod = "FullDigital" } -token $cust14Token
Assert-Test -name "D1: Process digital payment for Job 9 succeeds" -condition ($resD.Success -eq $true) -details "$($resD.Error)"

$w8AfterD = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/8/wallet" -token $adminToken
if ($w8AfterD.Success) {
    $w8d = $w8AfterD.Data
    Write-Host " Profile 8 After D: Balance = $($w8d.currentWalletBalance), Debt = $($w8d.outstandingCommissionDebt)" -ForegroundColor Gray
    Assert-Test -name "D2: Full 85% earning (+850.00) credited to wallet (-4725 + 850 = -3,875.00)" -condition ($w8d.currentWalletBalance -eq -3875.00) -details "Balance: $($w8d.currentWalletBalance)"
    Assert-Test -name "D3: Remaining commission debt retained at 3,875.00 (4725 - 850)" -condition ($w8d.outstandingCommissionDebt -eq 3875.00) -details "Debt: $($w8d.outstandingCommissionDebt)"
    Assert-Test -name "D4: Payout remains strictly blocked at 0.00 while debt remains" -condition ($w8d.availablePayoutBalance -eq 0.00) -details "Available: $($w8d.availablePayoutBalance)"
    
    # Verify auditable ledger record
    $txD = $w8d.recentTransactions | Where-Object { $_.jobId -eq 9 } | Select-Object -First 1
    Assert-Test -name "D5: Ledger records CommissionDebtRecovered = 850.00" -condition ($txD.commissionDebtRecovered -eq 850.00) -details "Recovered: $($txD.commissionDebtRecovered)"
    Assert-Test -name "D6: Ledger records CommissionDebtBefore = 4725.00, DebtAfter = 3875.00" -condition ($txD.commissionDebtBefore -eq 4725.00 -and $txD.commissionDebtAfter -eq 3875.00) -details "Before: $($txD.commissionDebtBefore), After: $($txD.commissionDebtAfter)"
}

# ----------------------------------------------------------------------------------------------------
# 4. SCENARIO C & E: Full Debt Recovery & Payout Unlocked (Earning >= Debt)
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 4. Scenario C & E: Full Debt Recovery & Payout Unlocked ---" -ForegroundColor Yellow

# Create Job 10 for Customer 14 and Electrician 15 with AgreedLabourAmount = 6000.00 (earnings = 5100.00 >= 3875.00 debt)
& "d:\downloads\wapp\mysql\bin\mysql.exe" -u root ElectroSL_DB -e "INSERT INTO Jobs (JobId, CustomerId, ElectricianId, JobType, Description, VoiceNoteUrl, LocationLat, LocationLng, Status, StartOTP, FinalApprovalOTP, CreatedAt, IsEmergency, ConcurrencyVersion, AgreedLabourAmount, AgreedLabourAmountSetAtUtc) VALUES (10, 14, 15, 'Installation', 'Sub-panel Replacement', '', 6.9271, 79.8612, 'InProgress', '1234', '5678', NOW(), 0, 1, 6000.00, NOW()) ON DUPLICATE KEY UPDATE Status = 'InProgress', AgreedLabourAmount = 6000.00;"

$resE = Invoke-Api -method "POST" -path "/api/MockPayment/process" -body @{ JobId = 10; PaymentMethod = "FullDigital" } -token $cust14Token
Assert-Test -name "E1: Process digital payment for Job 10 succeeds" -condition ($resE.Success -eq $true) -details "$($resE.Error)"

$w8AfterE = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/8/wallet" -token $adminToken
if ($w8AfterE.Success) {
    $w8e = $w8AfterE.Data
    Write-Host " Profile 8 After E: Balance = $($w8e.currentWalletBalance), Debt = $($w8e.outstandingCommissionDebt)" -ForegroundColor Gray
    Assert-Test -name "E2: Wallet receives full 85% credit (+5,100.00) -> balance becomes +1,225.00 (-3875 + 5100)" -condition ($w8e.currentWalletBalance -eq 1225.00) -details "Balance: $($w8e.currentWalletBalance)"
    Assert-Test -name "E3: Outstanding commission debt fully recovered to 0.00" -condition ($w8e.outstandingCommissionDebt -eq 0.00) -details "Debt: $($w8e.outstandingCommissionDebt)"
    Assert-Test -name "E4: Positive balance becomes eligible for payout (1,225.00)" -condition ($w8e.availablePayoutBalance -eq 1225.00) -details "Available: $($w8e.availablePayoutBalance)"
    
    # Verify auditable ledger record
    $txE = $w8e.recentTransactions | Where-Object { $_.jobId -eq 10 } | Select-Object -First 1
    Assert-Test -name "E5: Ledger records CommissionDebtRecovered = 3875.00" -condition ($txE.commissionDebtRecovered -eq 3875.00) -details "Recovered: $($txE.commissionDebtRecovered)"
    Assert-Test -name "E6: Ledger records CommissionDebtBefore = 3875.00, DebtAfter = 0.00" -condition ($txE.commissionDebtBefore -eq 3875.00 -and $txE.commissionDebtAfter -eq 0.00) -details "Before: $($txE.commissionDebtBefore), After: $($txE.commissionDebtAfter)"
}

# ----------------------------------------------------------------------------------------------------
# 5. PAYOUT SAFETY & REVERSAL TESTS
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 5. Payout Safety & Reversal Validation ---" -ForegroundColor Yellow

# Test 5.1: Payout exceeding available balance
$overPayoutRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts" -body @{
    ElectricianProfileId = 8
    Amount = 2000.00
    BankName = "Commercial Bank"
    AccountNumberMasked = "****7766"
    BankTransferReference = "SLIPS-OVER-001"
    AdminNotes = "Payout exceeding available balance"
    ConfirmBankTransferCompleted = $true
} -token $adminToken
Assert-Test -name "P1: Payout exceeding available balance (2,000 > 1,225) rejected" -condition ($overPayoutRes.Success -eq $false -or $overPayoutRes.Data.success -eq $false -or $overPayoutRes.StatusCode -eq 400) -details "Status: $($overPayoutRes.StatusCode)"

# Test 5.2: Payout below minimum threshold
$underPayoutRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts" -body @{
    ElectricianProfileId = 8
    Amount = 500.00
    BankName = "Commercial Bank"
    AccountNumberMasked = "****7766"
    BankTransferReference = "SLIPS-UNDER-001"
    AdminNotes = "Payout below 1,000 min threshold"
    ConfirmBankTransferCompleted = $true
} -token $adminToken
Assert-Test -name "P2: Payout below minimum threshold (500 < 1,000) rejected" -condition ($underPayoutRes.Success -eq $false -or $underPayoutRes.Data.success -eq $false -or $underPayoutRes.StatusCode -eq 400) -details "Status: $($underPayoutRes.StatusCode)"

# Test 5.3: Payout without confirmation
$noConfirmRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts" -body @{
    ElectricianProfileId = 8
    Amount = 1000.00
    BankName = "Commercial Bank"
    AccountNumberMasked = "****7766"
    BankTransferReference = "SLIPS-NOCONFIRM"
    AdminNotes = "Missing confirmation test"
    ConfirmBankTransferCompleted = $false
} -token $adminToken
Assert-Test -name "P3: Payout without ConfirmBankTransferCompleted rejected" -condition ($noConfirmRes.Success -eq $false -or $noConfirmRes.Data.success -eq $false -or $noConfirmRes.StatusCode -eq 400) -details "Status: $($noConfirmRes.StatusCode)"

# Test 5.4: Valid bank payout recording
$validPayoutRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts" -body @{
    ElectricianProfileId = 8
    Amount = 1000.00
    BankName = "Commercial Bank of Ceylon"
    AccountNumberMasked = "****7766"
    BankTransferReference = "SLIPS-VALID-2026-001"
    AdminNotes = "Approved SLIPS bank payout disbursement"
    ConfirmBankTransferCompleted = $true
} -token $adminToken
Assert-Test -name "P4: Valid payout of LKR 1,000.00 recorded successfully" -condition ($validPayoutRes.Success -eq $true -and $validPayoutRes.Data.success -eq $true) -details "$($validPayoutRes.Data.message)"

$payoutId = $validPayoutRes.Data.payoutId
$w8AfterPayout = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/8/wallet" -token $adminToken
if ($w8AfterPayout.Success) {
    Assert-Test -name "P5: Wallet balance debited to 225.00 (1225 - 1000)" -condition ($w8AfterPayout.Data.currentWalletBalance -eq 225.00) -details "Balance: $($w8AfterPayout.Data.currentWalletBalance)"
    Assert-Test -name "P6: Commission debt remains 0.00 after payout" -condition ($w8AfterPayout.Data.outstandingCommissionDebt -eq 0.00) -details "Debt: $($w8AfterPayout.Data.outstandingCommissionDebt)"
}

# Test 5.5: Payout Reversal
$reversalRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts/$payoutId/reverse" -body @{
    ReversalReason = "SLIPS bank transfer bounced due to dormant technician account"
    BankNoticeReference = "BNK-REJ-7788"
} -token $adminToken
Assert-Test -name "P7: Payout reversal executed successfully" -condition ($reversalRes.Success -eq $true -and $reversalRes.Data.success -eq $true) -details "$($reversalRes.Data.message)"

$w8AfterReversal = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/8/wallet" -token $adminToken
if ($w8AfterReversal.Success) {
    Assert-Test -name "P8: Wallet balance restored to 1,225.00" -condition ($w8AfterReversal.Data.currentWalletBalance -eq 1225.00) -details "Balance: $($w8AfterReversal.Data.currentWalletBalance)"
    Assert-Test -name "P9: Commission debt untouched by reversal (remains 0.00)" -condition ($w8AfterReversal.Data.outstandingCommissionDebt -eq 0.00) -details "Debt: $($w8AfterReversal.Data.outstandingCommissionDebt)"
}

# Test 5.6: Duplicate Payout Reversal Blocked
$dupRevRes = Invoke-Api -method "POST" -path "/api/admin/financial/payouts/$payoutId/reverse" -body @{
    ReversalReason = "Duplicate reversal attempt that must be rejected"
} -token $adminToken
Assert-Test -name "P10: Duplicate reversal of Payout #$payoutId strictly rejected" -condition ($dupRevRes.Success -eq $false -or $dupRevRes.Data.success -eq $false -or $dupRevRes.StatusCode -eq 400) -details "Status: $($dupRevRes.StatusCode)"

# ----------------------------------------------------------------------------------------------------
# 6. HISTORICAL CASHSPLIT COMPATIBILITY & REJECTION OF INVALID METHODS
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 6. Historical CashSplit Compatibility & Validation ---" -ForegroundColor Yellow

# Reject missing or invalid payment method
$invalidMethodRes = Invoke-Api -method "POST" -path "/api/MockPayment/process" -body @{ JobId = 11; PaymentMethod = "CryptoCurrency" } -token $cust14Token
Assert-Test -name "H1: Invalid payment method ('CryptoCurrency') rejected with 400" -condition ($invalidMethodRes.StatusCode -eq 400) -details "Status: $($invalidMethodRes.StatusCode)"

# Verify Financial Summary calculates accurately
$summaryRes = Invoke-Api -method "GET" -path "/api/admin/financial/summary" -token $adminToken
if ($summaryRes.Success) {
    $s = $summaryRes.Data
    $gmv = $s.totalGrossJobValue
    $online = $s.totalCollectedOnline
    $cash = $s.totalDirectCashToElectricians
    $comm = $s.totalPlatformCommission
    $earnings = $s.totalElectricianEarnings

    Assert-Test -name "H2: Summary Invariant GMV = Online ($online) + Direct Cash ($cash) = $gmv" -condition ($gmv -eq ($online + $cash)) -details "Diff: $($gmv - ($online + $cash))"
    Assert-Test -name "H3: Summary Invariant GMV = Commission ($comm) + Earnings ($earnings) = $gmv" -condition ($gmv -eq ($comm + $earnings)) -details "Diff: $($gmv - ($comm + $earnings))"
    Assert-Test -name "H4: Platform commission is exactly 15% across all payment methods" -condition ($comm -eq ($gmv * 0.15)) -details "Comm: $comm, GMV: $gmv"
    Assert-Test -name "H5: Electrician earnings is exactly 85% across all payment methods" -condition ($earnings -eq ($gmv * 0.85)) -details "Earnings: $earnings, GMV: $gmv"
}

# ----------------------------------------------------------------------------------------------------
# 7. RECONCILIATION INVARIANTS ACROSS IMMUTABLE LEDGER
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 7. Ledger Progression & Reconciliation Integrity ---" -ForegroundColor Yellow
$txListRes = Invoke-Api -method "GET" -path "/api/admin/financial/transactions?pageSize=100" -token $adminToken
if ($txListRes.Success) {
    $allTx = $txListRes.Data.items
    $mathViolations = 0
    foreach ($tx in $allTx) {
        $expectedAfter = [Math]::Round($tx.balanceBefore + $tx.amount, 2)
        $actualAfter = [Math]::Round($tx.balanceAfter, 2)
        if ($expectedAfter -ne $actualAfter) {
            $mathViolations++
            Write-Host " Violation on Tx #$($tx.transactionId): Before $($tx.balanceBefore) + Amount $($tx.amount) != After $($tx.balanceAfter)" -ForegroundColor Red
        }
    }
    Assert-Test -name "R1: Every ledger entry satisfies BalanceAfter = BalanceBefore + Amount" -condition ($mathViolations -eq 0) -details "Violations: $mathViolations"
    Assert-Test -name "R2: Ledger contains at least 7 verified mutations" -condition ($allTx.Count -ge 7) -details "Count: $($allTx.Count)"
}

# Electrician 15 wallet verification: sum of ledger amounts == AppWalletBalance
$w8Final = Invoke-Api -method "GET" -path "/api/admin/financial/technicians/8/wallet" -token $adminToken
if ($w8Final.Success) {
    $txs8 = $w8Final.Data.recentTransactions
    $sumAmount8 = 0
    foreach ($t in $txs8) { $sumAmount8 += $t.amount }
    $sumAmount8 = [Math]::Round($sumAmount8, 2)
    Assert-Test -name "R3: Profile 8 wallet balance ($($w8Final.Data.currentWalletBalance)) == sum of signed ledger amounts ($sumAmount8)" -condition ($w8Final.Data.currentWalletBalance -eq $sumAmount8) -details "Balance: $($w8Final.Data.currentWalletBalance), Sum: $sumAmount8"
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "    FOCUSED VERIFICATION SUMMARY: $passCount PASSED, $failCount FAILED " -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "======================================================================" -ForegroundColor Cyan

if ($failCount -gt 0) { exit 1 } else { exit 0 }
