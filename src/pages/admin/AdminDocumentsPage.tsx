import React from 'react';

const AdminDocumentsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Admin documents</h1>
        <p className="mt-2 text-sm text-slate-600">Monitor document uploads and approve library changes.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">Onboarding checklist.pdf</p>
              <p className="mt-1 text-sm text-slate-600">Uploaded by Operations team</p>
            </div>
            <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Approve
            </button>
          </div>
          <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">Compliance guide.docx</p>
              <p className="mt-1 text-sm text-slate-600">Uploaded by Legal team</p>
            </div>
            <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDocumentsPage;
