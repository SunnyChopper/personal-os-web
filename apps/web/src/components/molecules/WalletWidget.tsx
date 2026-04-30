import { Coins, TrendingUp, History, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/Wallet';
import { signedWalletDisplayAmount } from '@/lib/wallet-transaction-display';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const PANEL_MAX_WIDTH = 320;
const VIEWPORT_MARGIN = 12;
/** Above AdminLayout mobile header (z-50) and sidebar (z-40); must not live under transformed ancestors. */
const OVERLAY_Z = 100;
const PANEL_Z = 110;

function computePanelPosition(trigger: DOMRect): { top: number; left: number; width: number } {
  const vw = window.innerWidth;
  const width = Math.min(PANEL_MAX_WIDTH, vw - VIEWPORT_MARGIN * 2);
  const centerX = trigger.left + trigger.width / 2 - width / 2;
  const left = Math.max(VIEWPORT_MARGIN, Math.min(centerX, vw - width - VIEWPORT_MARGIN));
  const top = trigger.bottom + 8;
  return { top, left, width };
}

export const WalletWidget = () => {
  const { balance, transactions, loading, isRefreshing } = useWallet();
  const [showHistory, setShowHistory] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  const updatePanelPosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    setPanelStyle(computePanelPosition(el.getBoundingClientRect()));
  }, []);

  useLayoutEffect(() => {
    if (!showHistory) {
      return;
    }
    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', updatePanelPosition);
    vv?.addEventListener('scroll', updatePanelPosition);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
      vv?.removeEventListener('resize', updatePanelPosition);
      vv?.removeEventListener('scroll', updatePanelPosition);
    };
  }, [showHistory, updatePanelPosition]);

  useEffect(() => {
    if (!showHistory) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHistory(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showHistory]);

  if (loading || !balance) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
        <Coins size={16} className="text-yellow-600 dark:text-yellow-500" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={showHistory}
        aria-haspopup="dialog"
        onClick={() => {
          if (showHistory) {
            setShowHistory(false);
          } else {
            setPanelStyle(null);
            setShowHistory(true);
          }
        }}
        className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-full transition-colors"
        aria-busy={isRefreshing}
      >
        <Coins size={16} className="text-yellow-600 dark:text-yellow-500" />
        {isRefreshing ? (
          <Loader2
            size={16}
            className="animate-spin text-yellow-800 dark:text-yellow-200"
            aria-label="Updating wallet balance"
          />
        ) : (
          <span className="text-sm font-bold text-yellow-900 dark:text-yellow-300">
            {balance.totalPoints.toLocaleString()}
          </span>
        )}
      </button>

      {showHistory &&
        panelStyle &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 m-0 cursor-default border-0 bg-transparent p-0 focus:outline-none"
              style={{ zIndex: OVERLAY_Z }}
              aria-label="Close wallet"
              onClick={() => setShowHistory(false)}
            />
            <div
              role="dialog"
              aria-label="Wallet balance and recent transactions"
              className="fixed max-h-[min(80vh,calc(100dvh-1.5rem))] flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
              style={{
                zIndex: PANEL_Z,
                top: panelStyle.top,
                left: panelStyle.left,
                width: panelStyle.width,
              }}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Wallet Balance</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-600 dark:text-green-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Earned</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {balance.lifetimeEarned.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-red-600 dark:text-red-500" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Spent</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {balance.lifetimeSpent.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Recent Transactions
                </h4>
                <div className="space-y-2">
                  {transactions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                      No transactions yet
                    </p>
                  ) : (
                    transactions.slice(0, 10).map((transaction) => {
                      const displaySigned = signedWalletDisplayAmount(
                        transaction.amount,
                        transaction.type
                      );
                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white truncate">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-semibold ml-2 flex-shrink-0 ${
                              displaySigned > 0
                                ? 'text-green-600 dark:text-green-500'
                                : displaySigned < 0
                                  ? 'text-red-600 dark:text-red-500'
                                  : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {displaySigned > 0 ? '+' : ''}
                            {displaySigned.toLocaleString()}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
