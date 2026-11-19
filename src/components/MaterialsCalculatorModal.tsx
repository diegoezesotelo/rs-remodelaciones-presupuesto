import {
  ArrowDownToLine,
  Calculator,
  Check,
  Copy,
  Grid3x3,
  Hammer,
  Layers,
  Paintbrush,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import { formatARS, type TasksStateMap } from '../types/budget';

type MaterialTab = 'pintura' | 'porcelanato' | 'durlock' | 'albanileria';

interface MaterialsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TasksStateMap;
  attachedLines: string[] | null;
  onAttachToBudget: (lines: string[] | null) => void;
}

const MATERIAL_TABS: {
  id: MaterialTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: 'pintura', label: 'Pintura', icon: Paintbrush },
  { id: 'porcelanato', label: 'Porcelanato', icon: Grid3x3 },
  { id: 'durlock', label: 'Durlock', icon: Layers },
  { id: 'albanileria', label: 'Albañilería', icon: Hammer },
];

const REF_PRICES = {
  latexInterior20L: 135_000,
  latexInterior10L: 76_000,
  latexInterior4L: 35_000,
  latexExterior20L: 160_000,
  latexExterior10L: 90_000,
  latexExterior4L: 42_000,
  fijador4L: 24_000,
  enduido10kg: 42_000,
  porcelanatoM2: 24_000,
  klaukol25kg: 20_000,
  pastina1kg: 7_000,
  separadores100u: 4_500,
  placaDurlock: 22_500,
  solera70: 11_500,
  montante69: 8_500,
  masilla18kg: 38_000,
  cinta75m: 7_500,
  tornillos1000u: 15_000,
  cemento50kg: 12_000,
  plasticor40kg: 11_500,
  arenaM3: 46_000,
};

interface MaterialLineItem {
  name: string;
  quantityText: string;
  unitPriceText: string;
  subtotal: number;
}

interface SavedMaterialGroup {
  key: string;
  tab: MaterialTab;
  title: string;
  items: MaterialLineItem[];
  subtotal: number;
}

function buildGroupLines(group: SavedMaterialGroup): string[] {
  return [
    `${group.title}:`,
    ...group.items.map(
      (item) =>
        `• ${item.name}: ${item.quantityText} (~${formatARS(item.subtotal)})`
    ),
    `• Subtotal ${group.title}: ${formatARS(group.subtotal)}`,
  ];
}

function buildCombinedMaterialsLines(groups: SavedMaterialGroup[]): string[] {
  if (groups.length === 0) return [];
  if (groups.length === 1) {
    const only = groups[0];
    return [
      `Materiales aprox. — ${only.title}:`,
      ...only.items.map(
        (item) =>
          `• ${item.name}: ${item.quantityText} (~${formatARS(item.subtotal)})`
      ),
      `• Total aprox. en materiales: ${formatARS(only.subtotal)}`,
    ];
  }

  const grandTotal = groups.reduce((acc, g) => acc + g.subtotal, 0);
  const lines: string[] = ['Materiales aprox. (varios trabajos):'];

  groups.forEach((group, idx) => {
    if (idx > 0) lines.push('');
    lines.push(...buildGroupLines(group));
  });

  lines.push('');
  lines.push(
    `• Total general aprox. en materiales (${groups.length} trabajos): ${formatARS(
      grandTotal
    )}`
  );

  return lines;
}

