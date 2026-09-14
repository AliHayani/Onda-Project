import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import {
  canEditProcedure,
  canViewProcedure,
  getCategoryLabel,
  getProcedureStatusLabel,
  ProcedureRecord,
} from '../../features/procedures/rbac';
import { apiFetch, readJsonResponse } from '../../lib/api';

type CategoryRecord = {
  id: number;
  nom: string;
};

const ProcedureListPage: React.FC = () => {
  const { user } = useAuth();
  const [procedures, setProcedures] = useState<ProcedureRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateOrder, setDateOrder] = useState<'latest' | 'earliest'>('latest');
  const [loading, setLoading] = useState(true);

  const categoryOptions = useMemo(
    () => [{ id: 0, nom: 'All categories' }, ...categories],
    [categories]
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiFetch('/api/categories/');
        const data = await readJsonResponse<CategoryRecord[]>(response);
        setCategories(data);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

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

  useEffect(() => {
    const fetchProcedures = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory) {
          queryParams.set('categorie', selectedCategory);
        }
        queryParams.set('date_order', dateOrder);

        const url = `/api/procedures/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await apiFetch(url);
        const data = await readJsonResponse<ProcedureRecord[]>(res);
        setProcedures(applyProcedureFilters(data).filter((procedure) => canViewProcedure(user, procedure)));
      } catch {
        setProcedures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProcedures();
  }, [user, selectedCategory, dateOrder]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Procedures</h1>
            <p className="mt-2 text-sm text-slate-600">Browse and manage your procedure records.</p>
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
            <label htmlFor="categorie-filter" className="block text-sm font-medium text-slate-700">
              Filter by category
            </label>
            <select
              id="categorie-filter"
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
            <label htmlFor="date-order" className="block text-sm font-medium text-slate-700">
              Sort by creation date
            </label>
            <select
              id="date-order"
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

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid gap-4">
            {procedures.length === 0 && <p className="text-sm text-slate-600">No procedures available.</p>}
            {procedures.map((procedure) => (
              <div key={procedure.id} className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{procedure.titre}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {getProcedureStatusLabel(procedure)}
                    {procedure.version ? ` v${procedure.version}` : ''}
                  </p>
                  <p className="text-sm text-slate-500">Category: {getCategoryLabel(procedure.categorie_nom) || 'Unknown'}</p>
                  <p className="text-sm text-slate-500">Created: {procedure.date_creation || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/procedures/${procedure.id}`}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View
                  </Link>
                  {canEditProcedure(user, procedure) && (
                    <Link
                      to={`/procedures/${procedure.id}/edit`}
                      className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcedureListPage;
