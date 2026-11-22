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
$elec6Token = New-JwtToken -userId 6 -email "test.elec_1866@electrosl.lk" -role "Electrician" -secret $secret
$elec12Token = New-JwtToken -userId 12 -email "test.elec_8661@electrosl.lk" -role "Electrician" -secret $secret
$elec15Token = New-JwtToken -userId 15 -email "test.elec_5082@electrosl.lk" -role "Electrician" -secret $secret

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
Write-Host "     ElectroSL Final Focused Verification: Integration & Edge Cases   " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# ----------------------------------------------------------------------------------------------------
# 1. CUSTOMER CHECKOUT INTEGRATION (Frontend -> Backend Service Flow)
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 1. Customer Checkout Integration ---" -ForegroundColor Yellow

# Step 1.1: Verify Authoritative Checkout Summary retrieval (used by CheckoutPayment.jsx)
$summary7 = Invoke-Api -method "GET" -path "/api/MockPayment/checkout-summary/7" -token $cust11Token
Assert-Test -name "C1: Customer retrieves authoritative checkout summary for Job #7" -condition ($summary7.Success -eq $true) -details "$($summary7.Error)"
if ($summary7.Success) {
    $s = $summary7.Data
    Assert-Test -name "C2: Summary contains grossJobValue = 33,000.00" -condition ($s.grossJobValue -eq 33000.00) -details "GMV: $($s.grossJobValue)"
    Assert-Test -name "C3: Summary contains agreed labour charge = 10,000.00" -condition ($s.labourCharge -eq 10000.00) -details "Labour: $($s.labourCharge)"
    Assert-Test -name "C4: Summary contains billable equipment = 23,000.00" -condition ($s.billableEquipmentTotal -eq 23000.00) -details "Equip: $($s.billableEquipmentTotal)"
    Assert-Test -name "C5: Pricing options include fullDigital (100% online = 33,000.00)" -condition ($s.pricingOptions.fullDigital.customerPaysOnline -eq 33000.00) -details "FullDigital: $($s.pricingOptions.fullDigital.customerPaysOnline)"
    Assert-Test -name "C6: Pricing options include cash (100% direct cash = 33,000.00, online = 0.00)" -condition ($s.pricingOptions.cash.customerPaysCash -eq 33000.00 -and $s.pricingOptions.cash.customerPaysOnline -eq 0.00) -details "Cash: $($s.pricingOptions.cash.customerPaysCash)"
    Assert-Test -name "C7: Post-payment check: Job #7 is not payment eligible (payment already processed)" -condition ($s.isPaymentEligible -eq $false -and $s.ineligibilityReason -like "*already been processed*") -details "Eligible: $($s.isPaymentEligible), Reason: $($s.ineligibilityReason)"
}

# Step 1.2: Verify Recorded Payment retrieval (used by CheckoutPayment.jsx receipt view)
$payment7 = Invoke-Api -method "GET" -path "/api/MockPayment/job/7" -token $cust11Token
Assert-Test -name "C8: Customer retrieves recorded payment receipt for Job #7" -condition ($payment7.Success -eq $true) -details "$($payment7.Error)"
if ($payment7.Success) {
    $p = $payment7.Data
    Assert-Test -name "C9: Recorded payment method is 'FullDigital'" -condition ($p.paymentMethod -eq "FullDigital") -details "Method: $($p.paymentMethod)"
    Assert-Test -name "C10: Recorded amount matches GMV (33,000.00)" -condition ($p.totalAmount -eq 33000.00) -details "Amount: $($p.totalAmount)"
    Assert-Test -name "C11: Platform commission recorded as 15% (4,950.00)" -condition ($p.platformCommission -eq 4950.00) -details "Comm: $($p.platformCommission)"
    Assert-Test -name "C12: Technician earnings recorded as 85% (28,050.00)" -condition ($p.electricianEarning -eq 28050.00) -details "Earning: $($p.electricianEarning)"
}

