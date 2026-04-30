import { describe, expect, it } from 'vitest';
import { signedWalletDisplayAmount } from '@/lib/wallet-transaction-display';

describe('signedWalletDisplayAmount', () => {
  it('treats clawback like a debit using absolute amount from API', () => {
    expect(signedWalletDisplayAmount(11, 'clawback')).toBe(-11);
  });

  it('treats earn as credit', () => {
    expect(signedWalletDisplayAmount(11, 'earn')).toBe(11);
  });
});
