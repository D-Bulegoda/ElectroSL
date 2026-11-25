using System.Threading;
using System.Threading.Tasks;
using ElectroSL_Backend.DTOs.Payment;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IPaymentProcessingService
{
    Task<JobCheckoutSummaryDto> GetCheckoutSummaryAsync(
        int jobId,
        int customerUserId,
        CancellationToken cancellationToken = default);

    Task<CustomerPaymentResultDto> ProcessCustomerPaymentAsync(
        CustomerPaymentRequestDto request,
        int customerUserId,
        CancellationToken cancellationToken = default);
}

