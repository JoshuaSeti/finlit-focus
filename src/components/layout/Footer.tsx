import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import finlitLogo from '@/assets/finlit-logo.png';

export function Footer() {
  return (
    <footer className="bg-green-900 text-green-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Mission */}
          <div className="md:col-span-2">
            <img src={finlitLogo} alt="FinLit Logo" className="h-12 w-auto mb-4 brightness-0 invert" />
            <p className="text-green-200 text-sm max-w-md">
              FinLit is a non-profit organization dedicated to empowering youth through 
              comprehensive financial literacy education across Zambia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-green-50 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-green-200 hover:text-green-50 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-green-200 hover:text-green-50 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/resources-blog" className="text-sm text-green-200 hover:text-green-50 transition-colors">
                  Resources & Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-green-200 hover:text-green-50 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/facilitator/login" className="text-sm text-green-200 hover:text-green-50 transition-colors">
                  Facilitator Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-green-50 mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-green-200">
                <Mail size={16} className="text-primary" />
                <a href="mailto:info@finlit-zm.org" className="hover:text-green-50 transition-colors">
                  info@finlit-zm.org
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-green-200">
                <Phone size={16} className="text-primary" />
                <span>+260 965098112</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-green-200">
                <MapPin size={16} className="text-primary mt-0.5" />
                <span>Lusaka, Zambia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-green-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-green-300">
            © {new Date().getFullYear()} FinLit. All rights reserved. Learn it. Earn it. Lead it.
          </p>
          {/* Hidden admin link - triple click to reveal */}
          <span 
            className="text-xs text-green-900 hover:text-green-700 transition-colors cursor-default select-none"
            onClick={(e) => {
              if (e.detail === 3) {
                window.location.href = '/admin/login';
              }
            }}
          >
            •
          </span>
        </div>
      </div>
    </footer>
  );
}