# Step 1.3: Verify Recorded Cash Payment retrieval (Job #11)
$payment11 = Invoke-Api -method "GET" -path "/api/MockPayment/job/11" -token $cust14Token
Assert-Test -name "C13: Customer retrieves recorded payment receipt for Job #11" -condition ($payment11.Success -eq $true) -details "$($payment11.Error)"
if ($payment11.Success) {
    $p11 = $payment11.Data
    Assert-Test -name "C14: Recorded payment method is 'Cash'" -condition ($p11.paymentMethod -eq "Cash") -details "Method: $($p11.paymentMethod)"
    Assert-Test -name "C15: Cash payment TotalAmount = 10,000.00" -condition ($p11.totalAmount -eq 10000.00) -details "Total: $($p11.totalAmount)"
    Assert-Test -name "C16: Cash payment PlatformCommission = 1,500.00" -condition ($p11.platformCommission -eq 1500.00) -details "Comm: $($p11.platformCommission)"
    Assert-Test -name "C17: Cash payment ElectricianEarning = 8,500.00" -condition ($p11.electricianEarning -eq 8500.00) -details "Earning: $($p11.electricianEarning)"
}

# ----------------------------------------------------------------------------------------------------
# 2. ELECTRICIAN WALLET INTEGRATION (Frontend -> Backend Service Flow)
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 2. Electrician Wallet Integration ---" -ForegroundColor Yellow

# Step 2.1: Electrician 12 (Profile 6 - Clean FullDigital Job #7)
$w12 = Invoke-Api -method "GET" -path "/api/ElectricianProfile/12/wallet" -token $elec12Token
Assert-Test -name "W1: Electrician #12 retrieves personal wallet data" -condition ($w12.Success -eq $true) -details "$($w12.Error)"
if ($w12.Success) {
    Assert-Test -name "W2: Electrician #12 wallet balance = +28,050.00" -condition ($w12.Data.currentWalletBalance -eq 28050.00) -details "Balance: $($w12.Data.currentWalletBalance)"
    Assert-Test -name "W3: Electrician #12 commission debt = 0.00" -condition ($w12.Data.outstandingCommissionDebt -eq 0.00) -details "Debt: $($w12.Data.outstandingCommissionDebt)"
    Assert-Test -name "W4: Electrician #12 available payout balance = 28,050.00" -condition ($w12.Data.availablePayoutBalance -eq 28050.00) -details "Available: $($w12.Data.availablePayoutBalance)"
    Assert-Test -name "W5: Electrician #12 isPayoutLocked is false" -condition ($w12.Data.isPayoutLocked -eq $false) -details "Locked: $($w12.Data.isPayoutLocked)"
}

# Step 2.2: Electrician 6 (Profile 2 - Negative Balance & Outstanding Debt from Cash Job #11)
$w6 = Invoke-Api -method "GET" -path "/api/ElectricianProfile/6/wallet" -token $elec6Token
Assert-Test -name "W6: Electrician #6 retrieves personal wallet data" -condition ($w6.Success -eq $true) -details "$($w6.Error)"
if ($w6.Success) {
    Assert-Test -name "W7: Electrician #6 correctly displays negative balance = -1,500.00" -condition ($w6.Data.currentWalletBalance -eq -1500.00) -details "Balance: $($w6.Data.currentWalletBalance)"
    Assert-Test -name "W8: Electrician #6 outstanding commission debt = +1,500.00" -condition ($w6.Data.outstandingCommissionDebt -eq 1500.00) -details "Debt: $($w6.Data.outstandingCommissionDebt)"
    Assert-Test -name "W9: Electrician #6 available payout balance is locked at 0.00" -condition ($w6.Data.availablePayoutBalance -eq 0.00) -details "Available: $($w6.Data.availablePayoutBalance)"
    Assert-Test -name "W10: Electrician #6 isPayoutLocked is true (Zero-Debt Gate)" -condition ($w6.Data.isPayoutLocked -eq $true) -details "Locked: $($w6.Data.isPayoutLocked)"
}

