import { useCallback } from 'react';

type CelebrationIntensity = 'small' | 'medium' | 'large' | 'epic';

export function useCelebration() {
  const triggerConfetti = useCallback(async (intensity: CelebrationIntensity = 'medium') => {
    // Dynamically import canvas-confetti when needed
    const confetti = (await import('canvas-confetti')).default;

    const configs = {
      small: {
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 },
      },
      medium: {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      },
      large: {
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        startVelocity: 45,
      },
      epic: {
        particleCount: 200,
        spread: 120,
        origin: { y: 0.4 },
        startVelocity: 55,
        ticks: 400,
      },
    };

    const config = configs[intensity];

    // For epic celebrations, do multiple bursts
    if (intensity === 'epic') {
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        confetti({
          ...config,
          particleCount: 50,
          origin: {
            x: randomInRange(0.1, 0.9),
            y: Math.random() - 0.2,
          },
        });
      }, 250);
    } else {
      // Single burst for other intensities
      confetti(config);
    }
  }, []);

  const celebrate = useCallback(
    (
      type:
        | 'goal_achieved'
        | 'criteria_completed'
        | 'milestone_25'
        | 'milestone_50'
        | 'milestone_75'
        | 'streak'
    ) => {
      const intensityMap: Record<typeof type, CelebrationIntensity> = {
        goal_achieved: 'epic',
        criteria_completed: 'large',
        milestone_75: 'large',
        milestone_50: 'medium',
        milestone_25: 'small',
        streak: 'medium',
      };

      const intensity = intensityMap[type];
      triggerConfetti(intensity);

      // Optional: Play sound effect
      // You can add sound effects here if desired
    },
    [triggerConfetti]
  );

  return {
    celebrate,
    triggerConfetti,
  };
}
