import { AuthUser } from '../auth/useAuth';

export const PROCEDURE_STATUS = {
  DRAFT: 'brouillon',
  PUBLISHED: 'valid\u00e9',
  REJECTED: 'refus\u00e9',
} as const;

export type ProcedureStatus = (typeof PROCEDURE_STATUS)[keyof typeof PROCEDURE_STATUS] | string;

export interface ProcedureRecord {
  id: number;
  titre: string;
  description?: string;
  categorie?: number;
  categorie_nom?: string;
  createur?: number | null;
  createur_username?: string | null;
  date_creation?: string;
  date_modification?: string;
  statut?: ProcedureStatus;
  version?: number;
}

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'Infrastructure et réseaux': 'Infrastructure and Networks',
  "Systèmes d’exploitation aéroportuaire": 'Airport Operations Systems',
  'Applications passagers': 'Passenger Applications',
  'Sécurité et cybersécurité': 'Security and Cybersecurity',
  'Données et analytique': 'Data and Analytics',
  'Support IT / helpdesk': 'IT Support / Helpdesk',
  'Conformité et gouvernance': 'Compliance and Governance',
  'Projets et gestion du changement': 'Projects and Change Management',
  'Télécoms et communications': 'Telecommunications and Communications',
  'Maintenance et supervision': 'Maintenance and Monitoring',
};

export const getCategoryLabel = (name?: string) => {
  if (!name) {
    return '';
  }

  return CATEGORY_TRANSLATIONS[name] || name;
};

export const isAdminUser = (user: AuthUser | null | undefined) => {
  return user?.role === 'admin' || user?.isStaff === true;
};

const normalizeStatus = (value?: string) => {
  if (!value) {
    return '';
  }

  return value.toString().trim().toLowerCase();
};

export const isDraftProcedure = (procedure: Pick<ProcedureRecord, 'statut'>) => {
  const status = normalizeStatus(procedure.statut);
  return status === normalizeStatus(PROCEDURE_STATUS.DRAFT) || status === 'draft';
};

export const isPublishedProcedure = (procedure: Pick<ProcedureRecord, 'statut'>) => {
  const status = normalizeStatus(procedure.statut);
  return (
    status === normalizeStatus(PROCEDURE_STATUS.PUBLISHED) ||
    status === 'published' ||
    status === 'valid' ||
    status === 'accepted' ||
    status === 'accepté'
  );
};

export const isRejectedProcedure = (procedure: Pick<ProcedureRecord, 'statut'>) => {
  const status = normalizeStatus(procedure.statut);
  return (
    status === normalizeStatus(PROCEDURE_STATUS.REJECTED) ||
    status === 'rejected' ||
    status === 'refused'
  );
};

export const isProcedureOwner = (
  user: AuthUser | null | undefined,
  procedure: Pick<ProcedureRecord, 'createur'>
) => {
  return Boolean(user?.id && procedure.createur && String(procedure.createur) === String(user.id));
};

export const canViewProcedure = (user: AuthUser | null | undefined, procedure: ProcedureRecord) => {
  return (
    isAdminUser(user) ||
    isPublishedProcedure(procedure) ||
    (isProcedureOwner(user, procedure) && isDraftProcedure(procedure))
  );
};

export const canCreateProcedure = (user: AuthUser | null | undefined) => {
  return Boolean(user);
};

export const canEditProcedure = (user: AuthUser | null | undefined, procedure: ProcedureRecord) => {
  return isAdminUser(user) || (isProcedureOwner(user, procedure) && isDraftProcedure(procedure));
};

export const canDeleteProcedure = (user: AuthUser | null | undefined, procedure: ProcedureRecord) => {
  return isAdminUser(user) && isPublishedProcedure(procedure);
};

export const canApproveProcedure = (user: AuthUser | null | undefined, procedure: ProcedureRecord) => {
  return isAdminUser(user) && isDraftProcedure(procedure);
};

export const canRejectProcedure = (user: AuthUser | null | undefined, procedure: ProcedureRecord) => {
  return isAdminUser(user) && isDraftProcedure(procedure);
};

export const getProcedureStatusLabel = (procedure: Pick<ProcedureRecord, 'statut'>) => {
  if (isPublishedProcedure(procedure)) {
    return 'Published';
  }

  if (isDraftProcedure(procedure)) {
    return 'Draft';
  }

  if (isRejectedProcedure(procedure)) {
    return 'Rejected';
  }

  const normalizedStatus = normalizeStatus(procedure.statut);
  if (normalizedStatus === 'validé' || normalizedStatus === 'valide' || normalizedStatus === 'accepté') {
    return 'Published';
  }

  if (normalizedStatus === 'brouillon') {
    return 'Draft';
  }

  if (normalizedStatus === 'refusé' || normalizedStatus === 'refuse') {
    return 'Rejected';
  }

  return 'Unknown';
};
