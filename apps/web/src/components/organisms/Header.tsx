import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import { ROUTES } from '@/routes';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle hash update in useEffect to avoid React compiler error
  useEffect(() => {
    if (pendingHash && location.pathname === '/') {
      const currentUrl = window.location.href.split('#')[0];
      window.history.replaceState(null, '', `${currentUrl}#${pendingHash}`);
      const element = document.querySelector(pendingHash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setPendingHash(null);
    }
  }, [pendingHash, location.pathname]);

  const navItems = [
    { label: 'Home', href: '/#home' },
    { label: 'Skills', href: '/#skills' },
    { label: 'Portfolio', href: '/#portfolio' },
    { label: 'Products', href: ROUTES.products },
    { label: 'Experience', href: '/#experience' },
    { label: 'Blog', href: '/#blog' },
    { label: 'Contact', href: '/#contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (href.startsWith('/#')) {
      const hash = href.substring(1);

      if (location.pathname === '/') {
        // Set pending hash to be handled by useEffect
        setPendingHash(hash);
      } else {
        navigate('/' + hash);
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        isScrolled ? 'bg-white dark:bg-gray-900 shadow-md py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 transition-colors"
          >
            Sunny Singh
          </Link>

          <nav className="hidden xl:flex items-center gap-8">
            {navItems.map((item) =>
              item.href.startsWith('/#') ? (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              )
            )}
            <ThemeToggle />
          </nav>

          <div className="xl:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 transition-colors"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navItems.map((item) =>
                item.href.startsWith('/#') ? (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium py-2"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium py-2"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
