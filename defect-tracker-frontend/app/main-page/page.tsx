'use client';
import React from 'react';
import Header from '@/app/components/Header';

export default function MainPage() {
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      <Header onLogout={() => alert('Logging out...')} />
      </div>
    );
  }
