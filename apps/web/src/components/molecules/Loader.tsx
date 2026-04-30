import { motion, useReducedMotion } from 'framer-motion';

interface LoaderProps {
  isLoading: boolean;
}

export default function Loader({ isLoading }: LoaderProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[9999] flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        animate={{
          background: shouldReduceMotion
            ? 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
            : [
                'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative w-32 h-32">
        {/* Outer ring - large, slow rotation */}
        <motion.div
          animate={{
            rotate: shouldReduceMotion ? 0 : 360,
            scale: shouldReduceMotion ? 1 : [1, 1.05, 1],
          }}
          transition={{
            rotate: {
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent dark:border-t-blue-400 dark:border-r-blue-400"
        />

        {/* Middle ring - medium, fast rotation (opposite direction) */}
        <motion.div
          animate={{
            rotate: shouldReduceMotion ? 0 : -360,
            scale: shouldReduceMotion ? 1 : [1, 0.95, 1],
          }}
          transition={{
            rotate: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className="absolute inset-4 rounded-full border-[3px] border-transparent border-t-purple-600 border-l-purple-600 border-b-transparent border-r-transparent dark:border-t-purple-400 dark:border-l-purple-400"
        />

        {/* Inner ring - small, medium rotation */}
        <motion.div
          animate={{
            rotate: shouldReduceMotion ? 0 : 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-8 rounded-full border-2 border-transparent border-t-pink-500 border-r-pink-500 border-b-transparent border-l-transparent dark:border-t-pink-400 dark:border-r-pink-400"
        />

        {/* Orbiting particles container */}
        <motion.div
          animate={{
            rotate: shouldReduceMotion ? 0 : 360,
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0"
        >
          {[0, 1, 2, 3].map((i) => {
            const angle = i * 90 * (Math.PI / 180);
            const radius = 40 + i * 8;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div
                key={i}
                className="absolute rounded-full w-1.5 h-1.5"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                  background: `hsl(${210 + i * 30}, 70%, 60%)`,
                  boxShadow: `0 0 ${8 + i * 2}px hsl(${210 + i * 30}, 70%, 60%)`,
                }}
              />
            );
          })}
        </motion.div>

        {/* Center pulsing dot */}
        <motion.div
          animate={{
            scale: shouldReduceMotion ? 1 : [1, 1.3, 1],
            opacity: shouldReduceMotion ? 1 : [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(147,51,234,0.4)]"
        />

        {/* Glow effect */}
        <motion.div
          animate={{
            opacity: shouldReduceMotion ? 0.3 : [0.3, 0.6, 0.3],
            scale: shouldReduceMotion ? 1 : [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-400/30 dark:via-purple-400/30 dark:to-pink-400/30 blur-xl"
        />
      </div>
    </div>
  );
}
