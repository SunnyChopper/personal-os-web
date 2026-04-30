import { Heart, Sparkles, TreePine, Coffee, Book, Footprints } from 'lucide-react';
import { useState } from 'react';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const digitalDetoxSuggestions = [
  { icon: Book, text: 'Read a physical book', color: 'text-amber-600 dark:text-amber-400' },
  {
    icon: Footprints,
    text: 'Go for a walk in nature',
    color: 'text-green-600 dark:text-green-400',
  },
  {
    icon: Coffee,
    text: 'Enjoy a mindful cup of tea',
    color: 'text-orange-600 dark:text-orange-400',
  },
  {
    icon: TreePine,
    text: 'Practice meditation outdoors',
    color: 'text-teal-600 dark:text-teal-400',
  },
  { icon: Sparkles, text: 'Journal your thoughts', color: 'text-purple-600 dark:text-purple-400' },
];

export default function ZenDashboardPage() {
  const [greeting] = useState(getGreeting());
  const [detoxSuggestion] = useState(
    () => digitalDetoxSuggestions[Math.floor(Math.random() * digitalDetoxSuggestions.length)]
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-serif font-light text-gray-900 dark:text-white mb-3">
          {greeting}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 font-light">
          Time to recharge and nurture yourself
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 rounded-2xl border border-green-100 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-800/50 rounded-xl">
              <Heart className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h2 className="text-xl font-serif font-medium text-gray-900 dark:text-white">
              Recovery Status
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Energy Level
                </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">85%</span>
              </div>
              <div className="h-3 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 dark:bg-green-600 rounded-full"
                  style={{ width: '85%' }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rest Quality
                </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">Good</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                You're on track for optimal recovery
              </p>
            </div>

            <div className="pt-4 border-t border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Keep nurturing your well-being through rest and meaningful activities.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-xl">
              <Sparkles className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <h2 className="text-xl font-serif font-medium text-gray-900 dark:text-white">
              Up Next
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Suggested Activity</p>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Explore your hobbies
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start a new quest or continue an existing project
              </p>
            </div>

            <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                No specific activities scheduled. This is your time to explore freely.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-8 rounded-2xl border border-amber-100 dark:border-amber-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-800/50 rounded-xl">
              <detoxSuggestion.icon className={`${detoxSuggestion.color}`} size={28} />
            </div>
            <h2 className="text-xl font-serif font-medium text-gray-900 dark:text-white">
              Digital Detox
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {detoxSuggestion.text}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Take a break from screens and reconnect with the physical world.
              </p>
            </div>

            <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Even 15 minutes away from screens can help restore your focus and energy.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-stone-50 to-slate-50 dark:from-stone-900/30 dark:to-slate-900/30 p-8 rounded-2xl border border-stone-200 dark:border-stone-800">
        <h2 className="text-2xl font-serif font-light text-gray-900 dark:text-white mb-4 text-center">
          Remember
        </h2>
        <p className="text-center text-gray-700 dark:text-gray-300 text-lg font-light leading-relaxed max-w-3xl mx-auto">
          Rest is not a luxury—it's a necessity. Use this time to recharge, explore your interests,
          and reconnect with what brings you joy. Your well-being matters.
        </p>
      </div>
    </div>
  );
}
