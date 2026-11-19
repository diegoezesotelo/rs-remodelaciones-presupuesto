import type { User } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  TASK_CATALOG,
  type TaskItemId,
} from '../types/budget';
import { db, handleFirestoreError, OperationType } from './firebase';

export const OWNER_EMAILS = [
  'rs.remodela@gmail.com',
  'diegoeze.sotelo@gmail.com',
] as const;

export type PricingMap = Record<TaskItemId, number>;

const PRICING_DOC_PATH = 'settings/pricing';

export function isOwnerEmail(
  email?: string | null,
  emailVerified?: boolean | null
): boolean {
  if (!email || emailVerified === false) return false;
  const normalized = email.trim().toLowerCase();
  return OWNER_EMAILS.some((allowed) => allowed === normalized);
}

export function getDefaultPricingMap(): PricingMap {
  const map = {} as PricingMap;
  for (const item of TASK_CATALOG) {
    map[item.id] = item.unitPrice;
  }
  return map;
}

export function sanitizePrice(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100_000_000, Math.max(0, Math.round(value)));
}

export function subscribeGlobalPricing(
  onPrices: (prices: PricingMap) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const pricingRef = doc(db, 'settings', 'pricing');

  return onSnapshot(
    pricingRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onPrices(getDefaultPricingMap());
        return;
      }

      const data = snapshot.data() as Record<string, unknown>;
      const merged = getDefaultPricingMap();

      for (const item of TASK_CATALOG) {
        const rawVal = data[item.id];
        if (typeof rawVal === 'number' && Number.isFinite(rawVal) && rawVal >= 0) {
          merged[item.id] = sanitizePrice(rawVal);
        }
      }

      onPrices(merged);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, PRICING_DOC_PATH);
      } catch (wrappedError) {
        if (onError && wrappedError instanceof Error) {
          onError(wrappedError);
        }
      }
    }
  );
}

export async function saveGlobalPricing(
  prices: PricingMap,
  ownerUser: User
): Promise<void> {
  if (!isOwnerEmail(ownerUser.email, ownerUser.emailVerified)) {
    throw new Error('Tu cuenta no tiene permisos para modificar los precios.');
  }

  const pricingRef = doc(db, 'settings', 'pricing');
  const payload = {
    pintura_interior: sanitizePrice(prices.pintura_interior),
    pintura_exterior: sanitizePrice(prices.pintura_exterior),
    durlock_tabique: sanitizePrice(prices.durlock_tabique),
    porcelanato: sanitizePrice(prices.porcelanato),
    albanileria: sanitizePrice(prices.albanileria),
    electricidad: sanitizePrice(prices.electricidad),
    plomeria: sanitizePrice(prices.plomeria),
    bano_completo: sanitizePrice(prices.bano_completo),
    cocina_completa: sanitizePrice(prices.cocina_completa),
    limpieza_final: sanitizePrice(prices.limpieza_final),
    retiro_escombros: sanitizePrice(prices.retiro_escombros),
    updatedAt: serverTimestamp(),
    updatedBy: ownerUser.uid,
  };

  try {
    await setDoc(pricingRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRICING_DOC_PATH);
  }
}
