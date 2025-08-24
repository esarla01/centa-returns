// components/Header.tsx
'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { getRoleNameInTurkish } from '@/lib/utils';

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) {
        onLogout();
      }
      router.push('/login');
    } catch (error) {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <header className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-300 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  const currentDate = new Date().toLocaleDateString('tr-TR', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  });
  
  // Navigation links
  const navLinks = [
    { 
      permission: 'PAGE_VIEW_ADMIN', 
      href: '/admin-dashboard', 
      text: 'Yönetici Paneli'
    },
    { 
      permission: 'PAGE_VIEW_CUSTOMER_LIST', 
      href: '/manage-customers', 
      text: 'Müşteriler'
    },
    { 
      permission: 'PAGE_VIEW_PRODUCT_LIST', 
      href: '/manage-products', 
      text: 'Ürünler'
    },
    { 
      permission: 'PAGE_VIEW_CASE_TRACKING', 
      href: '/manage-returns', 
      text: 'Arıza Takip'
    },
    { 
      permission: 'PAGE_VIEW_STATISTICS', 
      href: '/view-statistics', 
      text: 'Raporlar'
    },
  ];

  // Filter nav links based on user permissions
  const filteredNavLinks = navLinks.filter(link => {
    if (!user) return false;
    if (['TECHNICIAN', 'SUPPORT'].includes(user.role)) return false;
    return user.permissions.includes(link.permission);
  });

  const isActiveLink = (href: string) => pathname === href;

  return (
    <header className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md">
      <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Left Side: Logo and Title */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <img src="/logo.png" alt="Centa Logo" className="h-10 w-auto" />
            <h1 className="hidden lg:block text-xl font-semibold text-gray-800">
              Arıza Takip Sistemi
            </h1>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {filteredNavLinks.map((link, idx) => (
              <a 
                key={idx} 
                href={link.href} 
                className={`
                  text-sm font-medium transition-colors
                  ${isActiveLink(link.href) 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {link.text}
              </a>
            ))}
          </nav>

          {/* Right Side: User Info and Actions */}
          <div className="flex items-center gap-6">
            {/* Date */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-gray-50 border border-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-500 font-medium">{currentDate}</span>
            </div>

            {/* User Info */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-blue-50 border border-blue-100">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-blue-900 font-semibold">
                  {user.firstName} {user.lastName}
                  <span className="text-blue-700 font-normal ml-1">
                    ({getRoleNameInTurkish[user.role]})
                  </span>
                </span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded bg-red-50 border border-red-100 text-sm text-red-600 hover:bg-red-100 hover:text-red-700 font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
              </svg>
              Çıkış
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-800"
            >
              <span className="sr-only">Ana menüyü aç</span>
              {isMenuOpen ? (
                <X className="block h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="block h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <nav className="px-4 py-2 space-y-1">
            {filteredNavLinks.map((link, idx) => (
              <a 
                key={idx} 
                href={link.href} 
                className={`
                  block px-3 py-2 text-base font-medium rounded-md transition-colors
                  ${isActiveLink(link.href) 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.text}
              </a>
            ))}
          </nav>
          
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{currentDate}</span>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}