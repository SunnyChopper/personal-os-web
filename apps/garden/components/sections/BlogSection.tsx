'use client';

import BlogCard from '@personal-os-web/ui/blog-card';
import { blogPosts } from '@personal-os-web/portfolio-data';

export default function BlogSection() {
  return (
    <section id="blog" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Educating Others about Tech
          </h2>
          <p className="text-lg text-gray-600">
            Giving back to the community that taught me so much.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {blogPosts.map((post, index) => (
            <BlogCard key={post.id} post={post} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
