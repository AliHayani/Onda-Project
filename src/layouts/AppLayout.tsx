import React from 'react';
import Sidebar from '../components/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen w-full overflow-hidden bg-slate-100 text-slate-900">
      <div className="flex h-full w-full">
        <Sidebar />

        <main className="h-full min-w-0 flex-1 overflow-y-auto bg-slate-100 px-4 py-6 xl:px-8">
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
