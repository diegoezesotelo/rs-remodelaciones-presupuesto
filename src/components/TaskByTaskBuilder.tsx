import { Check, Minus, Plus, RotateCcw } from 'lucide-react';
import {
  TASK_CATALOG,
  formatARS,
  type TaskCategory,
  type TaskItemId,
  type TaskSelectionState,
  type TasksStateMap,
} from '../types/budget';

interface TaskByTaskBuilderProps {
  tasks: TasksStateMap;
  isOwnerMode: boolean;
  onToggleTask: (id: TaskItemId) => void;
  onUpdateQty: (id: TaskItemId, qty: number) => void;
  onUpdatePrice: (id: TaskItemId, price: number) => void;
  onResetTasks: () => void;
}

const CATEGORY_GROUPS: { id: TaskCategory; title: string; subtitle: string }[] = [
  {
    id: 'superficie',
    title: 'Trabajos por superficie (m²)',
    subtitle: 'Indicá los m² aproximados a cubrir',
  },
  {
    id: 'instalaciones',
    title: 'Instalaciones técnicas',
    subtitle: 'Electricidad y plomería',
  },
  {
    id: 'ambientes',
    title: 'Ambientes completos',
    subtitle: 'Reforma integral por unidad',
  },
  {
    id: 'servicios',
    title: 'Servicios de obra',
    subtitle: 'Limpieza final y retiro de escombros',
  },
];

export function computeTaskSubtotal(state: TaskSelectionState): number {
  if (!state.enabled || state.quantity <= 0 || state.unitPrice < 0) return 0;
  return state.unitPrice * state.quantity;
}

export function TaskByTaskBuilder({
  tasks,
  isOwnerMode,
  onToggleTask,
  onUpdateQty,
  onUpdatePrice,
  onResetTasks,
}: TaskByTaskBuilderProps) {
  const activeCount = TASK_CATALOG.filter((item) => tasks[item.id].enabled).length;

  return (
    <section aria-labelledby="heading-tareas" className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2
            id="heading-tareas"
            className="text-base font-semibold tracking-wide text-[#F4F7FA]"
          >
            Selección tarea por tarea
          </h2>
          <p className="mt-0.5 text-xs text-[#8EA3B5]">
            {isOwnerMode
              ? 'Modo dueño activo: podés editar los precios por m² o por unidad y guardarlos'
              : 'Elegí cada tarea e indicá la cantidad estimada'}
          </p>
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onResetTasks}
            className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-medium text-[#8EA3B5] transition-colors hover:text-[#B9D5E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar selección
          </button>
        )}
      </div>

      {CATEGORY_GROUPS.map((group) => {
        const items = TASK_CATALOG.filter((t) => t.category === group.id);
        const groupSubtitle =
          group.id === 'superficie' && isOwnerMode
            ? 'Indicá los m² y editá los precios'
            : group.subtitle;

        return (
          <div key={group.id} className="space-y-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8DB8D2]">
                {group.title}
              </h3>
              <span className="text-xs text-[#8EA3B5]">{groupSubtitle}</span>
            </div>

            <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#131E29]">
              {items.map((item) => {
                const state = tasks[item.id];
                const subtotal = computeTaskSubtotal(state);
                const showQuantityControls = state.enabled && !item.isFixedToggle;
                const showPriceEditor = isOwnerMode;

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-colors ${
                      state.enabled ? 'bg-[#8DB8D2]/[0.10]' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleTask(item.id)}
                        aria-pressed={state.enabled}
                        className="flex flex-1 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            state.enabled
                              ? 'border-[#8DB8D2] bg-[#8DB8D2] text-[#0C141C]'
                              : 'border-white/25 bg-[#0C141C] text-transparent'
                          }`}
                          aria-hidden="true"
                        >
                          <Check className="h-4 w-4 stroke-[3]" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-[#F4F7FA]">
                              {item.label}
                            </span>
                            <span className="text-xs text-[#8EA3B5]" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-xs font-semibold tabular-nums text-[#9AC2DA]">
                              {formatARS(state.unitPrice)} {item.unitLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-[#8EA3B5]">
                            {item.description}
                          </p>
                        </div>
                      </button>

                      {state.enabled && (
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-bold tabular-nums text-[#F4F7FA]">
                            {formatARS(subtotal)}
                          </div>
                          <div className="text-[11px] text-[#8EA3B5]">subtotal</div>
                        </div>
                      )}
                    </div>

                    {(showQuantityControls || showPriceEditor) && (
                      <div className="mt-3.5 flex flex-wrap items-end gap-3 pl-9">
                        {showQuantityControls && (
                          <div>
                            <span className="mb-1 block text-[11px] text-[#8EA3B5]">
                              Cantidad ({item.unitShort})
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQty(item.id, Math.max(1, state.quantity - 1))
                                }
                                aria-label={`Disminuir cantidad de ${item.label}`}
                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-[#0C141C] text-[#F4F7FA] transition-colors hover:border-[#8DB8D2]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
                              >
                                <Minus className="h-4 w-4" />
                              </button>

                              <div className="relative">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min={1}
                                  max={10000}
                                  value={state.quantity || ''}
                                  aria-label={`Cantidad de ${item.label} en ${item.unitShort}`}
                                  onChange={(e) => {
                                    const val = parseFloat(
                                      e.target.value.replace(',', '.')
                                    );
                                    onUpdateQty(
                                      item.id,
                                      Number.isFinite(val) && val >= 0
                                        ? Math.min(val, 10000)
                                        : 0
                                    );
                                  }}
                                  className="h-11 w-24 rounded-lg border border-white/15 bg-[#0C141C] pl-3 pr-11 text-sm font-semibold tabular-nums text-[#F4F7FA] focus:border-[#8DB8D2] focus:outline-none focus:ring-1 focus:ring-[#8DB8D2]"
                                />
                                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#9AC2DA]">
                                  {item.unitShort}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQty(item.id, (state.quantity || 0) + 1)
                                }
                                aria-label={`Aumentar cantidad de ${item.label}`}
                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-[#0C141C] text-[#F4F7FA] transition-colors hover:border-[#8DB8D2]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {showPriceEditor && (
                          <div>
                            <label
                              htmlFor={`price-${item.id}`}
                              className="mb-1 block text-[11px] font-medium text-[#9AC2DA]"
                            >
                              Precio {item.unitLabel} ($)
                            </label>
                            <div className="relative">
                              <span
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9AC2DA]"
                                aria-hidden="true"
                              >
                                $
                              </span>
                              <input
                                id={`price-${item.id}`}
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={100000000}
                                step={1000}
                                value={state.unitPrice || ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  onUpdatePrice(
                                    item.id,
                                    Number.isFinite(val) && val >= 0
                                      ? Math.min(val, 100000000)
                                      : 0
                                  );
                                }}
                                className="h-11 w-40 rounded-lg border border-[#8DB8D2]/45 bg-[#0C141C] pl-7 pr-3 text-sm font-semibold tabular-nums text-[#F4F7FA] focus:border-[#8DB8D2] focus:outline-none focus:ring-1 focus:ring-[#8DB8D2]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
