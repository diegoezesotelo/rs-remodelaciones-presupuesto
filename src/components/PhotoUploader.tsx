import { Camera, ImagePlus, Trash2, X } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import type { UploadedPhoto } from '../types/budget';

interface PhotoUploaderProps {
  photos: UploadedPhoto[];
  onAddPhotos: (files: FileList) => void;
  onRemovePhoto: (id: string) => void;
  onClearAll: () => void;
}

export function PhotoUploader({
  photos,
  onAddPhotos,
  onRemovePhoto,
  onClearAll,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddPhotos(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <section aria-labelledby="heading-fotos-ambiente">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2
          id="heading-fotos-ambiente"
          className="text-base font-semibold tracking-wide text-[#F4F7FA]"
        >
          Fotos del ambiente (opcional)
        </h2>
        {photos.length > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-medium text-[#8EA3B5] transition-colors hover:text-[#B9D5E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Quitar todas
          </button>
        ) : (
          <span className="text-xs text-[#8EA3B5]">Para cotización precisa</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        id="fotos-ambiente-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="sr-only"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[#8DB8D2]/45 bg-[#131E29] px-4 py-4 text-sm font-semibold text-[#F4F7FA] transition-colors hover:border-[#8DB8D2] hover:bg-[#1A2836] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2] active:scale-[0.99]"
      >
        {photos.length > 0 ? (
          <ImagePlus className="h-5 w-5 shrink-0 text-[#8DB8D2]" />
        ) : (
          <Camera className="h-5 w-5 shrink-0 text-[#8DB8D2]" />
        )}
        <span>
          {photos.length > 0
            ? `Agregar más fotos (${photos.length} seleccionada${photos.length === 1 ? '' : 's'})`
            : 'Subir fotos del ambiente a remodelar'}
        </span>
      </button>

      {photos.length > 0 && (
        <div className="mt-3 space-y-2.5">
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#131E29]"
              >
                <img
                  src={photo.previewUrl}
                  alt={`Foto del ambiente: ${photo.name}`}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 pb-1.5 pt-5">
                  <p className="truncate text-[10px] font-medium text-[#F4F7FA]">
                    {photo.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo.id)}
                  aria-label={`Eliminar foto ${photo.name}`}
                  className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0C141C]/80 text-[#F4F7FA] backdrop-blur-sm transition-colors hover:bg-[#8DB8D2] hover:text-[#0C141C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-[#8EA3B5]">
            Al abrir WhatsApp podrás adjuntar estas {photos.length}{' '}
            {photos.length === 1 ? 'foto directamente' : 'fotos directamente'} en
            el chat para que evaluemos el estado actual de la obra.
          </p>
        </div>
      )}
    </section>
  );
}
