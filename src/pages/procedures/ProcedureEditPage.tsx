import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import {
  canCreateProcedure,
  canEditProcedure,
  getProcedureStatusLabel,
  isAdminUser,
  PROCEDURE_STATUS,
  ProcedureRecord,
} from '../../features/procedures/rbac';
import { apiFetch, readJsonResponse } from '../../lib/api';

type CategoryRecord = {
  id: number;
  nom: string;
};

const ACCEPTED_DOCUMENT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.odt,.ods';

type ProcedureFormState = {
  titre: string;
  description: string;
  categorie: string;
  statut: string;
  version: string;
};

const defaultFormState: ProcedureFormState = {
  titre: '',
  description: '',
  categorie: '',
  statut: PROCEDURE_STATUS.DRAFT,
  version: '1.0',
};

const ProcedureEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreateMode = !id;
  const isAdmin = isAdminUser(user);
  const [form, setForm] = useState<ProcedureFormState>(defaultFormState);
  const [procedure, setProcedure] = useState<ProcedureRecord | null>(null);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const pageTitle = isCreateMode ? 'Create procedure' : 'Edit procedure';
  const submitLabel = isCreateMode ? 'Create procedure' : 'Save changes';

  const canUseForm = useMemo(() => {
    if (isCreateMode) {
      return canCreateProcedure(user);
    }

    return procedure ? canEditProcedure(user, procedure) : false;
  }, [isCreateMode, procedure, user]);

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

  useEffect(() => {
    const loadProcedure = async () => {
      if (isCreateMode || !id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await apiFetch(`/api/procedures/${id}/`);
        const data = await readJsonResponse<ProcedureRecord>(response);
        setProcedure(data);
        setForm({
          titre: data.titre || '',
          description: data.description || '',
          categorie: data.categorie ? String(data.categorie) : '',
          statut: data.statut || PROCEDURE_STATUS.DRAFT,
          version: data.version ? String(data.version) : '1.0',
        });
      } catch {
        setError('Unable to load this procedure.');
      } finally {
        setLoading(false);
      }
    };

    loadProcedure();
  }, [id, isCreateMode]);

  const updateField = (field: keyof ProcedureFormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const uploadDocuments = async (procedureId: number) => {
    await Promise.all(
      selectedFiles.map((file) => {
        const documentData = new FormData();
        documentData.append('procedure', String(procedureId));
        documentData.append('fichier', file);

        return apiFetch('/api/documents/', {
          method: 'POST',
          body: documentData,
        }).then((response) => {
          if (!response.ok) {
            throw new Error('Document upload failed');
          }
        });
      })
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canUseForm) {
      setError('You are not allowed to save this procedure.');
      return;
    }

    if (!form.categorie) {
      setError('Veuillez sélectionner une catégorie.');
      return;
    }

    setSaving(true);
    setError('');

    const payload: Record<string, string | number> = {
      titre: form.titre.trim(),
      description: form.description.trim(),
      categorie: Number(form.categorie),
    };

    if (isAdmin) {
      payload.statut = form.statut;
      payload.version = Number(form.version || '1.0');
    }

    try {
      const response = await apiFetch(isCreateMode ? '/api/procedures/' : `/api/procedures/${id}/`, {
        method: isCreateMode ? 'POST' : 'PATCH',
        body: JSON.stringify(payload),
      });
      const savedProcedure = await readJsonResponse<ProcedureRecord>(response);
      if (selectedFiles.length > 0) {
        await uploadDocuments(savedProcedure.id);
      }
      navigate(isAdmin ? `/procedures/${savedProcedure.id}` : `/procedures/${savedProcedure.id}/edit`, {
        replace: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save this procedure.';
      setError(message || 'Unable to save this procedure.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading procedure...</p>;
  }

  if (!canUseForm) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          You are not allowed to {isCreateMode ? 'create' : 'edit'} this procedure.
        </div>
        <Link
          to="/procedures"
          className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Back to procedures
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{pageTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {isAdmin
            ? 'Administrators can save drafts, publish directly, or reject procedures.'
            : 'Your procedure will be saved as a draft for administrator review.'}
        </p>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor="titre" className="block text-sm font-medium text-slate-700">
              Procedure title
            </label>
            <input
              id="titre"
              name="titre"
              type="text"
              value={form.titre}
              onChange={(event) => updateField('titre', event.target.value)}
              className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              required
            />
          </div>

          <div>
            <label htmlFor="categorie" className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="categorie"
              name="categorie"
              value={form.categorie}
              onChange={(event) => updateField('categorie', event.target.value)}
              className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nom}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="mt-2 text-sm text-rose-600">
                Aucune catégorie n’est disponible.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor="statut" className="block text-sm font-medium text-slate-700">
              Status
            </label>
            {isAdmin ? (
              <select
                id="statut"
                name="statut"
                value={form.statut}
                onChange={(event) => updateField('statut', event.target.value)}
                className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value={PROCEDURE_STATUS.DRAFT}>Draft</option>
                <option value={PROCEDURE_STATUS.PUBLISHED}>Published</option>
                <option value={PROCEDURE_STATUS.REJECTED}>Rejected</option>
              </select>
            ) : (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                {getProcedureStatusLabel({ statut: PROCEDURE_STATUS.DRAFT })}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="version" className="block text-sm font-medium text-slate-700">
              Version
            </label>
            <input
              id="version"
              name="version"
              type="number"
              min="1"
              step="0.1"
              value={form.version}
              onChange={(event) => updateField('version', event.target.value)}
              disabled={!isAdmin}
              className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Summary
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={5}
            className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label htmlFor="documents" className="block text-sm font-medium text-slate-700">
            Attach documents
          </label>
          <input
            id="documents"
            name="documents"
            type="file"
            multiple
            accept={ACCEPTED_DOCUMENT_TYPES}
            onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm file:mr-4 file:rounded-2xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
          />
          {selectedFiles.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {selectedFiles.map((file) => (
                <li key={`${file.name}-${file.size}`} className="rounded-2xl bg-white px-4 py-2">
                  {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(isCreateMode ? '/procedures' : `/procedures/${id}`)}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProcedureEditPage;
