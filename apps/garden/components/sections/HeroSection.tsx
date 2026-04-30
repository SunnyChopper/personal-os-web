'use client';

import Button from '@/components/ui/Button';

export default function HeroSection() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url(/images/cover.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
          Full Stack Web and Mobile App Developer
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
          &quot;Go to bed smarter than when you woke up.&quot; - Charlie Munger
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => scrollToSection('portfolio')}
            type="button"
          >
            View Portfolio
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => scrollToSection('contact')}
            type="button"
          >
            Contact Me
          </Button>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transform cursor-pointer"
        onClick={() => scrollToSection('skills')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') scrollToSection('skills');
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white p-2">
          <div className="h-2 w-1 animate-bounce rounded-full bg-white" />
        </div>
      </div>
    </section>
  );
}
