import { fetchWithAuth } from './api';

/**
 * Fetches the authoritative, server-calculated checkout summary for a job.
 * Requires Customer authentication and job ownership.
 *
 * @param {number|string} jobId
 * @returns {Promise<Object>} JobCheckoutSummaryDto
 */
export const getCheckoutSummary = async (jobId) => {
  return fetchWithAuth(`/MockPayment/checkout-summary/${jobId}`);
};

/**
 * Submits an authenticated payment request to the backend.
 * The backend calculates all monetary amounts independently from trusted DB records.
 *
 * @param {Object} params
 * @param {number|string} params.jobId
 * @param {string} params.paymentMethod - "FullDigital" | "Card" | "CashSplit" | "Cash"
 * @returns {Promise<Object>} CustomerPaymentResultDto
 */
export const processPayment = async ({ jobId, paymentMethod }) => {
  return fetchWithAuth('/MockPayment/process', {
    method: 'POST',
    body: JSON.stringify({
      jobId: Number(jobId),
      paymentMethod,
    }),
  });
};

/**
 * Retrieves the recorded payment transaction for a job if available.
 *
 * @param {number|string} jobId
 * @returns {Promise<Object>} PaymentTransaction
 */
export const getPaymentByJob = async (jobId) => {
  return fetchWithAuth(`/MockPayment/job/${jobId}`);
};
