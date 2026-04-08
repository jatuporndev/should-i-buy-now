/** CSS modifier for daily change row; mirrors previous App.tsx behavior. */
export function priceChangeClassFromPercent(changePercent: number): string {
  if (changePercent > 0) return 'price-change--up'
  if (changePercent < 0) return 'price-change--down'
  return ''
}
