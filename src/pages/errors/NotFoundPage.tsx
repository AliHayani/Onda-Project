import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl rounded-3xl bg-white px-8 py-12 shadow-lg ring-1 ring-slate-200">
        <h1 className="text-5xl font-extrabold text-slate-900">404</h1>
        <p className="mt-4 text-xl font-semibold text-slate-700">Page not found</p>
        <p className="mt-2 text-slate-600">The page you’re looking for does not exist or has been moved.</p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
