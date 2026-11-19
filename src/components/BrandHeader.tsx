import { useState } from 'react';

export function BrandHeader() {
  const [imgError, setImgError] = useState(false);

  return (
    <header className="border-b border-[#8DB8D2]/20 bg-gradient-to-b from-[#131E29] to-[#0C141C]">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {/* Uploaded RS Remodelaciones Circular Logo */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#8DB8D2]/45 bg-[#1A2836] shadow-lg shadow-black/40 sm:h-20 sm:w-20">
              {!imgError ? (
                <img
                  src="/assets/aistudio/rs_326bfde0.JPG"
                  alt="Logo RS Remodelaciones"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full scale-[1.06] object-cover"
                />
              ) : (
                <span className="font-display text-xl font-bold tracking-wider text-[#F4F7FA]">
                  RS
                </span>
              )}
            </div>

            <div>
              <h1 className="font-display text-2xl font-bold uppercase leading-none tracking-[0.12em] text-[#F4F7FA] sm:text-3xl lg:text-[2.125rem]">
                RS REMODELACIONES
              </h1>
              <p className="mt-1.5 text-sm font-medium tracking-wide text-[#9AC2DA] sm:text-base">
                Presupuesto online
              </p>
            </div>
          </div>

          <div className="hidden flex-col items-end text-right sm:flex">
            <span className="text-xs font-medium uppercase tracking-wider text-[#B9D5E6]">
              Cálculo inmediato sin cargo
            </span>
            <span className="mt-1 text-xs text-[#8EA3B5]">
              Valentín Alsina · Buenos Aires
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
