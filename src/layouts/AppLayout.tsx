import React from 'react';
import Sidebar from '../components/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="xl:flex xl:min-h-screen">
        <Sidebar />

        <main className="flex-1 bg-slate-100 py-6 px-4 xl:px-8">
          <div className="mx-auto max-w-screen-2xl">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
