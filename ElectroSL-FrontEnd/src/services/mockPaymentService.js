export const processMockPayment = async (amount, cardDetails) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionId: `TXN-MOCK-${Math.floor(Math.random() * 1000000)}`,
        commissionDeducted: amount * 0.15,
        electricianEarning: amount * 0.85
      });
    }, 1500);
  });
};