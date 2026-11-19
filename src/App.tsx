import type { User } from 'firebase/auth';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Instagram,
  Lock,
  LogOut,
  Mail,
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BrandHeader } from './components/BrandHeader';
import { BudgetSummary } from './components/BudgetSummary';
import { GmailModal } from './components/GmailModal';
import { MaterialsCalculatorModal } from './components/MaterialsCalculatorModal';
import { OwnerAccessModal } from './components/OwnerAccessModal';
import { PhotoUploader } from './components/PhotoUploader';
import { PortfolioGallery } from './components/PortfolioGallery';
import {
  TaskByTaskBuilder,
  computeTaskSubtotal,
} from './components/TaskByTaskBuilder';
import { logout, subscribeAuthUser } from './lib/gmailAuth';
import {
  getDefaultPricingMap,
  isOwnerEmail,
  saveGlobalPricing,
  subscribeGlobalPricing,
  type PricingMap,
} from './lib/pricingService';
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  TASK_CATALOG,
  formatARS,
  type TaskItemId,
  type TasksStateMap,
  type UploadedPhoto,
} from './types/budget';

function createInitialTasksState(prices: PricingMap): TasksStateMap {
  const map = {} as TasksStateMap;
  for (const item of TASK_CATALOG) {
    map[item.id] = {
      enabled: item.id === 'pintura_interior',
      quantity: item.defaultQty,
      unitPrice: prices[item.id] ?? item.unitPrice,
    };
  }
  return map;
}

