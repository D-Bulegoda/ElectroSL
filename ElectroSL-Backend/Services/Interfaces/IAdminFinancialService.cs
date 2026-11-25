using System.Threading;
using System.Threading.Tasks;
using ElectroSL_Backend.DTOs.Admin;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IAdminFinancialService
{
    /// <summary>
    /// Computes platform-wide financial summary distinguishing GMV, online collected revenue, and direct cash.
    /// </summary>
    Task<AdminFinancialSummaryDto> GetFinancialSummaryAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns paginated transactions from the immutable financial ledger with filtering.
    /// </summary>
    Task<PaginatedFinancialResponse<AdminWalletTransactionDto>> GetTransactionsAsync(
        FinancialLedgerFilterDto filter, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns detailed wallet balance, lifetime financial metrics, and transaction history for an electrician.
    /// </summary>
    Task<TechnicianWalletDetailDto?> GetTechnicianWalletAsync(
        int profileId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Atomically records an externally confirmed bank transfer payout, decrements the technician's wallet balance,
    /// and logs a PayoutDisbursed transaction to the immutable ledger using MariaDB row locking.
    /// </summary>
    Task<PayoutActionResultDto> RecordPayoutAsync(
        RecordPayoutRequestDto dto, 
        int adminUserId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Reverses a bounced or failed bank payout by creating a compensating PayoutReversal ledger credit,
    /// restoring the technician's wallet balance atomically without altering the original payout record.
    /// </summary>
    Task<PayoutActionResultDto> ReversePayoutAsync(
        int payoutId, 
        ReversePayoutRequestDto dto, 
        int adminUserId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Atomically credits or debits an electrician's wallet balance with strict balance non-negativity checks,
    /// row-level locking, and immutable audit logging.
    /// </summary>
    Task<AdjustmentActionResultDto> AdjustWalletAsync(
        int profileId, 
        WalletAdjustmentRequestDto dto, 
        int adminUserId, 
        CancellationToken cancellationToken = default);
}

