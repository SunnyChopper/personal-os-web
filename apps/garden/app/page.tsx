import HeroSection from '@/components/sections/HeroSection';
import SkillsSection from '@/components/sections/SkillsSection';
import PortfolioSection from '@/components/sections/PortfolioSection';
import BlogSection from '@/components/sections/BlogSection';
import ContactSection from '@/components/sections/ContactSection';
import HomeScrollHandler from '@/components/HomeScrollHandler';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | Sunny Singh',
};

export default function HomePage() {
  return (
    <>
      <HomeScrollHandler />
      <HeroSection />
      <SkillsSection />
      <PortfolioSection />
      <BlogSection />
      <ContactSection />
    </>
  );
}
