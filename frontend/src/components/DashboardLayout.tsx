'use client';
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  headerProps?: any;
}

export default function DashboardLayout({ children, headerProps }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[200px]">
        <Header {...headerProps} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
