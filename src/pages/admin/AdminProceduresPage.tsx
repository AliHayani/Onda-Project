import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import {
  canApproveProcedure,
  canDeleteProcedure,
  canRejectProcedure,
  getCategoryLabel,
  getProcedureStatusLabel,
  PROCEDURE_STATUS,
  ProcedureRecord,
} from '../../features/procedures/rbac';
import { apiFetch, readJsonResponse } from '../../lib/api';

type CategoryRecord = {
  id: number;
  nom: string;
};

const AdminProceduresPage: React.FC = () => {
  const { user } = useAuth();
  const [procedures, setProcedures] = useState<ProcedureRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateOrder, setDateOrder] = useState<'latest' | 'earliest'>('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejectionCandidate, setRejectionCandidate] = useState<ProcedureRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const categoryOptions = useMemo(
    () => [{ id: 0, nom: 'All categories' }, ...categories],
    [categories]
  );

  const loadCategories = async () => {
    try {
      const response = await apiFetch('/api/categories/');
      const data = await readJsonResponse<CategoryRecord[]>(response);
      setCategories(data);
    } catch {
      setCategories([]);
    }
  };

  const applyProcedureFilters = (procedures: ProcedureRecord[]) => {
    const filtered = procedures.filter((procedure) => {
      if (!selectedCategory) {
        return true;
      }

      return String(procedure.categorie) === selectedCategory;
    });

    return filtered.sort((a, b) => {
      const dateA = a.date_creation ? new Date(a.date_creation).getTime() : 0;
      const dateB = b.date_creation ? new Date(b.date_creation).getTime() : 0;

      if (dateA !== dateB) {
        return dateOrder === 'earliest' ? dateA - dateB : dateB - dateA;
      }

      return dateOrder === 'earliest'
        ? (a.id ?? 0) - (b.id ?? 0)
        : (b.id ?? 0) - (a.id ?? 0);
    });
  };

  const loadProcedures = async () => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory) {
        queryParams.set('categorie', selectedCategory);
      }
      queryParams.set('date_order', dateOrder);

      const url = `/api/procedures/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiFetch(url);
      const data = await readJsonResponse<ProcedureRecord[]>(response);
      setProcedures(applyProcedureFilters(data));
    } catch {
      setError('Unable to load procedures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProcedures();
  }, [selectedCategory, dateOrder]);

  const updateStatus = async (procedure: ProcedureRecord, status: string) => {
    setActionId(procedure.id);
    setError('');

    try {
      const response = await apiFetch(`/api/procedures/${procedure.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ statut: status }),
      });
      const updatedProcedure = await readJsonResponse<ProcedureRecord>(response);
      setProcedures((currentProcedures) =>
        currentProcedures.map((item) => (item.id === updatedProcedure.id ? updatedProcedure : item))
      );
    } catch {
      setError('Unable to update this procedure.');
    } finally {
      setActionId(null);
    }
  };

  const rejectProcedure = async () => {
    if (!rejectionCandidate || !rejectionReason.trim()) {
      return;
    }

    setActionId(rejectionCandidate.id);
    setError('');
    try {
      const response = await apiFetch(`/api/procedures/${rejectionCandidate.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          statut: PROCEDURE_STATUS.REJECTED,
          motif_refus: rejectionReason.trim(),
        }),
      });
      const updatedProcedure = await readJsonResponse<ProcedureRecord>(response);
      setProcedures((currentProcedures) =>
        currentProcedures.map((item) => (item.id === updatedProcedure.id ? updatedProcedure : item))
      );
      setRejectionCandidate(null);
      setRejectionReason('');
    } catch {
      setError('Unable to reject this procedure.');
    } finally {
      setActionId(null);
    }
  };

  const deleteProcedure = async (procedure: ProcedureRecord) => {
    setActionId(procedure.id);
    setError('');

    try {
      const response = await apiFetch(`/api/procedures/${procedure.id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setProcedures((currentProcedures) => currentProcedures.filter((item) => item.id !== procedure.id));
    } catch {
      setError('Unable to delete this procedure.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin procedures</h1>
            <p className="mt-2 text-sm text-slate-600">Review drafts and manage procedure workflow status.</p>
          </div>
          <Link
            to="/procedures/new"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            New procedure
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <label htmlFor="admin-categorie-filter" className="block text-sm font-medium text-slate-700">
              Filter by category
            </label>
            <select
              id="admin-categorie-filter"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id ? String(category.id) : ''}>
                  {getCategoryLabel(category.nom)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="admin-date-order" className="block text-sm font-medium text-slate-700">
              Sort by creation date
            </label>
            <select
              id="admin-date-order"
              value={dateOrder}
              onChange={(event) => setDateOrder(event.target.value as 'latest' | 'earliest')}
              className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="latest">Newest first</option>
              <option value="earliest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-600">Loading procedures...</p>
        ) : (
          <div className="grid gap-4">
            {procedures.length === 0 && <p className="text-sm text-slate-600">No procedures available.</p>}
            {procedures.map((procedure) => (
              <div
                key={procedure.id}
                className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{procedure.titre}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {getProcedureStatusLabel(procedure)}
                    {procedure.version ? ` v${procedure.version}` : ''}
                  </p>
                  <p className="text-sm text-slate-500">Category: {getCategoryLabel(procedure.categorie_nom) || 'Not assigned'}</p>
                  <p className="text-sm text-slate-500">Created: {procedure.date_creation || 'N/A'}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canApproveProcedure(user, procedure) && (
                    <button
                      type="button"
                      onClick={() => updateStatus(procedure, PROCEDURE_STATUS.PUBLISHED)}
                      disabled={actionId !== null}
                      className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Approve
                    </button>
                  )}
                  {canRejectProcedure(user, procedure) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRejectionCandidate(procedure);
                        setRejectionReason('');
                      }}
                      disabled={actionId !== null}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  )}
                  <Link
                    to={`/procedures/${procedure.id}`}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Review
                  </Link>
                  <Link
                    to={`/procedures/${procedure.id}/edit`}
                    className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                  >
                    Edit
                  </Link>
                  {canDeleteProcedure(user, procedure) && (
                    <button
                      type="button"
                      onClick={() => deleteProcedure(procedure)}
                      disabled={actionId !== null}
                      className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectionCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">Reject procedure</h2>
            <p className="mt-2 text-sm text-slate-600">Explain why “{rejectionCandidate.titre}” is being rejected.</p>
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
                onClick={() => setRejectionCandidate(null)}
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={rejectProcedure}
                disabled={!rejectionReason.trim() || actionId !== null}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reject procedure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProceduresPage;
