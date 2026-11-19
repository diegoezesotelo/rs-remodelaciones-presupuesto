import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Instagram,
  Maximize2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../types/budget';

interface PortfolioProject {
  id: string;
  title: string;
  details: string;
  location: string;
  imageUrl: string;
}

const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'bano-real',
    title: 'Baño completo',
    details: 'Porcelanato · Mampara · Sanitarios y grifería',
    location: 'Obra RS Remodelaciones',
    imageUrl: '/assets/aistudio/WhatsApp_Image_2026-11-19_at_3.11.26_PM_e7c811ec.jpeg',
  },
  {
    id: 'cocina-real',
    title: 'Cocina integral',
    details: 'Isla en mármol · Durlock · Iluminación LED',
    location: 'Barrio Parque',
    imageUrl: '/assets/aistudio/WhatsApp_Image_2026-11-19_at_3.11.25_PM_5c605fca.jpeg',
  },
  {
    id: 'exterior-real',
    title: 'Exterior y quincho',
    details: 'Travertino · Albañilería · Pintura exterior',
    location: 'Obra RS Remodelaciones',
    imageUrl: '/assets/aistudio/WhatsApp_Image_2026-11-19_at_3.11.25_PM__1__c5e59acd.jpeg',
  },
];

export function PortfolioGallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev + 1) % PORTFOLIO_PROJECTS.length
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + PORTFOLIO_PROJECTS.length) % PORTFOLIO_PROJECTS.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex]);

  const activeProject =
    activeIndex !== null ? PORTFOLIO_PROJECTS[activeIndex] : null;

  return (
    <section aria-labelledby="heading-trabajos-realizados" className="mb-8">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="heading-trabajos-realizados"
            className="font-display text-xl font-bold tracking-wide text-[#F4F7FA] sm:text-2xl"
          >
            Trabajos realizados
          </h2>
          <p className="mt-0.5 text-xs text-[#8EA3B5]">
            Obras propias terminadas · Tocá una imagen para ampliar
          </p>
        </div>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-[#8DB8D2]/40 bg-[#131E29] px-3.5 py-2 text-xs font-semibold text-[#B9D5E6] transition-colors hover:border-[#8DB8D2] hover:bg-[#1A2836] hover:text-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
        >
          <Instagram className="h-4 w-4 shrink-0 text-[#8DB8D2]" />
          <span>@{INSTAGRAM_HANDLE}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-75" />
        </a>
      </div>

      {/* Horizontal snap strip on mobile, balanced 3-column grid on tablet & desktop */}
      <div className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {PORTFOLIO_PROJECTS.map((project, index) => {
          const isFailed = failedImages[project.id];

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver obra terminada: ${project.title}`}
              className="group relative aspect-[4/3] w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#131E29] text-left transition-all duration-200 hover:border-[#8DB8D2]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2] sm:w-full"
            >
              {!isFailed ? (
                <img
                  src={project.imageUrl}
                  alt={`${project.title} — ${project.details}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [project.id]: true }))
                  }
                  className="h-full w-full origin-bottom scale-[1.15] object-cover object-bottom transition-transform duration-300 group-hover:scale-[1.18]"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1A2836] to-[#0C141C] p-4 text-center">
                  <Building2 className="h-7 w-7 text-[#8DB8D2]" />
                  <span className="text-xs font-medium text-[#CBD7E2]">
                    {project.title}
                  </span>
                </div>
              )}

              {/* Subtle expand indicator */}
              <span
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0C141C]/70 text-[#F4F7FA] opacity-85 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </span>

              {/* Measured bottom contrast scrim */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0C141C]/95 via-[#0C141C]/55 to-transparent px-3.5 pb-3 pt-10">
                <div className="text-sm font-semibold text-[#F4F7FA]">
                  {project.title}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-[#CBD7E2]">
                  {project.details}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox Preview Modal */}
      {activeProject && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-project-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveIndex(null);
          }}
        >
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#8DB8D2]/40 bg-[#131E29] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h3
                  id="lightbox-project-title"
                  className="truncate font-display text-lg font-bold text-[#F4F7FA] sm:text-xl"
                >
                  {activeProject.title}
                </h3>
                <p className="truncate text-xs text-[#9AC2DA]">
                  {activeProject.details} · {activeProject.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                aria-label="Cerrar vista ampliada"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#1A2836] text-[#CBD7E2] transition-colors hover:border-[#8DB8D2] hover:text-[#F4F7FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0C141C]">
              {!failedImages[activeProject.id] ? (
                <img
                  src={activeProject.imageUrl}
                  alt={activeProject.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full origin-bottom scale-[1.14] object-cover object-bottom"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#8EA3B5]">
                  <Building2 className="h-10 w-10 text-[#8DB8D2]" />
                  <span className="text-sm">{activeProject.title}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  setActiveIndex(
                    (activeIndex - 1 + PORTFOLIO_PROJECTS.length) %
                      PORTFOLIO_PROJECTS.length
                  )
                }
                aria-label="Trabajo anterior"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0C141C]/80 text-[#F4F7FA] backdrop-blur-sm transition-colors hover:border-[#8DB8D2] hover:bg-[#131E29]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveIndex((activeIndex + 1) % PORTFOLIO_PROJECTS.length)
                }
                aria-label="Siguiente trabajo"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0C141C]/80 text-[#F4F7FA] backdrop-blur-sm transition-colors hover:border-[#8DB8D2] hover:bg-[#131E29]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-[#8EA3B5] sm:px-5">
              <span className="tabular-nums">
                Obra {activeIndex + 1} de {PORTFOLIO_PROJECTS.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveIndex(null);
                  document
                    .getElementById('heading-tareas')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="min-h-[40px] rounded-xl bg-[#8DB8D2] px-4 py-2 text-xs font-bold text-[#0C141C] transition-colors hover:bg-[#B9D5E6]"
              >
                Presupuestar mi obra
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
