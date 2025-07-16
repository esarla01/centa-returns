// components/Header.tsx
'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react'; // Icons for the hamburger menu
import RequireRole from './RequireRole';

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentDate = new Date().toLocaleDateString('tr-TR', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  });
  
  // Reusable array of nav links to avoid repetition
  const navLinks = [
    { permission: 'admin', href: '/admin-dashboard', text: 'Yönetici Sayfası' },
    { permission: 'admin', href: '/manage-customers', text: 'Müşteri Listesi' },
    { permission: 'admin', href: '/manage-products', text: 'Ürün Listesi' },
    { permission: 'admin', href: '/manage-returns', text: 'Arıza Takip Paneli' },
    { permission: 'admin', href: '/statistics', text: 'Raporlar' },
  ];

  return (
    <header className="w-full bg-white shadow-sm text-black border-b border-gray-200 relative">

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left Side: Logo and Title */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <img src="/logo.png" alt="Centa Logo" className="h-10 w-auto" />
            <h1 className="hidden lg:block text-xl font-semibold text-gray-800">
              Arıza Takip Sistemi
            </h1>
          </div>

          {/* Center: Desktop Navigation (hidden on mobile) */}
          <nav className="hidden md:flex items-center md: gap-6">
            {navLinks.map((link, idx) => (
                // <RequireRole key={idx} role={link.permission}> 
                    <a key={idx} href={link.href} className="text-sm font-medium text-gray-600 hover:text-primary">
                        {link.text}
                    </a>
                // </RequireRole>
            ))}
          </nav>

          {/* Right Side: Date, Logout, and Hamburger Menu Icon */}
          <div className="flex items-center gap-4">
            {/* Date and Logout button (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="text-gray-500">{currentDate}</span>
              <button onClick={onLogout} className="text-red-600 hover:underline font-medium">
                Çıkış Yap
              </button>
            </div>
            
            {/* Hamburger Menu Button (visible on mobile) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link, idx) => (
                // <RequireRole key={idx} role={link.permission}> 
                    <a key={idx} href={link.href} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                        {link.text}
                    </a>
                // </RequireRole>
            ))}
          </nav>
          {/* User info and logout button inside the mobile menu */}
          <div className="pt-4 pb-3 border-t border-gray-200">
             <div className="flex flex-col items-start px-4 space-y-3">
               <span className="text-sm text-gray-500">{currentDate}</span>
                <button onClick={onLogout} className="text-base font-medium text-red-600 hover:underline">
                  Çıkış Yap
                </button>
             </div>
          </div>
        </div>
      )}
    </header>
  );
}