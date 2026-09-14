import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import {
  canApproveProcedure,
  canDeleteProcedure,
  canEditProcedure,
  canRejectProcedure,
  canViewProcedure,
  getCategoryLabel,
  getProcedureStatusLabel,
  PROCEDURE_STATUS,
  ProcedureRecord,
} from '../../features/procedures/rbac';
import { apiFetch, readJsonResponse } from '../../lib/api';

type DocumentRecord = {
  id: number;
  procedure: number;
  fichier?: string;
  fichier_url?: string;
  nom_fichier?: string;
  date_ajout?: string;
};

const ACCEPTED_DOCUMENT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.odt,.ods';

const formatDate = (value?: string) => {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const ProcedureDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [procedure, setProcedure] = useState<ProcedureRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchProcedure = async () => {
      if (!id) {
        setError('Procedure id is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await apiFetch(`/api/procedures/${id}/`);
        const data = await readJsonResponse<ProcedureRecord>(response);

        if (!canViewProcedure(user, data)) {
          setError('You are not allowed to view this procedure.');
          setProcedure(null);
          return;
        }

        setProcedure(data);

        const documentsResponse = await apiFetch(`/api/documents/?procedure=${data.id}`);
        const documentsData = await readJsonResponse<DocumentRecord[]>(documentsResponse);
        setDocuments(documentsData);
      } catch {
        setError('Unable to load this procedure.');
      } finally {
        setLoading(false);
      }
    };

    fetchProcedure();
  }, [id, user]);

  const updateStatus = async (status: string, actionName: string, reason = '') => {
    if (!procedure) {
      return;
    }

    setActionLoading(actionName);
    setError('');

    try {
      const response = await apiFetch(`/api/procedures/${procedure.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ statut: status, ...(reason ? { motif_refus: reason } : {}) }),
      });
      const updatedProcedure = await readJsonResponse<ProcedureRecord>(response);
      setProcedure(updatedProcedure);
      setShowRejectionForm(false);
      setRejectionReason('');
    } catch {
      setError(`Unable to ${actionName.toLowerCase()} this procedure.`);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteProcedure = async () => {
    if (!procedure) {
      return;
    }

    setActionLoading('Delete');
    setError('');

    try {
      const response = await apiFetch(`/api/procedures/${procedure.id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      navigate('/procedures', { replace: true });
    } catch {
      setError('Unable to delete this procedure.');
      setActionLoading(null);
    }
  };

  const uploadDocuments = async () => {
    if (!procedure || selectedFiles.length === 0) {
      return;
    }

    setActionLoading('Upload');
    setError('');

    try {
      await Promise.all(
        selectedFiles.map((file) => {
          const documentData = new FormData();
          documentData.append('procedure', String(procedure.id));
          documentData.append('fichier', file);

          return apiFetch('/api/documents/', {
            method: 'POST',
            body: documentData,
          }).then((response) => {
            if (!response.ok) {
              throw new Error('Upload failed');
            }
          });
        })
      );

      const response = await apiFetch(`/api/documents/?procedure=${procedure.id}`);
      const data = await readJsonResponse<DocumentRecord[]>(response);
      setDocuments(data);
      setSelectedFiles([]);
    } catch {
      setError('Unable to upload one or more documents.');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteDocument = async (document: DocumentRecord) => {
    setActionLoading(`Delete document ${document.id}`);
    setError('');

    try {
      const response = await apiFetch(`/api/documents/${document.id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setDocuments((currentDocuments) => currentDocuments.filter((item) => item.id !== document.id));
    } catch {
      setError('Unable to delete this document.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading procedure...</p>;
  }

  if (error && !procedure) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!procedure) {
    return <p className="text-sm text-slate-600">Procedure not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{procedure.titre}</h1>
            <p className="mt-2 text-sm text-slate-600">Detailed view of the selected procedure.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canApproveProcedure(user, procedure) && (
              <button
                type="button"
                onClick={() => updateStatus(PROCEDURE_STATUS.PUBLISHED, 'Approve')}
                disabled={actionLoading !== null}
                className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === 'Approve' ? 'Approving...' : 'Approve'}
              </button>
            )}
            {canRejectProcedure(user, procedure) && (
              <button
                type="button"
                onClick={() => setShowRejectionForm(true)}
                disabled={actionLoading !== null}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === 'Reject' ? 'Rejecting...' : 'Reject'}
              </button>
            )}
            {canEditProcedure(user, procedure) && (
              <Link
                to={`/procedures/${procedure.id}/edit`}
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Edit
              </Link>
            )}
            <Link
              to={`/procedures/${procedure.id}/history`}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              History
            </Link>
            {canDeleteProcedure(user, procedure) && (
              <button
                type="button"
                onClick={deleteProcedure}
                disabled={actionLoading !== null}
                className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === 'Delete' ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {showRejectionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">Reject procedure</h2>
            <p className="mt-2 text-sm text-slate-600">Explain why this procedure is being rejected.</p>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={5}
              placeholder="Write the rejection reason..."
              className="mt-4 block w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRejectionForm(false)}
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateStatus(PROCEDURE_STATUS.REJECTED, 'Reject', rejectionReason.trim())}
                disabled={!rejectionReason.trim() || actionLoading !== null}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reject procedure
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Status</h2>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{getProcedureStatusLabel(procedure)}</p>
          <p className="mt-2 text-sm text-slate-600">Version {procedure.version || '1.0'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h2>
          <p className="mt-4 text-slate-700">
            {procedure.description || 'No description has been added for this procedure.'}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Key details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Last modified</p>
            <p className="mt-2 text-sm text-slate-600">{formatDate(procedure.date_modification)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Owner</p>
            <p className="mt-2 text-sm text-slate-600">{procedure.createur_username || 'Not assigned'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Category</p>
            <p className="mt-2 text-sm text-slate-600">{getCategoryLabel(procedure.categorie_nom) || 'Not assigned'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Workflow</p>
            <p className="mt-2 text-sm text-slate-600">
              {canApproveProcedure(user, procedure)
                ? 'Waiting for admin approval'
                : getProcedureStatusLabel(procedure)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Attached documents</h2>
            <p className="mt-1 text-sm text-slate-600">Files linked directly to this procedure.</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {documents.length === 0 && <p className="text-sm text-slate-600">No documents attached yet.</p>}
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {document.nom_fichier || document.fichier || `Document ${document.id}`}
                </p>
                <p className="mt-1 text-sm text-slate-600">Added {formatDate(document.date_ajout)}</p>
              </div>
              <div className="flex gap-2">
                {(document.fichier_url || document.fichier) && (
                  <a
                    href={document.fichier_url || document.fichier}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open
                  </a>
                )}
                {canEditProcedure(user, procedure) && (
                  <button
                    type="button"
                    onClick={() => deleteDocument(document)}
                    disabled={actionLoading !== null}
                    className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {canEditProcedure(user, procedure) && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <label htmlFor="detail-documents" className="block text-sm font-medium text-slate-700">
              Add more documents
            </label>
            <input
              id="detail-documents"
              name="detail-documents"
              type="file"
              multiple
              accept={ACCEPTED_DOCUMENT_TYPES}
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
              className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">{selectedFiles.length} file(s) selected.</p>
                <button
                  type="button"
                  onClick={uploadDocuments}
                  disabled={actionLoading !== null}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading === 'Upload' ? 'Uploading...' : 'Upload documents'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcedureDetailsPage;