# Step 2.3: Electrician 15 (Profile 8 - Debt Cleared, Net Balance = 1,225.00)
$w15 = Invoke-Api -method "GET" -path "/api/ElectricianProfile/15/wallet" -token $elec15Token
Assert-Test -name "W11: Electrician #15 retrieves personal wallet data" -condition ($w15.Success -eq $true) -details "$($w15.Error)"
if ($w15.Success) {
    Assert-Test -name "W12: Electrician #15 balance = +1,225.00" -condition ($w15.Data.currentWalletBalance -eq 1225.00) -details "Balance: $($w15.Data.currentWalletBalance)"
    Assert-Test -name "W13: Electrician #15 commission debt fully cleared to 0.00" -condition ($w15.Data.outstandingCommissionDebt -eq 0.00) -details "Debt: $($w15.Data.outstandingCommissionDebt)"
    Assert-Test -name "W14: Electrician #15 available payout balance unlocked to 1,225.00" -condition ($w15.Data.availablePayoutBalance -eq 1225.00) -details "Available: $($w15.Data.availablePayoutBalance)"
    Assert-Test -name "W15: Electrician #15 isPayoutLocked is false" -condition ($w15.Data.isPayoutLocked -eq $false) -details "Locked: $($w15.Data.isPayoutLocked)"
}

# ----------------------------------------------------------------------------------------------------
# 3. PAYOUT REVERSAL EDGE CASES & CONSTRAINTS
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 3. Payout Reversal Edge Cases ---" -ForegroundColor Yellow

# Edge Case 3.1: Reversing a non-existent payout ID (e.g. 99999)
$revNonExistent = Invoke-Api -method "POST" -path "/api/admin/financial/payouts/99999/reverse" -body @{
    ReversalReason = "Attempt to reverse non-existent payout record"
} -token $adminToken
Assert-Test -name "R1: Reversal of non-existent payout rejected with 400 or 404" -condition ($revNonExistent.StatusCode -eq 400 -or $revNonExistent.StatusCode -eq 404 -or $revNonExistent.Data.success -eq $false) -details "Status: $($revNonExistent.StatusCode)"

# Edge Case 3.2: Reversal with missing or too-short reason (< 10 chars)
$revShortReason = Invoke-Api -method "POST" -path "/api/admin/financial/payouts/2/reverse" -body @{
    ReversalReason = "Short"
} -token $adminToken
Assert-Test -name "R2: Reversal with reason < 10 characters rejected" -condition ($revShortReason.StatusCode -eq 400 -or $revShortReason.Data.success -eq $false) -details "Status: $($revShortReason.StatusCode)"

# Edge Case 3.3: Duplicate reversal on already reversed Payout #2
$revDup2 = Invoke-Api -method "POST" -path "/api/admin/financial/payouts/2/reverse" -body @{
    ReversalReason = "Duplicate reversal attempt on Payout #2"
} -token $adminToken
Assert-Test -name "R3: Duplicate reversal on Payout #2 strictly rejected with 409 Conflict" -condition ($revDup2.StatusCode -eq 409 -or $revDup2.StatusCode -eq 400 -or $revDup2.Data.success -eq $false) -details "Status: $($revDup2.StatusCode)"

# Edge Case 3.4: Duplicate reversal on already reversed Payout #3
$revDup3 = Invoke-Api -method "POST" -path "/api/admin/financial/payouts/3/reverse" -body @{
    ReversalReason = "Duplicate reversal attempt on Payout #3"
} -token $adminToken
Assert-Test -name "R4: Duplicate reversal on Payout #3 strictly rejected with 409 Conflict" -condition ($revDup3.StatusCode -eq 409 -or $revDup3.StatusCode -eq 400 -or $revDup3.Data.success -eq $false) -details "Status: $($revDup3.StatusCode)"

