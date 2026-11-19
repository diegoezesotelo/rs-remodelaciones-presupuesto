import type { User } from 'firebase/auth';
import { AlertCircle, Lock, LogOut, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { googleSignIn, logout } from '../lib/gmailAuth';
import { isOwnerEmail } from '../lib/pricingService';
import { RS_GMAIL_EMAIL } from '../types/budget';

interface OwnerAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export function OwnerAccessModal({
  isOpen,
  onClose,
  currentUser,
}: OwnerAccessModalProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAuthError(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAuthorized = isOwnerEmail(
    currentUser?.email,
    currentUser?.emailVerified
  );

  const handleOwnerLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn(RS_GMAIL_EMAIL);
      if (
        result &&
        isOwnerEmail(result.user.email, result.user.emailVerified)
      ) {
        onClose();
      }
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión con Google.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSwitchAccount = async () => {
    await logout();
    await handleOwnerLogin();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-owner-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl border border-[#8DB8D2]/40 bg-[#131E29] text-[#F4F7FA] shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8DB8D2]/40 bg-[#8DB8D2]/12 text-[#9AC2DA]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="modal-owner-titulo"
                className="font-display text-xl font-bold text-[#F4F7FA]"
              >
                Acceso dueño
              </h2>
              <p className="text-xs text-[#8EA3B5]">
                Edición de precios y Gmail comercial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar acceso dueño"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1A2836] text-[#CBD7E2] transition-colors hover:border-[#8DB8D2]/60 hover:text-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {currentUser && !isAuthorized ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-red-400/35 bg-red-950/30 p-3.5 text-xs leading-relaxed text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <p className="font-semibold text-red-100">
                    Cuenta sin permisos de administrador
                  </p>
                  <p className="mt-1">
                    Iniciaste sesión con <strong>{currentUser.email}</strong>.
                    Solo la cuenta oficial de RS Remodelaciones puede modificar
                    los precios por m² y unitarios.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  disabled={isLoggingIn}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#8DB8D2] px-4 py-2.5 text-xs font-bold text-[#0C141C] transition-colors hover:bg-[#B9D5E6] disabled:opacity-60"
                >
                  Cambiar a cuenta autorizada
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#1A2836] px-4 py-2.5 text-xs font-semibold text-[#CBD7E2] hover:border-white/30"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>
            </div>
          ) : isAuthorized ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-[#8DB8D2]/35 bg-[#0C141C] p-4 text-xs leading-relaxed text-[#CBD7E2]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8DB8D2]" />
                <div>
                  <p className="font-semibold text-[#F4F7FA]">
                    Modo dueño habilitado
                  </p>
                  <p className="mt-1">
                    Conectado como{' '}
                    <strong className="text-[#9AC2DA]">
                      {currentUser?.email}
                    </strong>
                    . Ya podés modificar cualquier precio unitario y guardar los
                    cambios para todos los clientes.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#8DB8D2] px-4 py-2.5 text-xs font-bold text-[#0C141C] hover:bg-[#B9D5E6]"
                >
                  Volver a la calculadora
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#1A2836] px-4 py-2.5 text-xs font-semibold text-[#CBD7E2] hover:border-white/30"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar modo dueño
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-[#CBD7E2]">
                Ingresá con tu cuenta autorizada de{' '}
                <strong className="text-[#F4F7FA]">RS Remodelaciones</strong>{' '}
                para desbloquear la edición de precios por m², valores fijos y
                el envío por Gmail.
              </p>

              {authError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-400/35 bg-red-950/30 p-3 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleOwnerLogin}
                disabled={isLoggingIn}
                className="gsi-material-button flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-[#747775] bg-white px-4 py-2.5 text-sm font-medium text-[#1F1F1F] shadow-sm transition-colors hover:bg-[#F8F9FA] active:bg-[#E8EAED] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
              >
                <span className="h-5 w-5 shrink-0" aria-hidden="true">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="block h-full w-full"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </span>
                <span>
                  {isLoggingIn
                    ? 'Conectando...'
                    : 'Ingresar con Google (Dueño)'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
