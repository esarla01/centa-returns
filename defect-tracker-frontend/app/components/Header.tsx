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
      <header className="w-full px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center justify-between h-14">
          <div className="h-12 w-72 rounded-xl bg-white border border-line animate-pulse"></div>
          <div className="h-10 w-40 rounded-xl bg-white border border-line animate-pulse"></div>
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
      href: '/user-action-logs', 
      text: 'İşlem Geçmişi'
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
    // if (['TECHNICIAN', 'SUPPORT', "LOGISTICS"].includes(user.role)) return false;
    return user.permissions.includes(link.permission);
  });

  const isActiveLink = (href: string) => pathname === href;

  return (
    <header className="w-full px-4 sm:px-6 lg:px-8 pt-4">
      <div className="flex items-center justify-between gap-4">

        {/* Left: logo and navigation, together in one pill */}
        <div className="flex min-w-0 items-center gap-1 rounded-xl border border-line bg-white px-2 py-1.5">
          <a href="/manage-returns" className="flex shrink-0 items-center gap-3 rounded-lg px-2 py-1">
            <img src="/logo.png" alt="Centa" className="h-8 w-auto" />
            <span className="hidden xl:block font-display text-lg text-ink">Arıza Takip</span>
          </a>
          <nav className="hidden lg:flex items-center gap-0.5 border-l border-line pl-2">
            {filteredNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActiveLink(link.href) ? 'page' : undefined}
                className={`inline-flex min-h-10 items-center rounded-lg px-3 text-[15px] transition-colors duration-150 ${
                  isActiveLink(link.href)
                    ? 'bg-ink text-cream'
                    : 'text-ink hover:bg-cream'
                }`}
              >
                {link.text}
              </a>
            ))}
          </nav>
        </div>

        {/* Right: date, who is signed in, sign out */}
        <div className="flex items-center gap-2">
          <span className="eyebrow hidden md:block px-2">{currentDate}</span>

          {user && (
            <div className="hidden sm:flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm">
              <span className="font-medium text-ink">{user.firstName} {user.lastName}</span>
              <span className="text-gray-500">{getRoleNameInTurkish[user.role]}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm text-ink transition-colors hover:border-ink"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
            Çıkış
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white text-ink"
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

      {/* Menu on small screens */}
      {isMenuOpen && (
        <div className="lg:hidden mt-2 rounded-xl border border-line bg-white">
          <nav className="p-2 space-y-1">
            {filteredNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-base transition-colors ${
                  isActiveLink(link.href) ? 'bg-ink text-cream' : 'text-ink hover:bg-cream'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.text}
              </a>
            ))}
          </nav>
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <span className="eyebrow">{currentDate}</span>
            <button onClick={handleLogout} className="text-sm font-medium text-brand hover:text-brand-hover">
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