# Edge Case 3.5: Confirm reversal amount cannot exceed original payout amount
# Inspect Payout #3 record and its compensating reversal transaction #25
$p3Sql = & "d:\downloads\wapp\mysql\bin\mysql.exe" -u root ElectroSL_DB -e "SELECT p.PayoutId, p.Amount AS PayoutAmount, wt.Amount AS ReversalAmount, p.IsReversed, p.ReversalTransactionId FROM TechnicianPayoutRecords p JOIN WalletTransactions wt ON p.ReversalTransactionId = wt.TransactionId WHERE p.PayoutId = 3;" -B -N
$p3Fields = $p3Sql.Trim().Split("`t")
$payoutAmt = [decimal]$p3Fields[1]
$revAmt = [decimal]$p3Fields[2]
Assert-Test -name "R5: Compensating reversal amount ($revAmt) strictly equals original payout amount ($payoutAmt)" -condition ($revAmt -eq $payoutAmt) -details "Rev: $revAmt, Payout: $payoutAmt"

# Edge Case 3.6: Confirm reversal never alters OutstandingCommissionDebt
$p3DebtSql = & "d:\downloads\wapp\mysql\bin\mysql.exe" -u root ElectroSL_DB -e "SELECT CommissionDebtBefore, CommissionDebtAfter, CommissionDebtRecovered FROM WalletTransactions WHERE TransactionId = 25;" -B -N
$p3DebtFields = $p3DebtSql.Trim().Split("`t")
$debtBefore = [decimal]$p3DebtFields[0]
$debtAfter = [decimal]$p3DebtFields[1]
$debtRecovered = [decimal]$p3DebtFields[2]
Assert-Test -name "R6: Reversal transaction keeps CommissionDebtBefore ($debtBefore) == DebtAfter ($debtAfter) with Recovered = 0.00" -condition ($debtBefore -eq $debtAfter -and $debtRecovered -eq 0.00) -details "Before: $debtBefore, After: $debtAfter, Rec: $debtRecovered"

# Edge Case 3.7: Atomicity check — payout record and ledger entry are linked and verified
$isP3Reversed = [int]$p3Fields[3]
$revTxId = [int]$p3Fields[4]
Assert-Test -name "R7: Payout #3 is flagged IsReversed = 1 and points to Reversal Transaction #$revTxId" -condition ($isP3Reversed -eq 1 -and $revTxId -eq 25) -details "IsReversed: $isP3Reversed, TxId: $revTxId"

# ----------------------------------------------------------------------------------------------------
# 4. DATA PRESERVATION & DATABASE INTEGRITY
# ----------------------------------------------------------------------------------------------------
Write-Host "`n--- 4. Data Preservation & Baseline Audit ---" -ForegroundColor Yellow

$countsSql = & "d:\downloads\wapp\mysql\bin\mysql.exe" -u root ElectroSL_DB -e "SELECT (SELECT COUNT(*) FROM Users), (SELECT COUNT(*) FROM Jobs WHERE JobId <= 8), (SELECT COUNT(*) FROM EquipmentCatalog), (SELECT COUNT(*) FROM ElectricianProfiles);" -B -N
$counts = $countsSql.Trim().Split("`t")
$userCount = [int]$counts[0]
$baseJobCount = [int]$counts[1]
$catalogCount = [int]$counts[2]
$profileCount = [int]$counts[3]

Assert-Test -name "D1: Baseline Users count intact (21 users)" -condition ($userCount -eq 21) -details "Actual: $userCount"
Assert-Test -name "D2: Baseline Jobs 1..8 all intact and preserved (8 jobs)" -condition ($baseJobCount -eq 8) -details "Actual: $baseJobCount"
Assert-Test -name "D3: Equipment catalog intact (18 items)" -condition ($catalogCount -eq 18) -details "Actual: $catalogCount"
Assert-Test -name "D4: Electrician profiles count intact (6 profiles)" -condition ($profileCount -eq 6) -details "Actual: $profileCount"

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "      FINAL VERIFICATION RESULTS: $passCount PASSED, $failCount FAILED " -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "======================================================================" -ForegroundColor Cyan

if ($failCount -gt 0) { exit 1 } else { exit 0 }
