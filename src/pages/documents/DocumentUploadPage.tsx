import React from 'react';

const DocumentUploadPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Upload document</h1>
        <p className="mt-2 text-sm text-slate-600">Add a new file to the document library and attach it to procedures.</p>
      </div>

      <form className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">
            Document title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Enter document title"
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-slate-700">
            Choose file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            className="mt-2 block w-full text-sm text-slate-600"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Optional document description"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Upload document
        </button>
      </form>
    </div>
  );
};

export default DocumentUploadPage;
