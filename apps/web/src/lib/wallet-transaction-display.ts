/** Map GET /wallet recent transaction `type` to signed display amount (API uses absolute amount). */

export function isWalletTransactionCredit(type: string): boolean {
  return type === 'earn' || type === 'refund';
}

export function isWalletTransactionDebit(type: string): boolean {
  return type === 'spend' || type === 'clawback';
}

export function signedWalletDisplayAmount(amount: number, type: string): number {
  if (isWalletTransactionCredit(type)) return amount;
  if (isWalletTransactionDebit(type)) return -amount;
  return amount;
}
