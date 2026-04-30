'use client';

import Dialog from '@/components/ui/Dialog';
import type { Skill } from '@personal-os-web/portfolio-types';

interface SkillModalProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SkillModal({ skill, isOpen, onClose }: SkillModalProps) {
  if (!skill) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="mb-4 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={skill.icon} alt={skill.title} className="h-16 w-16 object-contain" />
        <h5 className="text-2xl font-bold">{skill.title}</h5>
      </div>
      <p className="leading-relaxed text-gray-700">{skill.description}</p>
    </Dialog>
  );
}
