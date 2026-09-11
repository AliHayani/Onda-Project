import React from 'react';
import { Link } from 'react-router-dom';

const DocumentDetailPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Onboarding checklist.pdf</h1>
            <p className="mt-2 text-sm text-slate-600">Uploaded 3 days ago • 210 KB</p>
          </div>
          <Link
            to="/documents"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Back to documents
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Document details</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-700">Type</p>
                <p className="mt-1">PDF</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Owner</p>
                <p className="mt-1">Operations team</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Linked procedure</p>
                <p className="mt-1">Procedure A</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
            <div className="mt-5 space-y-3">
              <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Download
              </button>
              <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                Rename
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Description</h2>
        <p className="mt-4 text-slate-600">
          The onboarding checklist contains the full set of tasks, approvals, and documents required to complete a smooth operations handoff.
        </p>
      </div>
    </div>
  );
};

export default DocumentDetailPage;
