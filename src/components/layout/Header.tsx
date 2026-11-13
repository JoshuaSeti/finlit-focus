import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import finlitLogo from '@/assets/finlit-logo.png';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Programs', href: '/programs' },
  { name: 'Lessons', href: '/modules' },
  { name: 'Resources & Blog', href: '/resources-blog' },
  { name: 'Contact', href: '/contact' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, role } = useAuth();
  const learner = !!user && !role;

  return (
    <header
      className="fixed left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/30 shadow-sm"
      style={{ top: 'var(--announcement-h, 0px)' }}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={finlitLogo} alt="FinLit - Learn it. Earn it. Lead it." className="h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "text-sm font-semibold uppercase tracking-wide transition-colors duration-200 hover:text-primary",
                  location.pathname === link.href
                    ? "text-primary"
                    : "text-foreground/80"
                )}
              >
                {link.name}
              </Link>
            ))}
            {learner && <Link to="/account" className="text-sm font-semibold uppercase tracking-wide text-foreground/80 hover:text-primary">My account</Link>}
            <Link to="/facilitator/login">
              <Button variant="outline" size="sm" className="gap-2">
                <Users size={16} />
                For Facilitators
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "text-base font-semibold uppercase tracking-wide py-2 transition-colors duration-200",
                    location.pathname === link.href
                      ? "text-primary"
                      : "text-foreground/80 hover:text-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {learner && <Link to="/account" className="text-base font-semibold uppercase tracking-wide py-2 text-foreground/80" onClick={() => setMobileMenuOpen(false)}>My account</Link>}
              <Link
                to="/facilitator/login"
                className="text-base font-semibold uppercase tracking-wide py-2 text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Facilitators
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
