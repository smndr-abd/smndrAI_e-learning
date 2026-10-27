export function formatPrice(cents: number) {
  return cents === 0 ? "Free" : `${(cents / 100).toFixed(2)} USD`;
}
