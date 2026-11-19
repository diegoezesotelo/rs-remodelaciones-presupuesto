import { Calculator, Check, Copy, Mail, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import {
  RS_GMAIL_EMAIL,
  TASK_CATALOG,
  WHATSAPP_DISPLAY,
  WHATSAPP_PHONE,
  formatARS,
  type TasksStateMap,
} from '../types/budget';
import { computeTaskSubtotal } from './TaskByTaskBuilder';

interface BudgetSummaryProps {
  tasks: TasksStateMap;
  photoCount: number;
  notes: string;
  onNotesChange: (value: string) => void;
  attachedMaterialsLines: string[] | null;
  onClearAttachedMaterials: () => void;
  onOpenMaterialsModal: () => void;
  isOwnerMode: boolean;
  onOpenGmailModal: () => void;
  connectedGmail: string | null;
}

export function BudgetSummary({
  tasks,
  photoCount,
  notes,
  onNotesChange,
  attachedMaterialsLines,
  onClearAttachedMaterials,
  onOpenMaterialsModal,
  isOwnerMode,
  onOpenGmailModal,
  connectedGmail,
}: BudgetSummaryProps) {
  const [copied, setCopied] = useState(false);

  const allLines = TASK_CATALOG.filter(
    (item) => tasks[item.id].enabled
  ).map((item) => {
    const state = tasks[item.id];
    return {
      id: item.id,
      label: item.label,
      qtyText: item.isFixedToggle
        ? 'Servicio único'
        : `${state.quantity} ${item.unitShort}`,
      unitPriceText: formatARS(state.unitPrice),
      subtotal: computeTaskSubtotal(state),
    };
  });

  const total = allLines.reduce((acc, row) => acc + row.subtotal, 0);
  const formattedTotal = formatARS(total);
  const isReadyToSend = allLines.length > 0 && total > 0;

  const summaryLines = [
    'Hola RS Remodelaciones, solicito presupuesto online:',
    ...allLines.map(
      (row) => `• ${row.label} (${row.qtyText}): ${formatARS(row.subtotal)}`
    ),
    `• Total estimado (IVA incluido): ${formattedTotal}`,
    ...(photoCount > 0
      ? [
          `• Fotos del ambiente: ${photoCount} ${
            photoCount === 1 ? 'foto lista para enviar' : 'fotos listas para enviar'
          }`,
        ]
      : []),
    ...(attachedMaterialsLines ? ['', ...attachedMaterialsLines] : []),
    ...(notes.trim() ? [`• Comentarios: ${notes.trim()}`] : []),
  ];

  const whatsappText = summaryLines.join('\n');
  const whatsappHref = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
    whatsappText
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside
      aria-labelledby="heading-resumen-presupuesto"
      className="rounded-2xl border border-[#8DB8D2]/35 bg-[#131E29] p-5 sm:p-6 lg:sticky lg:top-6"
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8DB8D2]">
            Resumen del presupuesto
          </span>
          <h2
            id="heading-resumen-presupuesto"
            className="mt-1 font-display text-2xl font-bold text-[#F4F7FA]"
          >
            Detalle de tareas
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenMaterialsModal}
          className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-[#8DB8D2]/40 bg-[#1A2836] px-3 py-1.5 text-xs font-semibold text-[#B9D5E6] transition-colors hover:border-[#8DB8D2] hover:bg-[#8DB8D2]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
        >
          <Calculator className="h-3.5 w-3.5 text-[#8DB8D2]" />
          Materiales
        </button>
      </div>

      {/* Prominent Total Block matching the misty sky/steel gradient from logo */}
      <div className="mt-5 rounded-xl bg-gradient-to-br from-[#C8E0EE] via-[#94BED7] to-[#6D9AB6] p-5 text-[#0C141C]">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#0C141C]/80">
          Total estimado (IVA incluido)
        </div>
        <div
          className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl"
          aria-live="polite"
        >
          {isReadyToSend ? formattedTotal : '$0'}
        </div>
        <div className="mt-2 text-xs font-semibold text-[#0C141C]/85 tabular-nums">
          {allLines.length > 0
            ? `${allLines.length} ${
                allLines.length === 1 ? 'tarea seleccionada' : 'tareas seleccionadas'
              }`
            : 'Seleccioná al menos una tarea'}
        </div>
      </div>

      {/* Clean Hairline Breakdown */}
      <div className="mt-5">
        {allLines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#0C141C]/60 p-4 text-center text-xs text-[#8EA3B5]">
            Marcá las tareas que necesitás para calcular el presupuesto.
          </div>
        ) : (
          <dl className="divide-y divide-white/10 text-sm">
            {allLines.map((row) => (
              <div
                key={row.id}
                className="flex items-start justify-between gap-3 py-2.5"
              >
                <dt className="text-[#CBD7E2]">
                  <span className="font-medium text-[#F4F7FA]">{row.label}</span>
                  <span className="block text-xs tabular-nums text-[#8EA3B5]">
                    {row.qtyText} · {row.unitPriceText}
                  </span>
                </dt>
                <dd className="shrink-0 font-semibold tabular-nums text-[#F4F7FA]">
                  {formatARS(row.subtotal)}
                </dd>
              </div>
            ))}
            {photoCount > 0 && (
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[#8EA3B5]">Fotos adjuntas</dt>
                <dd className="font-medium tabular-nums text-[#F4F7FA]">
                  {photoCount} seleccionada{photoCount === 1 ? '' : 's'}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Attached materials summary from modal */}
      {attachedMaterialsLines && (
        <div className="mt-4 rounded-xl border border-[#8DB8D2]/35 bg-[#0C141C] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#9AC2DA]">
              Materiales adjuntos al mensaje
            </span>
            <button
              type="button"
              onClick={onClearAttachedMaterials}
              aria-label="Quitar cálculo de materiales"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#8EA3B5] hover:bg-white/10 hover:text-[#F4F7FA]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[#CBD7E2]">
            {attachedMaterialsLines.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Optional client note */}
      <div className="mt-4">
        <label
          htmlFor="notas-obra"
          className="block text-xs font-medium text-[#8EA3B5]"
        >
          Localidad o comentario adicional (opcional)
        </label>
        <input
          id="notas-obra"
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Ej: Valentín Alsina, casa en planta baja"
          maxLength={140}
          className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#0C141C] px-3.5 text-sm text-[#F4F7FA] placeholder-[#5F7487] transition-colors focus:border-[#8DB8D2] focus:outline-none focus:ring-1 focus:ring-[#8DB8D2]"
        />
      </div>

      {/* Primary WhatsApp Action */}
      <div className="mt-5 space-y-2.5">
        <a
          href={isReadyToSend ? whatsappHref : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!isReadyToSend}
          onClick={(e) => {
            if (!isReadyToSend) {
              e.preventDefault();
            }
          }}
          className={`flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-center text-sm font-bold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131E29] ${
            isReadyToSend
              ? 'bg-[#25D366] text-[#052010] hover:bg-[#2CE070] active:scale-[0.98]'
              : 'cursor-not-allowed bg-[#25D366]/30 text-[#052010]/60'
          }`}
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span>Enviar presupuesto por WhatsApp</span>
        </a>

        {isOwnerMode && (
          <button
            type="button"
            onClick={onOpenGmailModal}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#8DB8D2]/40 bg-[#1A2836] px-4 py-2.5 text-xs font-semibold text-[#B9D5E6] transition-colors hover:border-[#8DB8D2] hover:bg-[#8DB8D2]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
          >
            <Mail className="h-4 w-4 text-[#8DB8D2]" />
            <span>
              {connectedGmail
                ? `Enviar por Gmail (${connectedGmail})`
                : `Enviar por Gmail (${RS_GMAIL_EMAIL})`}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCopy}
          disabled={!isReadyToSend}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1A2836] px-4 py-2.5 text-xs font-semibold text-[#CBD7E2] transition-colors hover:border-[#8DB8D2]/50 hover:text-[#F4F7FA] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-[#8DB8D2]" />
              <span className="text-[#9AC2DA]">Resumen copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copiar detalle del presupuesto</span>
            </>
          )}
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-[#8EA3B5]">
        WhatsApp: {WHATSAPP_DISPLAY} · Correo: {RS_GMAIL_EMAIL}
        <br />
        Presupuesto orientativo, sujeto a visita técnica sin compromiso.
      </p>
    </aside>
  );
}
