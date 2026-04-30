'use client';

import type { Skill } from '@personal-os-web/portfolio-types';

interface SkillCardProps {
  skill: Skill;
  onClick: () => void;
  /** Kept for call-site compatibility; unused (scroll animations removed). */
  index?: number;
}

export default function SkillCard({ skill, onClick }: SkillCardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className="flex cursor-pointer flex-col items-center rounded-lg bg-white p-6 text-center shadow-md transition-shadow duration-300 hover:shadow-xl"
    >
      <img src={skill.icon} alt={skill.title} className="mb-4 h-20 w-20 object-contain" />
      <h4 className="mb-2 text-xl font-bold text-gray-900">{skill.title}</h4>
      <p className="mb-1 text-sm text-gray-600">{skill.category}</p>
      <p className="text-sm text-gray-500">{skill.experience}</p>
    </div>
  );
}