export default function App() {
  const [globalPrices, setGlobalPrices] = useState<PricingMap>(
    getDefaultPricingMap
  );
  const [tasks, setTasks] = useState<TasksStateMap>(() =>
    createInitialTasksState(getDefaultPricingMap())
  );
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [isMaterialsOpen, setIsMaterialsOpen] = useState<boolean>(false);
  const [isGmailOpen, setIsGmailOpen] = useState<boolean>(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [connectedGmail, setConnectedGmail] = useState<string | null>(null);
  const [attachedMaterialsLines, setAttachedMaterialsLines] = useState<
    string[] | null
  >(null);

  const [isSavingPrices, setIsSavingPrices] = useState<boolean>(false);
  const [priceSaveFeedback, setPriceSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const photoUrlsRef = useRef<string[]>([]);

  const isOwnerMode = isOwnerEmail(authUser?.email, authUser?.emailVerified);
  const [hasOwnerQueryFlag] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    return (
      params.has('dueno') ||
      params.has('admin') ||
      hash === '#dueno' ||
      hash === '#admin'
    );
  });
  const showOwnerTrigger = isOwnerMode || hasOwnerQueryFlag;

  useEffect(() => {
    const unsubscribeAuth = subscribeAuthUser((user) => {
      setAuthUser(user);
      if (!user || !isOwnerEmail(user.email, user.emailVerified)) {
        setConnectedGmail(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribePricing = subscribeGlobalPricing((incomingPrices) => {
      setGlobalPrices(incomingPrices);
      setTasks((prev) => {
        const next = {} as TasksStateMap;
        for (const item of TASK_CATALOG) {
          next[item.id] = {
            ...prev[item.id],
            unitPrice: incomingPrices[item.id] ?? item.unitPrice,
          };
        }
        return next;
      });
    });

    return () => unsubscribePricing();
  }, []);

  useEffect(() => {
    photoUrlsRef.current = photos.map((p) => p.previewUrl);
  }, [photos]);

  useEffect(() => {
    return () => {
      photoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const { budgetSummaryText, isBudgetReady } = useMemo(() => {
    const activeRows = TASK_CATALOG.filter((item) => tasks[item.id].enabled).map(
      (item) => {
        const state = tasks[item.id];
        const qtyText = item.isFixedToggle
          ? 'Servicio único'
          : `${state.quantity} ${item.unitShort}`;
        return {
          label: item.label,
          qtyText,
          subtotal: computeTaskSubtotal(state),
        };
      }
    );

    const total = activeRows.reduce((acc, r) => acc + r.subtotal, 0);
    const lines = [
      'Presupuesto Online — RS Remodelaciones:',
      ...activeRows.map(
        (row) => `• ${row.label} (${row.qtyText}): ${formatARS(row.subtotal)}`
      ),
      `• Total estimado (IVA incluido): ${formatARS(total)}`,
      ...(photos.length > 0
        ? [
            `• Fotos del ambiente: ${photos.length} ${
              photos.length === 1 ? 'foto adjunta' : 'fotos adjuntas'
            }`,
          ]
        : []),
      ...(attachedMaterialsLines ? ['', ...attachedMaterialsLines] : []),
      ...(notes.trim() ? [`• Comentarios: ${notes.trim()}`] : []),
      '',
      'RS Remodelaciones - Valentín Alsina, Buenos Aires',
    ];

    return {
      budgetSummaryText: lines.join('\n'),
      isBudgetReady: activeRows.length > 0 && total > 0,
    };
  }, [tasks, photos.length, attachedMaterialsLines, notes]);

  const handleToggleTask = (id: TaskItemId) => {
    setTasks((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        enabled: !prev[id].enabled,
      },
    }));
  };

  const handleUpdateTaskQty = (id: TaskItemId, qty: number) => {
    setTasks((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        quantity: qty,
      },
    }));
  };

  const handleUpdateTaskPrice = (id: TaskItemId, price: number) => {
    if (!isOwnerMode) return;
    setPriceSaveFeedback(null);
    setTasks((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        unitPrice: price,
      },
    }));
  };

  const handleResetTasks = () => {
    setTasks(() => {
      const empty = {} as TasksStateMap;
      for (const item of TASK_CATALOG) {
        empty[item.id] = {
          enabled: false,
          quantity: item.defaultQty,
          unitPrice: globalPrices[item.id] ?? item.unitPrice,
        };
      }
      return empty;
    });
  };

  const handleSaveGlobalPrices = async () => {
    if (!authUser || !isOwnerMode) return;
    setIsSavingPrices(true);
    setPriceSaveFeedback(null);

    const nextPrices = {} as PricingMap;
    for (const item of TASK_CATALOG) {
      nextPrices[item.id] = tasks[item.id].unitPrice;
    }

    try {
      await saveGlobalPricing(nextPrices, authUser);
      setPriceSaveFeedback({
        type: 'success',
        message: 'Precios guardados. Todos los clientes verán estos valores.',
      });
    } catch (error) {
      setPriceSaveFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No se pudieron guardar los precios.',
      });
    } finally {
      setIsSavingPrices(false);
    }
  };

  const handleRestoreBasePrices = () => {
    if (!isOwnerMode) return;
    setPriceSaveFeedback(null);
    const defaults = getDefaultPricingMap();
    setTasks((prev) => {
      const next = {} as TasksStateMap;
      for (const item of TASK_CATALOG) {
        next[item.id] = {
          ...prev[item.id],
          unitPrice: defaults[item.id],
        };
      }
      return next;
    });
  };

  const handleOwnerLogout = async () => {
    await logout();
    setIsGmailOpen(false);
    setConnectedGmail(null);
    setPriceSaveFeedback(null);
    setTasks((prev) => {
      const next = {} as TasksStateMap;
      for (const item of TASK_CATALOG) {
        next[item.id] = {
          ...prev[item.id],
          unitPrice: globalPrices[item.id] ?? item.unitPrice,
        };
      }
      return next;
    });
  };

  const handleAddPhotos = (fileList: FileList) => {
    const newItems: UploadedPhoto[] = Array.from(fileList)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        name: file.name,
        sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        previewUrl: URL.createObjectURL(file),
      }));

    if (newItems.length > 0) {
      setPhotos((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleClearAllPhotos = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0C141C] text-[#F4F7FA]">
      <BrandHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <PortfolioGallery />

        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#8EA3B5]">
            Armá tu presupuesto eligiendo las tareas y cantidades estimadas.
          </p>

          <button
            type="button"
            onClick={() => setIsMaterialsOpen(true)}
            className="flex min-h-[48px] shrink-0 items-center justify-center gap-2.5 rounded-xl border border-[#8DB8D2]/45 bg-[#131E29] px-4 py-2.5 text-xs font-semibold tracking-wide text-[#B9D5E6] transition-colors hover:border-[#8DB8D2] hover:bg-[#1A2836] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2] active:scale-[0.98]"
          >
            <Calculator className="h-4 w-4 shrink-0 text-[#8DB8D2]" />
            <span>Abrir calculadora de materiales</span>
          </button>
        </div>

        {isOwnerMode && authUser && (
          <div className="mb-7 rounded-2xl border border-[#8DB8D2]/50 bg-[#131E29] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8DB8D2]/20 text-[#9AC2DA]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#F4F7FA]">
                    Modo dueño activo · Edición de precios habilitada
                  </div>
                  <div className="mt-0.5 text-xs text-[#8EA3B5]">
                    Sesión iniciada como{' '}
                    <span className="font-medium text-[#CBD7E2]">
                      {authUser.email}
                    </span>
                    . Modificá los precios abajo y guardalos para actualizar el
                    link de clientes.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveGlobalPrices}
                  disabled={isSavingPrices}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#8DB8D2] px-4 py-2 text-xs font-bold text-[#0C141C] transition-colors hover:bg-[#B9D5E6] disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {isSavingPrices
                      ? 'Guardando...'
                      : 'Guardar precios globales'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreBasePrices}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#1A2836] px-3.5 py-2 text-xs font-semibold text-[#CBD7E2] transition-colors hover:border-[#8DB8D2]/60"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Precios base</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsGmailOpen(true)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#8DB8D2]/40 bg-[#1A2836] px-3.5 py-2 text-xs font-semibold text-[#B9D5E6] transition-colors hover:border-[#8DB8D2]"
                >
                  <Mail className="h-4 w-4 text-[#8DB8D2]" />
                  <span>Gmail RS</span>
                </button>

                <button
                  type="button"
                  onClick={handleOwnerLogout}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#0C141C] px-3.5 py-2 text-xs font-semibold text-[#8EA3B5] transition-colors hover:text-[#F4F7FA]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>
            </div>

            {priceSaveFeedback && (
              <div
                className={`mt-3 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                  priceSaveFeedback.type === 'success'
                    ? 'border-emerald-400/35 bg-emerald-950/30 text-emerald-200'
                    : 'border-red-400/35 bg-red-950/30 text-red-200'
                }`}
              >
                {priceSaveFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                )}
                <span>{priceSaveFeedback.message}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="space-y-8 lg:col-span-7">
            <TaskByTaskBuilder
              tasks={tasks}
              isOwnerMode={isOwnerMode}
              onToggleTask={handleToggleTask}
              onUpdateQty={handleUpdateTaskQty}
              onUpdatePrice={handleUpdateTaskPrice}
              onResetTasks={handleResetTasks}
            />

            <div className="border-t border-white/10 pt-7">
              <PhotoUploader
                photos={photos}
                onAddPhotos={handleAddPhotos}
                onRemovePhoto={handleRemovePhoto}
                onClearAll={handleClearAllPhotos}
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <BudgetSummary
              tasks={tasks}
              photoCount={photos.length}
              notes={notes}
              onNotesChange={setNotes}
              attachedMaterialsLines={attachedMaterialsLines}
              onClearAttachedMaterials={() => setAttachedMaterialsLines(null)}
              onOpenMaterialsModal={() => setIsMaterialsOpen(true)}
              isOwnerMode={isOwnerMode}
              onOpenGmailModal={() => setIsGmailOpen(true)}
              connectedGmail={connectedGmail}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#0C141C] px-4 py-6 text-center sm:px-6">
        <p className="text-sm font-medium text-[#CBD7E2]">
          RS Remodelaciones - Valentín Alsina, Buenos Aires
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#8EA3B5]">
          <span>
            Presupuesto orientativo con IVA incluido, sujeto a relevamiento y
            visita técnica.
          </span>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[36px] items-center gap-1.5 font-medium text-[#9AC2DA] transition-colors hover:text-[#F4F7FA]"
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>Instagram @{INSTAGRAM_HANDLE}</span>
          </a>
          {showOwnerTrigger && (
            <button
              type="button"
              onClick={() => setIsOwnerModalOpen(true)}
              className="inline-flex min-h-[36px] items-center gap-1.5 font-medium text-[#8EA3B5] transition-colors hover:text-[#B9D5E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
            >
              {isOwnerMode ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-[#8DB8D2]" />
                  <span className="text-[#9AC2DA]">Modo dueño activo</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Acceso dueño</span>
                </>
              )}
            </button>
          )}
        </div>
      </footer>

      <MaterialsCalculatorModal
        isOpen={isMaterialsOpen}
        onClose={() => setIsMaterialsOpen(false)}
        tasks={tasks}
        attachedLines={attachedMaterialsLines}
        onAttachToBudget={(lines) => setAttachedMaterialsLines(lines)}
      />

      <OwnerAccessModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        currentUser={authUser}
      />

      {isOwnerMode && (
        <GmailModal
          isOpen={isGmailOpen}
          onClose={() => setIsGmailOpen(false)}
          budgetSummaryText={budgetSummaryText}
          isBudgetReady={isBudgetReady}
          onAuthUserChange={setConnectedGmail}
        />
      )}
    </div>
  );
}
