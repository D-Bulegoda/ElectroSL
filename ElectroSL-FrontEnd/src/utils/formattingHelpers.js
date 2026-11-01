export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);
};

export const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};