import React from 'react';
import { Link } from 'react-router-dom';

const DocumentListPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
            <p className="mt-2 text-sm text-slate-600">Browse and manage your uploaded documents.</p>
          </div>
          <Link
            to="/documents/upload"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Upload document
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">Onboarding checklist.pdf</p>
              <p className="mt-1 text-sm text-slate-600">Uploaded 3 days ago</p>
            </div>
            <Link
              to="/documents/1"
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View
            </Link>
          </div>
          <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">Compliance guide.docx</p>
              <p className="mt-1 text-sm text-slate-600">Uploaded 1 week ago</p>
            </div>
            <Link
              to="/documents/2"
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentListPage;
