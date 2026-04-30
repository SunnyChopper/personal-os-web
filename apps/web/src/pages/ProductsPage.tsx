import { motion } from 'framer-motion';

export default function ProductsPage() {
  return (
    <>
      <section
        className="relative h-[40vh] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: 'url(../images/cover.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white"
          >
            Published Products
          </motion.h1>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.a
              href={`${import.meta.env.BASE_URL}products/canvascraft`.replace(/\/+/g, '/')}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-200"
            >
              <img
                src="../images/canvas-craft-square-logo-transparent.png"
                alt="CanvasCraft"
                className="w-full mb-6"
              />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">CanvasCraft</h2>
              <h5 className="text-gray-500 mb-4">Published April 2024</h5>
              <p className="text-gray-700 mb-4">
                CanvasCraft is a tool for entrepreneurs to swiftly turn ideas into strategic plans.
                Its intuitive interface and GPT API integration streamline the Lean Canvas process
                and generate business plans efficiently.
              </p>
              <p className="text-gray-700">
                The backend API runs on AWS (API Gateway, Lambda, and DynamoDB), and the frontend
                uses React Native and Expo.
              </p>
            </motion.a>
          </div>
        </div>
      </section>
    </>
  );
}
