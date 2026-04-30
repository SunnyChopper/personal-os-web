"use client";

import { Phone, Mail } from "lucide-react";

export default function ContactSection() {
  return (
    <section id="contact" className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">Ready to Work?</h2>
          <p className="text-lg text-gray-600">Like what you see? Let&apos;s work together.</p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <a
            href="tel:2174194494"
            className="group flex flex-col items-center rounded-lg bg-white p-8 text-center shadow-md transition-shadow duration-300 hover:shadow-xl"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Phone className="text-primary" size={32} />
            </div>
            <h4 className="text-2xl font-bold text-gray-900">Call</h4>
          </a>

          <a
            href="mailto:ishy.singh@gmail.com"
            className="group flex flex-col items-center rounded-lg bg-white p-8 text-center shadow-md transition-shadow duration-300 hover:shadow-xl"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Mail className="text-primary" size={32} />
            </div>
            <h4 className="text-2xl font-bold text-gray-900">Email</h4>
          </a>
        </div>
      </div>
    </section>
  );
}
