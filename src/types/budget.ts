export const WHATSAPP_PHONE = '5491127536564';
export const WHATSAPP_DISPLAY = '+54 9 11 2753-6564';
export const RS_GMAIL_EMAIL = 'rs.remodela@gmail.com';
export const INSTAGRAM_HANDLE = 'rs.remodelaciones';
export const INSTAGRAM_URL = 'https://www.instagram.com/rs.remodelaciones/';

export type TaskItemId =
  | 'pintura_interior'
  | 'pintura_exterior'
  | 'durlock_tabique'
  | 'porcelanato'
  | 'albanileria'
  | 'electricidad'
  | 'plomeria'
  | 'bano_completo'
  | 'cocina_completa'
  | 'limpieza_final'
  | 'retiro_escombros';

export type TaskCategory = 'superficie' | 'instalaciones' | 'ambientes' | 'servicios';

export interface TaskCatalogItem {
  id: TaskItemId;
  label: string;
  category: TaskCategory;
  unitPrice: number;
  unitLabel: string;
  unitShort: string;
  description: string;
  defaultQty: number;
  isFixedToggle?: boolean;
}

export const TASK_CATALOG: TaskCatalogItem[] = [
  {
    id: 'pintura_interior',
    label: 'Pintura interior',
    category: 'superficie',
    unitPrice: 16_000,
    unitLabel: 'por m²',
    unitShort: 'm²',
    description: 'Preparación de paredes y aplicación de látex interior.',
    defaultQty: 20,
  },
  {
    id: 'pintura_exterior',
    label: 'Pintura exterior',
    category: 'superficie',
    unitPrice: 20_000,
    unitLabel: 'por m²',
    unitShort: 'm²',
    description: 'Impermeabilización y pintura acrílica para exteriores.',
    defaultQty: 20,
  },
  {
    id: 'durlock_tabique',
    label: 'Durlock Tabique',
    category: 'superficie',
    unitPrice: 25_000,
    unitLabel: 'por m²',
    unitShort: 'm²',
    description: 'Estructura galvanizada, emplacado y tomado de juntas.',
    defaultQty: 12,
  },
  {
    id: 'porcelanato',
    label: 'Revestimiento Porcelanato',
    category: 'superficie',
    unitPrice: 50_000,
    unitLabel: 'por m²',
    unitShort: 'm²',
    description: 'Colocación de porcelanato, nivelación y pastinado.',
    defaultQty: 15,
  },
  {
    id: 'albanileria',
    label: 'Albañilería general',
    category: 'superficie',
    unitPrice: 40_000,
    unitLabel: 'por m²',
    unitShort: 'm²',
    description: 'Revoques, carpetas, mampostería y nivelaciones.',
    defaultQty: 12,
  },
  {
    id: 'electricidad',
    label: 'Electricidad',
    category: 'instalaciones',
    unitPrice: 35_000,
    unitLabel: 'por boca',
    unitShort: 'bocas',
    description: 'Cableado normalizado, cajas, tomas y puntos de luz.',
    defaultQty: 6,
  },
  {
    id: 'plomeria',
    label: 'Plomería',
    category: 'instalaciones',
    unitPrice: 45_000,
    unitLabel: 'por punto',
    unitShort: 'puntos',
    description: 'Termofusión agua fría/caliente y desagües sanitarios.',
    defaultQty: 4,
  },
  {
    id: 'bano_completo',
    label: 'Baño completo',
    category: 'ambientes',
    unitPrice: 3_000_000,
    unitLabel: 'por unidad',
    unitShort: 'unid.',
    description: 'Reforma integral de baño.',
    defaultQty: 1,
  },
  {
    id: 'cocina_completa',
    label: 'Cocina completa',
    category: 'ambientes',
    unitPrice: 3_000_000,
    unitLabel: 'por unidad',
    unitShort: 'unid.',
    description: 'Reforma integral de cocina.',
    defaultQty: 1,
  },
  {
    id: 'limpieza_final',
    label: 'Limpieza final',
    category: 'servicios',
    unitPrice: 300_000,
    unitLabel: 'servicio fijo',
    unitShort: 'serv.',
    description: 'Limpieza profunda de obra lista para habitar.',
    defaultQty: 1,
    isFixedToggle: true,
  },
  {
    id: 'retiro_escombros',
    label: 'Retiro de escombros',
    category: 'servicios',
    unitPrice: 180_000,
    unitLabel: 'por retiro',
    unitShort: 'ret.',
    description: 'Embolsado, carga y disposición en volquete.',
    defaultQty: 1,
  },
];

export interface TaskSelectionState {
  enabled: boolean;
  quantity: number;
  unitPrice: number;
}

export type TasksStateMap = Record<TaskItemId, TaskSelectionState>;

export interface UploadedPhoto {
  id: string;
  name: string;
  sizeLabel: string;
  previewUrl: string;
}

export function formatARS(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('es-AR');
}
