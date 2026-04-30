import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target } from 'lucide-react';
import { useCelebration } from '@/hooks/useCelebration';

type CelebrationType =
  | 'goal_achieved'
  | 'criteria_completed'
  | 'milestone_25'
  | 'milestone_50'
  | 'milestone_75'
  | 'streak';

interface CelebrationEffectProps {
  show: boolean;
  type: CelebrationType;
  message?: string;
  onComplete?: () => void;
}

export function CelebrationEffect({ show, type, message, onComplete }: CelebrationEffectProps) {
  const { celebrate } = useCelebration();

  useEffect(() => {
    if (show) {
      celebrate(type);

      // Auto-dismiss after animation
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [show, type, celebrate, onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'goal_achieved':
        return <Trophy className="w-16 h-16 text-yellow-500" />;
      case 'criteria_completed':
        return <Target className="w-16 h-16 text-green-500" />;
      case 'milestone_75':
      case 'milestone_50':
      case 'milestone_25':
        return <Star className="w-16 h-16 text-blue-500" />;
      case 'streak':
        return <Zap className="w-16 h-16 text-orange-500" />;
    }
  };

  const getMessage = () => {
    if (message) return message;

    switch (type) {
      case 'goal_achieved':
        return 'Goal Achieved!';
      case 'criteria_completed':
        return 'All Criteria Met!';
      case 'milestone_75':
        return '75% Complete!';
      case 'milestone_50':
        return 'Halfway There!';
      case 'milestone_25':
        return '25% Progress!';
      case 'streak':
        return 'Streak Milestone!';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: [0, 1.2, 1],
              rotate: [-180, 20, 0],
            }}
            transition={{
              duration: 0.6,
              times: [0, 0.6, 1],
              ease: 'easeOut',
            }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center border-4 border-yellow-400 dark:border-yellow-500"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="mb-6"
            >
              {getIcon()}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {getMessage()}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
