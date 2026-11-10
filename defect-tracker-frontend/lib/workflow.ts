/**
 * The return-case workflow as the interface sees it: the five stages in
 * order, how each one looks, and who may do what.
 *
 * The backend enforces the same rules (see workflow.py and seed.py there).
 * These helpers only decide which buttons to offer; they are not security.
 */
import { ApiError, api, errorMessage } from './api';

export type StageKey = 'teslim_alindi' | 'teknik_inceleme' | 'odeme_tahsilati' | 'kargoya_verildi' | 'tamamlandi';

export interface Stage {
  key: StageKey;
  /** URL part used by the API: /returns/<id>/<slug> */
  slug: string;
  /** The value of a case's `status` while it is at this stage. */
  status: string;
  /** The stage's name in buttons and dialogs. */
  title: string;
  icon: string;
  /** Who may edit the stage's fields: holders of this permission... */
  editPermission?: string;
  /** ...or, for the one stage with no edit permission, this role. */
  editRole?: string;
  /** Who may complete the stage. */
  completePermission: string;
  /** Tailwind classes, written out in full so the build keeps them. */
  tone: {
    text: string;        // status text and column headings
    row: string;         // table row / card background
    chip: string;        // status pill on the mobile card
    panel: string;       // the stage's box on the tablet card
    label: string;       // the stage's name on the tablet card
    edit: string;        // edit button when usable
    editHover: string;   // its hover background in the table
    editHoverCard: string; // ...and on a card
    dialog: string;      // completion dialog frame
    dialogButton: string; // completion dialog confirm button
  };
}

