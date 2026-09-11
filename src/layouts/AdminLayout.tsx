import React from 'react';
import Sidebar from '../components/Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="xl:flex xl:min-h-screen">
        <Sidebar />

        <main className="flex-1 bg-slate-100 py-6 px-4 xl:px-8">
          <div className="mx-auto max-w-screen-2xl">
            <div className="rounded-3xl bg-slate-50 border border-slate-200 shadow-sm p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">Admin console</h1>
                <p className="mt-2 text-sm text-slate-600">Manage users, procedures, documents, and chat logs.</p>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
