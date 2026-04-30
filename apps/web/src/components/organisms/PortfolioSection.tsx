import { motion } from 'framer-motion';
import PortfolioProjectCard from '@/components/molecules/PortfolioProjectCard';
import { projects } from '@personal-os-web/portfolio-data';

export default function PortfolioSection() {
  return (
    <section id="portfolio" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Portfolio</h2>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {projects.map((project, index) => (
            <PortfolioProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
