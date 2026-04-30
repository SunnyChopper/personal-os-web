import { motion } from 'framer-motion';
import Button from '@/components/atoms/Button';
import type { Project } from '@/types';

interface PortfolioProjectCardProps {
  project: Project;
  index: number;
}

export default function PortfolioProjectCard({ project, index }: PortfolioProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="flex flex-col md:flex-row gap-6 items-center mb-12"
    >
      <div className="w-full md:w-1/3 flex justify-center">
        <img
          src={project.image}
          alt={project.title}
          className="w-4/5 md:w-full rounded-3xl shadow-lg"
        />
      </div>
      <div className="w-full md:w-2/3 text-center md:text-left">
        <h3 className="text-3xl font-bold text-primary mb-2">{project.title}</h3>
        <h6 className="text-lg text-gray-600 mb-4">{project.subtitle}</h6>
        {project.description.map((paragraph, idx) => (
          <p key={idx} className="text-gray-700 mb-3">
            {paragraph}
          </p>
        ))}
        {project.link && (
          <Button
            variant="success"
            size="sm"
            onClick={() => window.open(project.link, '_blank')}
            className="mt-4"
          >
            {project.linkText || 'View Project'}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
