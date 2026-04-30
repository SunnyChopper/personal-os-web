/**
 * Shared portfolio / marketing DTOs for the Vite admin SPA and the Next.js public site.
 */
export interface Skill {
  id: string;
  title: string;
  category: string;
  experience: string;
  icon: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string[];
  image: string;
  technologies: string;
  link?: string;
  linkText?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  time: string;
  logo: string;
  summary: string;
  roles: string[];
  skills: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  date: string;
  image: string;
  url: string;
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  url: string;
}
