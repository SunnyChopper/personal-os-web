import { motion } from 'framer-motion';
import { Phone, Mail } from 'lucide-react';

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Ready to Work?</h2>
          <p className="text-gray-600 text-lg">Like what you see? Let's work together.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <motion.a
            href="tel:2174194494"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Phone className="text-primary" size={32} />
            </div>
            <h4 className="text-2xl font-bold text-gray-900">Call</h4>
          </motion.a>

          <motion.a
            href="mailto:ishy.singh@gmail.com"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Mail className="text-primary" size={32} />
            </div>
            <h4 className="text-2xl font-bold text-gray-900">Email</h4>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
