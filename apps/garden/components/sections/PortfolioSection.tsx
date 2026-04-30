'use client';

import PortfolioProjectCard from '@/components/molecules/PortfolioProjectCard';
import { projects } from '@personal-os-web/portfolio-data';

export default function PortfolioSection() {
  return (
    <section id="portfolio" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">Portfolio</h2>
        </div>

        <div className="mx-auto max-w-6xl">
          {projects.map((project, index) => (
            <PortfolioProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
