'use client';

import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

interface EmailNotificationToggleProps {
  email: string;
  enabled: boolean;
  onToggle: (email: string, enabled: boolean) => Promise<void>;
}

export default function EmailNotificationToggle({
  email,
  enabled,
  onToggle
}: EmailNotificationToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newState = !isEnabled;
      await onToggle(email, newState);
      setIsEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle email notifications:', error);
      // Revert on error
      setIsEnabled(isEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isEnabled ? 'bg-blue-600' : 'bg-gray-300'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isEnabled ? 'E-posta bildirimleri aktif' : 'E-posta bildirimleri kapalı'}
    >
      <span className="sr-only">E-posta bildirimlerini değiştir</span>
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
          transition-transform duration-200 ease-in-out
          ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      >
        {isEnabled ? (
          <Bell className="h-3 w-3 text-blue-600 m-0.5" />
        ) : (
          <BellOff className="h-3 w-3 text-gray-400 m-0.5" />
        )}
      </span>
    </button>
  );
}
