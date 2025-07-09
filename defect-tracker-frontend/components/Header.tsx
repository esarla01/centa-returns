import React from 'react';

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
    const currentDate = new Date().toLocaleDateString('tr-TR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Europe/Istanbul',
    });

    return (
        <header className="w-full bg-gray-50 shadow text-black border-b border-gray-300 py-5 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Centa Logo" className="h-10 w-auto" />
                <h1 className="text-2xl font-semibold">Arıza Takip Sistemi</h1>
            </div>

            <div className="flex items-center gap-6 text-sm">
                <span>{currentDate}</span>
                <button className="text-red-600 hover:underline font-medium">Çıkış Yap</button>
            </div>
        </header>
    );
}