export function MaterialsCalculatorModal({
  isOpen,
  onClose,
  tasks,
  attachedLines,
  onAttachToBudget,
}: MaterialsCalculatorModalProps) {
  const [activeTab, setActiveTab] = useState<MaterialTab>('pintura');
  const [copied, setCopied] = useState(false);
  const [savedGroups, setSavedGroups] = useState<SavedMaterialGroup[]>([]);

  const [paintArea, setPaintArea] = useState<number>(25);
  const [paintCoats, setPaintCoats] = useState<2 | 3>(2);
  const [paintType, setPaintType] = useState<'interior' | 'exterior'>(
    'interior'
  );
  const [includePrimer, setIncludePrimer] = useState<boolean>(true);

  const [tileArea, setTileArea] = useState<number>(15);
  const [tileWastePct, setTileWastePct] = useState<10 | 15>(10);
  const [tileBoxM2, setTileBoxM2] = useState<number>(1.44);

  const [durlockArea, setDurlockArea] = useState<number>(12);
  const [durlockFaces, setDurlockFaces] = useState<1 | 2>(2);

  const [masonryArea, setMasonryArea] = useState<number>(12);
  const [masonryType, setMasonryType] = useState<'revoque' | 'carpeta'>(
    'revoque'
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const paintLiters = Math.max(1, Math.ceil((paintArea * paintCoats) / 10));
  const cans20 = Math.floor(paintLiters / 20);
  const remAfter20 = paintLiters % 20;
  const cans10 = Math.floor(remAfter20 / 10);
  const remAfter10 = remAfter20 % 10;
  const cans4 = Math.ceil(remAfter10 / 4);

  const p20 =
    paintType === 'interior'
      ? REF_PRICES.latexInterior20L
      : REF_PRICES.latexExterior20L;
  const p10 =
    paintType === 'interior'
      ? REF_PRICES.latexInterior10L
      : REF_PRICES.latexExterior10L;
  const p4 =
    paintType === 'interior'
      ? REF_PRICES.latexInterior4L
      : REF_PRICES.latexExterior4L;
  const paintCost = cans20 * p20 + cans10 * p10 + cans4 * p4;
  const cansText =
    [
      cans20 > 0 ? `${cans20}×20L` : null,
      cans10 > 0 ? `${cans10}×10L` : null,
      cans4 > 0 ? `${cans4}×4L` : null,
    ]
      .filter(Boolean)
      .join(' + ') || '1×4L';

  const primerLiters = includePrimer ? Math.max(1, Math.ceil(paintArea / 12)) : 0;
  const primerBids4L = includePrimer
    ? Math.max(1, Math.ceil(primerLiters / 4))
    : 0;
  const primerCost = primerBids4L * REF_PRICES.fijador4L;

  const enduidoKg = includePrimer ? Math.max(1, Math.ceil(paintArea * 0.8)) : 0;
  const enduidoBuckets10 = includePrimer
    ? Math.max(1, Math.ceil(enduidoKg / 10))
    : 0;
  const enduidoCost = enduidoBuckets10 * REF_PRICES.enduido10kg;

  const paintItems: MaterialLineItem[] = [
    {
      name: `Látex ${paintType} (${paintLiters} L est.)`,
      quantityText: cansText,
      unitPriceText: `20L ${formatARS(p20)}`,
      subtotal: paintCost,
    },
    ...(includePrimer
      ? [
          {
            name: `Fijador al agua (${primerLiters} L est.)`,
            quantityText: `${primerBids4L} bidón${
              primerBids4L > 1 ? 'es' : ''
            } × 4L`,
            unitPriceText: `${formatARS(REF_PRICES.fijador4L)} c/u`,
            subtotal: primerCost,
          },
          {
            name: `Enduido plástico (${enduidoKg} kg est.)`,
            quantityText: `${enduidoBuckets10} balde${
              enduidoBuckets10 > 1 ? 's' : ''
            } × 10kg`,
            unitPriceText: `${formatARS(REF_PRICES.enduido10kg)} c/u`,
            subtotal: enduidoCost,
          },
        ]
      : []),
  ];

  const tileTotalM2 = Math.round(tileArea * (1 + tileWastePct / 100) * 10) / 10;
  const safeBoxM2 = tileBoxM2 > 0 ? tileBoxM2 : 1.44;
  const tileBoxes = Math.max(1, Math.ceil(tileTotalM2 / safeBoxM2));
  const tileCost = Math.round(tileTotalM2 * REF_PRICES.porcelanatoM2);

  const adhesiveBags = Math.max(1, Math.ceil(tileArea / 4));
  const adhesiveCost = adhesiveBags * REF_PRICES.klaukol25kg;

  const groutKg = Math.max(1, Math.ceil(tileArea * 0.4));
  const groutCost = groutKg * REF_PRICES.pastina1kg;

  const spacersCount = Math.max(50, Math.ceil(tileArea * 15));
  const spacerBags = Math.max(1, Math.ceil(spacersCount / 100));
  const spacerCost = spacerBags * REF_PRICES.separadores100u;

  const tileItems: MaterialLineItem[] = [
    {
      name: `Porcelanato (+${tileWastePct}% desperdicio)`,
      quantityText: `${tileTotalM2} m² (~${tileBoxes} cajas)`,
      unitPriceText: `${formatARS(REF_PRICES.porcelanatoM2)} / m²`,
      subtotal: tileCost,
    },
    {
      name: 'Pegamento impermeable (25 kg)',
      quantityText: `${adhesiveBags} bolsa${adhesiveBags > 1 ? 's' : ''}`,
      unitPriceText: `${formatARS(REF_PRICES.klaukol25kg)} c/u`,
      subtotal: adhesiveCost,
    },
    {
      name: 'Pastina impermeable',
      quantityText: `${groutKg} kg`,
      unitPriceText: `${formatARS(REF_PRICES.pastina1kg)} / kg`,
      subtotal: groutCost,
    },
    {
      name: 'Separadores / niveladores',
      quantityText: `${spacerBags} bolsa${spacerBags > 1 ? 's' : ''} × 100u`,
      unitPriceText: `${formatARS(REF_PRICES.separadores100u)} c/u`,
      subtotal: spacerCost,
    },
  ];

  const durlockPlates = Math.max(
    1,
    Math.ceil((durlockArea * durlockFaces * 1.05) / 2.88)
  );
  const plateCost = durlockPlates * REF_PRICES.placaDurlock;

  const durlockSoleras = Math.max(2, Math.ceil((durlockArea * 0.85) / 2.6));
  const soleraCost = durlockSoleras * REF_PRICES.solera70;

  const durlockMontantes = Math.max(3, Math.ceil((durlockArea * 2.1) / 2.6));
  const montanteCost = durlockMontantes * REF_PRICES.montante69;

  const durlockMasillaKg = Math.max(
    2,
    Math.ceil(durlockArea * durlockFaces * 0.65)
  );
  const masillaBuckets18 = Math.max(1, Math.ceil(durlockMasillaKg / 18));
  const masillaCost = masillaBuckets18 * REF_PRICES.masilla18kg;

  const durlockTapeMeters = Math.max(
    5,
    Math.ceil(durlockArea * durlockFaces * 1.4)
  );
  const tapeRolls75 = Math.max(1, Math.ceil(durlockTapeMeters / 75));
  const tapeCost = tapeRolls75 * REF_PRICES.cinta75m;

  const durlockScrewsT2 = Math.max(
    50,
    Math.ceil(durlockArea * durlockFaces * 16)
  );
  const screwBoxes = Math.max(1, Math.ceil(durlockScrewsT2 / 1000));
  const screwCost = screwBoxes * REF_PRICES.tornillos1000u;

  const durlockItems: MaterialLineItem[] = [
    {
      name: 'Placas yeso 1.20×2.40 m',
      quantityText: `${durlockPlates} placas`,
      unitPriceText: `${formatARS(REF_PRICES.placaDurlock)} c/u`,
      subtotal: plateCost,
    },
    {
      name: 'Soleras 70 mm (2.60 m)',
      quantityText: `${durlockSoleras} tiras`,
      unitPriceText: `${formatARS(REF_PRICES.solera70)} c/u`,
      subtotal: soleraCost,
    },
    {
      name: 'Montantes 69 mm (2.60 m)',
      quantityText: `${durlockMontantes} tiras`,
      unitPriceText: `${formatARS(REF_PRICES.montante69)} c/u`,
      subtotal: montanteCost,
    },
    {
      name: `Masilla (${durlockMasillaKg} kg est.)`,
      quantityText: `${masillaBuckets18} balde${
        masillaBuckets18 > 1 ? 's' : ''
      } × 18kg`,
      unitPriceText: `${formatARS(REF_PRICES.masilla18kg)} c/u`,
      subtotal: masillaCost,
    },
    {
      name: `Cinta de papel (${durlockTapeMeters} m) y tornillos T2`,
      quantityText: `${tapeRolls75} rollo + ${screwBoxes} caja`,
      unitPriceText: 'Insumos fijación',
      subtotal: tapeCost + screwCost,
    },
  ];

  const cementBags50 =
    masonryType === 'revoque'
      ? Math.max(1, Math.ceil(masonryArea * 0.16))
      : Math.max(1, Math.ceil(masonryArea * 0.25));
  const cementCost = cementBags50 * REF_PRICES.cemento50kg;

  const plasticorBags =
    masonryType === 'revoque'
      ? Math.max(1, Math.ceil(masonryArea * 0.22))
      : 0;
  const plasticorCost = plasticorBags * REF_PRICES.plasticor40kg;

  const sandM3 =
    masonryType === 'revoque'
      ? Math.max(0.1, Math.round(masonryArea * 0.03 * 100) / 100)
      : Math.max(0.1, Math.round(masonryArea * 0.05 * 100) / 100);
  const sandCost = Math.round(sandM3 * REF_PRICES.arenaM3);

  const masonryItems: MaterialLineItem[] = [
    {
      name: 'Cemento Portland (50 kg)',
      quantityText: `${cementBags50} bolsa${cementBags50 > 1 ? 's' : ''}`,
      unitPriceText: `${formatARS(REF_PRICES.cemento50kg)} c/u`,
      subtotal: cementCost,
    },
    ...(plasticorBags > 0
      ? [
          {
            name: 'Plasticor / albañilería (40 kg)',
            quantityText: `${plasticorBags} bolsa${
              plasticorBags > 1 ? 's' : ''
            }`,
            unitPriceText: `${formatARS(REF_PRICES.plasticor40kg)} c/u`,
            subtotal: plasticorCost,
          },
        ]
      : []),
    {
      name: 'Arena mediana (granel/bolsón)',
      quantityText: `${sandM3} m³`,
      unitPriceText: `${formatARS(REF_PRICES.arenaM3)} / m³`,
      subtotal: sandCost,
    },
  ];

  const activeItems =
    activeTab === 'pintura'
      ? paintItems
      : activeTab === 'porcelanato'
        ? tileItems
        : activeTab === 'durlock'
          ? durlockItems
          : masonryItems;

  const activeSubtotal = activeItems.reduce((sum, i) => sum + i.subtotal, 0);

  const buildCurrentActiveGroup = (): SavedMaterialGroup => {
    if (activeTab === 'pintura') {
      return {
        key: `pintura-${paintType}`,
        tab: 'pintura',
        title: `Pintura ${paintType} (${paintArea} m², ${paintCoats} manos)`,
        items: paintItems,
        subtotal: activeSubtotal,
      };
    }
    if (activeTab === 'porcelanato') {
      return {
        key: 'porcelanato',
        tab: 'porcelanato',
        title: `Porcelanato (${tileArea} m²)`,
        items: tileItems,
        subtotal: activeSubtotal,
      };
    }
    if (activeTab === 'durlock') {
      return {
        key: 'durlock',
        tab: 'durlock',
        title: `Durlock (${durlockArea} m², ${durlockFaces} ${
          durlockFaces === 1 ? 'cara' : 'caras'
        })`,
        items: durlockItems,
        subtotal: activeSubtotal,
      };
    }
    return {
      key: `albanileria-${masonryType}`,
      tab: 'albanileria',
      title: `Albañilería ${
        masonryType === 'revoque' ? 'Revoque' : 'Carpeta'
      } (${masonryArea} m²)`,
      items: masonryItems,
      subtotal: activeSubtotal,
    };
  };

  const currentGroup = buildCurrentActiveGroup();
  const isCurrentGroupSaved = savedGroups.some(
    (g) => g.key === currentGroup.key
  );
  const currentTabHasSavedEntry = savedGroups.some((g) => g.tab === activeTab);

  const syncAttachedIfNeeded = (nextGroups: SavedMaterialGroup[]) => {
    if (attachedLines !== null) {
      onAttachToBudget(
        nextGroups.length > 0 ? buildCombinedMaterialsLines(nextGroups) : null
      );
    }
  };

  const handleSaveCurrentGroup = () => {
    setSavedGroups((prev) => {
      const existingIndex = prev.findIndex((g) => g.key === currentGroup.key);
      const next =
        existingIndex >= 0
          ? prev.map((g, idx) => (idx === existingIndex ? currentGroup : g))
          : [...prev, currentGroup];
      syncAttachedIfNeeded(next);
      return next;
    });
  };

  const handleRemoveGroup = (key: string) => {
    setSavedGroups((prev) => {
      const next = prev.filter((g) => g.key !== key);
      syncAttachedIfNeeded(next);
      return next;
    });
  };

  const handleImportFromTasks = () => {
    if (activeTab === 'pintura') {
      const interior = tasks.pintura_interior.enabled
        ? tasks.pintura_interior.quantity
        : 0;
      const exterior = tasks.pintura_exterior.enabled
        ? tasks.pintura_exterior.quantity
        : 0;
      if (paintType === 'interior' && interior > 0) setPaintArea(interior);
      else if (paintType === 'exterior' && exterior > 0) setPaintArea(exterior);
      else if (interior + exterior > 0) setPaintArea(interior + exterior);
    } else if (activeTab === 'porcelanato' && tasks.porcelanato.enabled) {
      setTileArea(tasks.porcelanato.quantity);
    } else if (activeTab === 'durlock' && tasks.durlock_tabique.enabled) {
      setDurlockArea(tasks.durlock_tabique.quantity);
    } else if (activeTab === 'albanileria' && tasks.albanileria.enabled) {
      setMasonryArea(tasks.albanileria.quantity);
    }
  };

  const effectiveGroups =
    savedGroups.length > 0 ? savedGroups : [currentGroup];
  const combinedTotalCost = effectiveGroups.reduce(
    (sum, g) => sum + g.subtotal,
    0
  );
  const currentLines = buildCombinedMaterialsLines(effectiveGroups);
  const isAttached =
    attachedLines !== null &&
    attachedLines.join('\n') === currentLines.join('\n');

  const handleCopyMaterials = async () => {
    try {
      await navigator.clipboard.writeText(currentLines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const canImportCurrentTab =
    (activeTab === 'pintura' &&
      (tasks.pintura_interior.enabled || tasks.pintura_exterior.enabled)) ||
    (activeTab === 'porcelanato' && tasks.porcelanato.enabled) ||
    (activeTab === 'durlock' && tasks.durlock_tabique.enabled) ||
    (activeTab === 'albanileria' && tasks.albanileria.enabled);

  const activeTabLabel =
    MATERIAL_TABS.find((t) => t.id === activeTab)?.label ?? 'rubro';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-materiales-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-[#8DB8D2]/40 bg-[#131E29] text-[#F4F7FA] shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#131E29]/95 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8DB8D2]/40 bg-[#8DB8D2]/12 text-[#9AC2DA]">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="modal-materiales-titulo"
                className="font-display text-xl font-bold text-[#F4F7FA] sm:text-2xl"
              >
                Calculadora de materiales
              </h2>
              <p className="text-xs text-[#8EA3B5]">
                Sumá varios trabajos para ver el total acumulado (ARS)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar calculadora de materiales"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1A2836] text-[#CBD7E2] transition-colors hover:border-[#8DB8D2]/60 hover:text-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div
            className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-[#0C141C] p-1.5 sm:grid-cols-4"
            role="tablist"
            aria-label="Rubros de materiales"
          >
            {MATERIAL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              const hasSaved = savedGroups.some((g) => g.tab === tab.id);

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2] ${
                    isSelected
                      ? 'bg-[#8DB8D2] text-[#0C141C]'
                      : hasSaved
                        ? 'bg-[#1A2836] text-[#B9D5E6] hover:text-[#F4F7FA]'
                        : 'text-[#8EA3B5] hover:text-[#F4F7FA]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                  {hasSaved && (
                    <Check
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isSelected ? 'text-[#0C141C]' : 'text-[#8DB8D2]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {canImportCurrentTab && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#8DB8D2]/30 bg-[#8DB8D2]/10 px-4 py-2.5">
              <span className="text-xs text-[#CBD7E2]">
                Tenés metros cargados para este rubro en tu presupuesto.
              </span>
              <button
                type="button"
                onClick={handleImportFromTasks}
                className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg bg-[#8DB8D2] px-3 py-1.5 text-xs font-bold text-[#0C141C] transition-colors hover:bg-[#B9D5E6]"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Traer m²
              </button>
            </div>
          )}

          {activeTab === 'pintura' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="mat-paint-m2"
                    className="block text-xs font-medium text-[#CBD7E2]"
                  >
                    Superficie a pintar (m²)
                  </label>
                  <input
                    id="mat-paint-m2"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    max={5000}
                    value={paintArea || ''}
                    onChange={(e) =>
                      setPaintArea(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0C141C] px-3.5 text-base font-semibold tabular-nums text-[#F4F7FA] focus:border-[#8DB8D2] focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#CBD7E2]">
                    Cantidad de manos
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {([2, 3] as const).map((coats) => (
                      <button
                        key={coats}
                        type="button"
                        onClick={() => setPaintCoats(coats)}
                        className={`h-11 rounded-xl border text-xs font-semibold transition-colors ${
                          paintCoats === coats
                            ? 'border-[#8DB8D2] bg-[#8DB8D2]/15 text-[#B9D5E6]'
                            : 'border-white/10 bg-[#0C141C] text-[#8EA3B5] hover:text-[#F4F7FA]'
                        }`}
                      >
                        {coats} manos
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid grid-cols-2 gap-2">
                  {(['interior', 'exterior'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPaintType(t)}
                      className={`h-11 rounded-xl border text-xs font-semibold capitalize transition-colors ${
                        paintType === t
                          ? 'border-[#8DB8D2] bg-[#8DB8D2]/15 text-[#B9D5E6]'
                          : 'border-white/10 bg-[#0C141C] text-[#8EA3B5]'
                      }`}
                    >
                      Látex {t}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIncludePrimer((v) => !v)}
                  aria-pressed={includePrimer}
                  className={`flex h-11 items-center justify-between rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
                    includePrimer
                      ? 'border-[#8DB8D2] bg-[#8DB8D2]/15 text-[#F4F7FA]'
                      : 'border-white/10 bg-[#0C141C] text-[#8EA3B5]'
                  }`}
                >
                  <span>Incluir fijador y enduido</span>
                  <Check
                    className={`h-4 w-4 ${
                      includePrimer ? 'text-[#8DB8D2]' : 'opacity-25'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'porcelanato' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="mat-tile-m2"
                  className="block text-xs font-medium text-[#CBD7E2]"
                >
                  Superficie neta (m²)
                </label>
                <input
                  id="mat-tile-m2"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={5000}
                  value={tileArea || ''}
                  onChange={(e) =>
                    setTileArea(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0C141C] px-3.5 text-base font-semibold tabular-nums text-[#F4F7FA] focus:border-[#8DB8D2] focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-[#CBD7E2]">
                  Desperdicio por cortes
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {([10, 15] as const).map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTileWastePct(pct)}
                      className={`h-11 rounded-xl border text-xs font-semibold tabular-nums transition-colors ${
                        tileWastePct === pct
                          ? 'border-[#8DB8D2] bg-[#8DB8D2]/15 text-[#B9D5E6]'
                          : 'border-white/10 bg-[#0C141C] text-[#8EA3B5]'
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="mat-tile-box"
                  className="block text-xs font-medium text-[#CBD7E2]"
                >
                  m² por caja (ref. 1.44)
                </label>
                <input
                  id="mat-tile-box"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0.5}
                  max={10}
                  value={tileBoxM2 || ''}
                  onChange={(e) =>
                    setTileBoxM2(
                      Math.max(0.5, parseFloat(e.target.value) || 1.44)
                    )
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0C141C] px-3.5 text-base font-semibold tabular-nums text-[#F4F7FA] focus:border-[#8DB8D2] focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'durlock' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="mat-durlock-m2"
                  className="block text-xs font-medium text-[#CBD7E2]"
                >
                  Superficie del tabique (m²)
                </label>
                <input
                  id="mat-durlock-m2"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={5000}
                  value={durlockArea || ''}
                  onChange={(e) =>
                    setDurlockArea(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0C141C] px-3.5 text-base font-semibold tabular-nums text-[#F4F7FA] focus:border-[#8DB8D2] focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-[#CBD7E2]">
                  Emplacado
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(
                    [
                      { faces: 2 as const, label: 'Tabique (2 caras)' },
                      { faces: 1 as const, label: 'Revest. (1 cara)' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.faces}
                      type="button"
                      onClick={() => setDurlockFaces(opt.faces)}
                      className={`h-11 rounded-xl border px-2 text-xs font-semibold transition-colors ${
                        durlockFaces === opt.faces
                          ? 'border-[#8DB8D2] bg-[#8DB8D2]/15 text-[#B9D5E6]'
                          : 'border-white/10 bg-[#0C141C] text-[#8EA3B5]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'albanileria' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="mat-masonry-m2"
                  className="block text-xs font-medium text-[#CBD7E2]"
                >
                  Superficie de obra (m²)
                </label>
                <input
                  id="mat-masonry-m2"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={5000}
                  value={masonryArea || ''}
                  onChange={(e) =>
                    setMasonryArea(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0C141C] px-3.5 text-base font-semibold tabular-nums text-[#F4F7FA] focus:border-[#8DB8D2] focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-[#CBD7E2]">
                  Tipo de mezcla
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'revoque' as const, label: 'Revoque pared' },
                      { id: 'carpeta' as const, label: 'Carpeta / Piso' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMasonryType(opt.id)}
                      className={`h-11 rounded-xl border px-2 text-xs font-semibold transition-colors ${
                        masonryType === opt.id
                          ? 'border-[#8DB8D2] bg-[#8DB8D2]/15 text-[#B9D5E6]'
                          : 'border-white/10 bg-[#0C141C] text-[#8EA3B5]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0C141C] px-4 py-3">
            <div>
              <div className="text-xs font-semibold text-[#F4F7FA]">
                {currentGroup.title}
              </div>
              <div className="mt-0.5 text-[11px] text-[#8EA3B5]">
                Subtotal de este trabajo
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold tabular-nums text-[#9AC2DA]">
                {formatARS(activeSubtotal)}
              </div>
              <button
                type="button"
                onClick={handleSaveCurrentGroup}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#8DB8D2]/50 bg-[#1A2836] px-3.5 py-2 text-xs font-bold text-[#B9D5E6] transition-colors hover:border-[#8DB8D2] hover:bg-[#8DB8D2] hover:text-[#0C141C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
              >
                {isCurrentGroupSaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Actualizar en lista</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>
                      {currentTabHasSavedEntry
                        ? `Agregar otro (${activeTabLabel})`
                        : `Agregar ${activeTabLabel} a la lista`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          <dl className="divide-y divide-white/10 rounded-xl border border-white/10 bg-[#0C141C] px-4 text-sm">
            {activeItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 py-3"
              >
                <dt className="min-w-0">
                  <div className="font-medium text-[#F4F7FA]">{item.name}</div>
                  <div className="mt-0.5 text-xs tabular-nums text-[#8EA3B5]">
                    {item.quantityText} · Ref. {item.unitPriceText}
                  </div>
                </dt>
                <dd className="shrink-0 font-semibold tabular-nums text-[#9AC2DA]">
                  {formatARS(item.subtotal)}
                </dd>
              </div>
            ))}
          </dl>

          {savedGroups.length > 0 && (
            <div className="space-y-2.5 rounded-xl border border-[#8DB8D2]/35 bg-[#0C141C] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8DB8D2]">
                  Trabajos sumados ({savedGroups.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSavedGroups([]);
                    if (attachedLines !== null) onAttachToBudget(null);
                  }}
                  className="text-xs font-medium text-[#8EA3B5] transition-colors hover:text-[#F4F7FA]"
                >
                  Vaciar lista
                </button>
              </div>

              <div className="divide-y divide-white/10">
                {savedGroups.map((group) => (
                  <div
                    key={group.key}
                    className="flex items-center justify-between gap-3 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#F4F7FA]">
                        {group.title}
                      </div>
                      <div className="text-[11px] text-[#8EA3B5]">
                        {group.items.length} materiales incluidos
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="font-bold tabular-nums text-[#9AC2DA]">
                        {formatARS(group.subtotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(group.key)}
                        aria-label={`Quitar ${group.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#131E29] text-[#8EA3B5] transition-colors hover:border-red-400/50 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#8DB8D2]/45 bg-[#8DB8D2]/12 px-4 py-3.5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B9D5E6]">
                {savedGroups.length > 1
                  ? `Total acumulado (${savedGroups.length} trabajos)`
                  : 'Costo aproximado en materiales'}
              </div>
              <div className="mt-0.5 text-xs text-[#CBD7E2]">
                Valores orientativos Argentina (sin flete)
              </div>
            </div>
            <div className="text-2xl font-bold tabular-nums text-[#F4F7FA]">
              {formatARS(combinedTotalCost)}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-[#8EA3B5]">
            Precios orientativos relevados de mercado en Argentina (pinturerías,
            cadenas de construcción y corralones de Buenos Aires). Pueden variar
            según marca, zona y costo de flete.
          </p>

          <div className="flex flex-col gap-2.5 border-t border-white/10 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                onAttachToBudget(isAttached ? null : currentLines);
              }}
              className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2] ${
                isAttached
                  ? 'border border-[#8DB8D2] bg-[#8DB8D2]/15 text-[#B9D5E6]'
                  : 'bg-[#8DB8D2] text-[#0C141C] hover:bg-[#B9D5E6]'
              }`}
            >
              <Check className="h-4 w-4" />
              {isAttached
                ? 'Lista adjunta al WhatsApp (quitar)'
                : savedGroups.length > 1
                  ? `Adjuntar ${savedGroups.length} trabajos al WhatsApp`
                  : 'Adjuntar lista y precios al WhatsApp'}
            </button>

            <button
              type="button"
              onClick={handleCopyMaterials}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#1A2836] px-4 py-3 text-xs font-semibold text-[#F4F7FA] transition-colors hover:border-[#8DB8D2]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#8DB8D2]" />
                  <span className="text-[#9AC2DA]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copiar lista</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
