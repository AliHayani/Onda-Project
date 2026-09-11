import React from 'react';

const ProcedureHistoryPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Procedure history</h1>
        <p className="mt-2 text-sm text-slate-600">Review updates, approvals, and revisions for this procedure.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <ul className="space-y-4">
          <li className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Version 1.2</p>
                <p className="mt-1 text-sm text-slate-600">Updated by Maria Chen</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Approved</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">Adjusted the approval workflow and added final review notes.</p>
          </li>

          <li className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Version 1.1</p>
                <p className="mt-1 text-sm text-slate-600">Updated by Jorge Rivera</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Pending</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">Added clarifying language to the handoff checklist and document references.</p>
          </li>

          <li className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Version 1.0</p>
                <p className="mt-1 text-sm text-slate-600">Created by Operations team</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Initial</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">Base procedure created for onboarding and compliance review.</p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProcedureHistoryPage;
