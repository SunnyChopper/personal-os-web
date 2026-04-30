import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from '@/components/organisms/HeroSection';
import SkillsSection from '@/components/organisms/SkillsSection';
import PortfolioSection from '@/components/organisms/PortfolioSection';
import BlogSection from '@/components/organisms/BlogSection';
import ContactSection from '@/components/organisms/ContactSection';

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <>
      <HeroSection />
      <SkillsSection />
      <PortfolioSection />
      <BlogSection />
      <ContactSection />
    </>
  );
}
