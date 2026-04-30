'use client';

import type { BlogPost } from '@personal-os-web/portfolio-types';

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex cursor-pointer flex-col overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-xl"
    >
      <div className="aspect-video w-full overflow-hidden">
        <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
      </div>
      <div className="p-6">
        <h4 className="mb-3 line-clamp-2 text-xl font-bold text-gray-900">{post.title}</h4>
        <p className="mb-4 line-clamp-3 text-gray-700">{post.summary}</p>
        <p className="text-sm text-gray-500">Written {post.date} on Medium</p>
      </div>
    </a>
  );
}
