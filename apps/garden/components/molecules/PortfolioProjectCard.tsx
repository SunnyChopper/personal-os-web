'use client';

import Button from '@/components/ui/Button';
import type { Project } from '@personal-os-web/portfolio-types';

interface PortfolioProjectCardProps {
  project: Project;
  index?: number;
}

export default function PortfolioProjectCard({ project }: PortfolioProjectCardProps) {
  return (
    <div className="mb-12 flex flex-col items-center gap-6 md:flex-row">
      <div className="flex w-full justify-center md:w-1/3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.title}
          className="w-4/5 rounded-3xl shadow-lg md:w-full"
        />
      </div>
      <div className="w-full text-center md:w-2/3 md:text-left">
        <h3 className="mb-2 text-3xl font-bold text-primary">{project.title}</h3>
        <h6 className="mb-4 text-lg text-gray-600">{project.subtitle}</h6>
        {project.description.map((paragraph, idx) => (
          <p key={idx} className="mb-3 text-gray-700">
            {paragraph}
          </p>
        ))}
        {project.link ? (
          <Button
            variant="success"
            size="sm"
            onClick={() => window.open(project.link, '_blank')}
            className="mt-4"
            type="button"
          >
            {project.linkText || 'View Project'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
