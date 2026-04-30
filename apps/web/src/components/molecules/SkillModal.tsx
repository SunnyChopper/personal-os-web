import Dialog from '@/components/molecules/Dialog';
import type { Skill } from '@/types';

interface SkillModalProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SkillModal({ skill, isOpen, onClose }: SkillModalProps) {
  if (!skill) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center gap-4 mb-4">
        <img src={skill.icon} alt={skill.title} className="w-16 h-16 object-contain" />
        <h5 className="text-2xl font-bold">{skill.title}</h5>
      </div>
      <p className="text-gray-700 leading-relaxed">{skill.description}</p>
    </Dialog>
  );
}
