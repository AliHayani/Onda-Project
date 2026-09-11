import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
            <p className="mt-2 text-sm text-slate-600">Manage your workspace preferences, security posture, and collaboration settings.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Workspace preferences</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-medium text-slate-800">Language</p>
              <p className="mt-1">English</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Notification emails</p>
              <p className="mt-1">Enabled for procedure updates and approvals.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Session timeout</p>
              <p className="mt-1">Automatic sign-out is enforced after 30 minutes of inactivity.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Security & access</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-medium text-slate-800">Password protection</p>
              <p className="mt-1">Passwords can be updated while you are signed in. This ensures secure account recovery without exposing reset links.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Account support</p>
              <p className="mt-1">If you need assistance with your account, reach out to your system administrator for access control support.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Compliance</p>
              <p className="mt-1">Your activity is governed by the organization’s procedure management policy and approval workflows.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