export const STAGES: Stage[] = [
  {
    key: 'teslim_alindi', slug: 'teslim-alindi', status: 'Teslim Alındı', title: 'Teslim Alındı', icon: '📦',
    editPermission: 'CASE_EDIT_DELIVERED', completePermission: 'CASE_COMPLETE_DELIVERED',
    tone: {
      text: 'text-orange-700', row: 'bg-orange-50 hover:bg-orange-100', chip: 'bg-orange-100 text-orange-800',
      panel: 'bg-orange-50', label: 'text-orange-700',
      edit: 'text-orange-600 hover:text-orange-800', editHover: 'hover:bg-orange-50', editHoverCard: 'hover:bg-orange-100',
      dialog: 'bg-orange-50 border-orange-200 text-orange-800',
      dialogButton: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    },
  },
  {
    key: 'teknik_inceleme', slug: 'teknik-inceleme', status: 'Teknik İnceleme', title: 'Teknik İnceleme', icon: '🔧',
    editPermission: 'CASE_EDIT_TECHNICAL_REVIEW', completePermission: 'CASE_COMPLETE_TECHNICAL_REVIEW',
    tone: {
      text: 'text-blue-800', row: 'bg-blue-50 hover:bg-blue-100', chip: 'bg-blue-100 text-blue-800',
      panel: 'bg-blue-50', label: 'text-blue-800',
      edit: 'text-blue-600 hover:text-blue-800', editHover: 'hover:bg-blue-50', editHoverCard: 'hover:bg-blue-100',
      dialog: 'bg-blue-50 border-blue-200 text-blue-800',
      dialogButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
  },
  {
    key: 'odeme_tahsilati', slug: 'odeme-tahsilati', status: 'Ödeme Tahsilatı', title: 'Ödeme Tahsilatı', icon: '📋',
    editPermission: 'CASE_EDIT_PAYMENT_COLLECTION', completePermission: 'CASE_COMPLETE_PAYMENT_COLLECTION',
    tone: {
      text: 'text-yellow-800', row: 'bg-yellow-50 hover:bg-yellow-100', chip: 'bg-yellow-100 text-yellow-800',
      panel: 'bg-yellow-50', label: 'text-yellow-800',
      edit: 'text-yellow-600 hover:text-yellow-800', editHover: 'hover:bg-yellow-50', editHoverCard: 'hover:bg-yellow-100',
      dialog: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      dialogButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    },
  },
  {
    // The status reads "being shipped"; the stage itself is called "shipped".
    key: 'kargoya_verildi', slug: 'kargoya-verildi', status: 'Kargoya Veriliyor', title: 'Kargoya Verildi', icon: '🚚',
    editPermission: 'CASE_EDIT_SHIPPING', completePermission: 'CASE_COMPLETE_SHIPPING',
    tone: {
      text: 'text-purple-800', row: 'bg-purple-50 hover:bg-purple-100', chip: 'bg-purple-100 text-purple-800',
      panel: 'bg-purple-50', label: 'text-purple-800',
      edit: 'text-purple-600 hover:text-purple-800', editHover: 'hover:bg-purple-50', editHoverCard: 'hover:bg-purple-100',
      dialog: 'bg-purple-50 border-purple-200 text-purple-800',
      dialogButton: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    },
  },
  {
    key: 'tamamlandi', slug: 'tamamlandi', status: 'Tamamlandı', title: 'Tamamlandı', icon: '✅',
    editRole: 'MANAGER', completePermission: 'CASE_COMPLETE_COMPLETED',
    tone: {
      text: 'text-green-800', row: 'bg-green-50 hover:bg-green-100', chip: 'bg-green-100 text-green-800',
      panel: 'bg-gray-50', label: '',
      edit: 'text-gray-600 hover:text-gray-800', editHover: 'hover:bg-gray-100', editHoverCard: 'hover:bg-gray-100',
      dialog: 'bg-gray-50 border-gray-200 text-gray-800',
      dialogButton: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
    },
  },
];

const UNKNOWN_TONE = { text: 'text-gray-800', row: 'bg-gray-50 hover:bg-gray-100', chip: 'bg-gray-100 text-gray-800' };

export const stageByKey = (key: string): Stage | undefined => STAGES.find((stage) => stage.key === key);

/** The stage a case is currently at, from its `status`. */
export const stageOfStatus = (status: string): Stage | undefined => STAGES.find((stage) => stage.status === status);

/** Colours for a case, from its `status`. */
export const statusTone = (status: string) => stageOfStatus(status)?.tone ?? UNKNOWN_TONE;

const position = (status: string) => STAGES.findIndex((stage) => stage.status === status);

/** The case is at `stage` right now. */
export const isCurrentStage = (status: string, stage: Stage) => stage.status === status;

/** The case has moved past `stage`. */
export const isStageCompleted = (status: string, stage: Stage) => {
  const current = position(status);
  return current !== -1 && current > STAGES.indexOf(stage);
};

// --- Who may do what -----------------------------------------------------------

/** The signed-in user, as far as these rules care. */
export type Actor = { role: string; permissions: string[] } | null | undefined;

const holds = (user: Actor, permission: string) => !!user && user.permissions.includes(permission);

/** A stage's fields can be edited once the case has reached it, and after. */
export const canEditStage = (user: Actor, status: string, stage: Stage): boolean => {
  const current = position(status);
  if (!user || current === -1 || current < STAGES.indexOf(stage)) return false;
  return stage.editPermission ? holds(user, stage.editPermission) : user.role === stage.editRole;
};

/** A stage can be completed only while the case is at it. */
export const canCompleteStage = (user: Actor, status: string, stage: Stage): boolean =>
  isCurrentStage(status, stage) && holds(user, stage.completePermission);

const DELETABLE_STATUSES = ['Teslim Alındı', 'Teknik İnceleme'];
const ROLES_ALLOWED_TO_DELETE = ['SUPPORT', 'MANAGER', 'ADMIN'];

/** Cases can be deleted in their first two stages, by these roles. */
export const canDeleteCase = (user: Actor, status: string): boolean =>
  DELETABLE_STATUSES.includes(status) && !!user && ROLES_ALLOWED_TO_DELETE.includes(user.role);

/** Tooltip for the delete button, explaining why it may be unavailable. */
export const deleteHint = (user: Actor, status: string): string => {
  if (!DELETABLE_STATUSES.includes(status)) return 'Bu durumda silme yapılamaz';
  return canDeleteCase(user, status) ? 'Sil' : 'Sadece DESTEK, YÖNETİCİ veya ADMIN rolü silebilir';
};

/** The customer can be emailed once the case is finished, by whoever ships. */
export const canEmailCustomer = (user: Actor, status: string): boolean =>
  status === 'Tamamlandı' && holds(user, 'CASE_EDIT_SHIPPING');

// --- Completing a stage ----------------------------------------------------------

export const completeStage = async (
  caseId: number,
  stage: Stage,
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const data = await api.post<{ message: string }>(`/returns/${caseId}/complete-${stage.slug}`);
    return { success: true, message: data.message };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: errorMessage(error, 'Bir hata oluştu') };
    }
    return { success: false, error: 'Bağlantı hatası' };
  }
};
