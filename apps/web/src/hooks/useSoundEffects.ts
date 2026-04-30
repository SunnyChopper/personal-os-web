import { useState, useEffect, useCallback } from 'react';
import { soundEffects } from '@/lib/sound-effects';

/**
 * Hook to manage sound effects state and playback
 */
export function useSoundEffects() {
  const [enabled, setEnabledState] = useState(() => soundEffects.isEnabled());

  useEffect(() => {
    soundEffects.setEnabled(enabled);
  }, [enabled]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    soundEffects.setEnabled(value);
  }, []);

  const play = useCallback(
    (
      type: 'click' | 'pop' | 'success' | 'error' | 'whoosh',
      options?: { volume?: number; pitch?: number }
    ) => {
      soundEffects.play(type, options);
    },
    []
  );

  /**
   * Wrap an onClick handler to play a sound effect
   */
  const withSound = useCallback(
    <T extends (...args: any[]) => any>(
      handler: T,
      soundType: 'click' | 'pop' | 'success' | 'error' | 'whoosh' = 'click'
    ): T => {
      return ((...args: Parameters<T>) => {
        play(soundType);
        return handler(...args);
      }) as T;
    },
    [play]
  );

  return {
    enabled,
    setEnabled,
    play,
    withSound,
    soundEffects, // Direct access if needed
  };
}
