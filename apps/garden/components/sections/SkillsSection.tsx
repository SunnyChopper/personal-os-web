"use client";

import { useState } from "react";
import SkillCard from "@personal-os-web/ui/skill-card";
import SkillModal from "@/components/molecules/SkillModal";
import { skills } from "@personal-os-web/portfolio-data";
import type { Skill } from "@personal-os-web/portfolio-types";

export default function SkillsSection() {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  return (
    <section id="skills" className="border-b border-gray-200 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">My Skills</h2>
          <p className="text-lg text-gray-600">Click on any box to learn more about that skill</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {skills.map((skill, index) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onClick={() => handleSkillClick(skill)}
              index={index}
            />
          ))}
        </div>
      </div>

      <SkillModal skill={selectedSkill} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
