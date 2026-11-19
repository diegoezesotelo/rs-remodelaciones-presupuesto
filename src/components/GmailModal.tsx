import type { User } from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  FileEdit,
  Inbox,
  LogOut,
  Mail,
  RefreshCw,
  Send,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createBudgetDraft,
  fetchRecentGmailMessages,
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
  sendBudgetEmail,
  type GmailMessageSummary,
} from '../lib/gmailAuth';
import { RS_GMAIL_EMAIL } from '../types/budget';

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetSummaryText: string;
  isBudgetReady: boolean;
  onAuthUserChange?: (email: string | null) => void;
}

type PendingAction = 'send' | 'draft' | null;
type GmailTab = 'compose' | 'inbox';

export function GmailModal({
  isOpen,
  onClose,
  budgetSummaryText,
  isBudgetReady,
  onAuthUserChange,
}: GmailModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [accountHint, setAccountHint] = useState<string>(RS_GMAIL_EMAIL);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<GmailTab>('compose');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [ccEmail, setCcEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>(
    'Presupuesto Online — RS Remodelaciones'
  );
  const [customBody, setCustomBody] = useState<string>(budgetSummaryText);

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState<boolean>(false);
  const [inboxError, setInboxError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
        setNeedsAuth(false);
        onAuthUserChange?.(authedUser.email ?? null);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
        onAuthUserChange?.(null);
      }
    );
    return () => unsubscribe();
  }, [onAuthUserChange]);

  useEffect(() => {
    if (isOpen) {
      setCustomBody(budgetSummaryText);
      setActionResult(null);
      setPendingAction(null);
    }
  }, [isOpen, budgetSummaryText]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingAction) {
          setPendingAction(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, pendingAction]);

  const loadInbox = async (accessToken: string) => {
    setIsLoadingInbox(true);
    setInboxError(null);
    try {
      const list = await fetchRecentGmailMessages(accessToken, 6);
      setMessages(list);
    } catch (err) {
      setInboxError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar la bandeja de Gmail.'
      );
    } finally {
      setIsLoadingInbox(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn(accountHint);
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        onAuthUserChange?.(result.user.email ?? null);
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
    setToken(null);
    setUser(null);
    setNeedsAuth(true);
    setMessages([]);
    setActionResult(null);
    onAuthUserChange?.(null);
    await handleLogin();
  };

  const handleLogout = async () => {
    await logout();
    setToken(null);
    setUser(null);
    setNeedsAuth(true);
    setMessages([]);
    setActionResult(null);
    onAuthUserChange?.(null);
  };

  const handleExecuteConfirmedAction = async () => {
    if (!pendingAction) return;
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      setNeedsAuth(true);
      setPendingAction(null);
      return;
    }

    setIsSending(true);
    setActionResult(null);
    try {
      if (pendingAction === 'send') {
        await sendBudgetEmail({
          accessToken: activeToken,
          to: recipientEmail,
          cc: ccEmail,
          subject,
          body: customBody,
        });
        setActionResult({
          type: 'success',
          message: `Presupuesto enviado correctamente a ${recipientEmail} desde ${
            user?.email ?? 'la cuenta conectada'
          }.`,
        });
      } else {
        await createBudgetDraft({
          accessToken: activeToken,
          to: recipientEmail,
          cc: ccEmail,
          subject,
          body: customBody,
        });
        setActionResult({
          type: 'success',
          message: `Borrador guardado en el Gmail de ${
            user?.email ?? 'RS Remodelaciones'
          }.`,
        });
      }
      setPendingAction(null);
    } catch (err) {
      setActionResult({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al operar con Gmail.',
      });
      setPendingAction(null);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    recipientEmail.trim()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-gmail-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pendingAction) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-[#8DB8D2]/40 bg-[#131E29] text-[#F4F7FA] shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#131E29]/95 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8DB8D2]/40 bg-[#8DB8D2]/12 text-[#9AC2DA]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="modal-gmail-titulo"
                className="font-display text-xl font-bold text-[#F4F7FA] sm:text-2xl"
              >
                Gmail · RS Remodelaciones
              </h2>
              <p className="text-xs text-[#8EA3B5]">
                Cuenta comercial: {RS_GMAIL_EMAIL}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de Gmail"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1A2836] text-[#CBD7E2] transition-colors hover:border-[#8DB8D2]/60 hover:text-[#F4F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {needsAuth || !token ? (
            /* Sign-in / Account Selection View */
            <div className="space-y-5">
              <div className="rounded-xl border border-[#8DB8D2]/30 bg-[#0C141C] p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-[#F4F7FA]">
                  Elegí la cuenta de correo de RS Remodelaciones
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#CBD7E2]">
                  Al presionar el botón de Google se abrirá el selector de
                  cuentas para que elijas el mail comercial de{' '}
                  <strong className="text-[#F4F7FA]">RS Remodelaciones</strong>{' '}
                  (distinto a tu correo personal).
                </p>

                <div className="mt-4">
                  <label
                    htmlFor="gmail-hint-input"
                    className="block text-xs font-medium text-[#8EA3B5]"
                  >
                    Correo de RS Remodelaciones (preseleccionado)
                  </label>
                  <input
                    id="gmail-hint-input"
                    type="email"
                    value={accountHint}
                    onChange={(e) => setAccountHint(e.target.value)}
                    placeholder={RS_GMAIL_EMAIL}
                    className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#131E29] px-3.5 text-sm text-[#F4F7FA] placeholder-[#5F7487] focus:border-[#8DB8D2] focus:outline-none focus:ring-1 focus:ring-[#8DB8D2]"
                  />
                </div>

                {authError && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/35 bg-red-950/30 p-3 text-xs text-red-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="mt-5 flex justify-center sm:justify-start">
                  {/* Official Google Sign-In Button Styling */}
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="gsi-material-button inline-flex min-h-[44px] items-center gap-3 rounded-lg border border-[#747775] bg-white px-4 py-2.5 text-sm font-medium text-[#1F1F1F] shadow-sm transition-colors hover:bg-[#F8F9FA] active:bg-[#E8EAED] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB8D2]"
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
                      {isLoggingIn ? 'Conectando...' : 'Sign in with Google'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Authenticated Gmail Workspace */
            <div className="space-y-5">
              {/* Connected Account Banner with Switch Account Option */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#8DB8D2]/35 bg-[#0C141C] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8DB8D2]/20 text-[#9AC2DA]">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-[#8EA3B5]">
                        Cuenta conectada
                      </div>
                      <div className="truncate text-sm font-semibold text-[#F4F7FA]">
                        {user?.email ?? 'Cuenta Gmail conectada'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSwitchAccount}
                      className="min-h-[38px] rounded-lg border border-white/15 bg-[#1A2836] px-3 py-1.5 text-xs font-semibold text-[#B9D5E6] transition-colors hover:border-[#8DB8D2]"
                    >
                      Cambiar cuenta
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      aria-label="Desconectar cuenta de Gmail"
                      className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-white/10 bg-[#1A2836] text-[#8EA3B5] transition-colors hover:text-[#F4F7FA]"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {user?.email &&
                  user.email.toLowerCase() !== RS_GMAIL_EMAIL.toLowerCase() && (
                    <div className="rounded-xl border border-[#8DB8D2]/25 bg-[#0C141C]/80 px-3.5 py-2.5 text-xs text-[#CBD7E2]">
                      Sesión iniciada con <strong className="text-[#F4F7FA]">{user.email}</strong>. Si querés operar con la cuenta oficial, tocá{' '}
                      <strong className="text-[#9AC2DA]">Cambiar cuenta</strong> y elegí{' '}
                      <strong className="text-[#F4F7FA]">{RS_GMAIL_EMAIL}</strong>.
                    </div>
                  )}
              </div>

              {/* Navigation Tabs inside Modal */}
              <div
                className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-[#0C141C] p-1"
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'compose'}
                  onClick={() => setActiveTab('compose')}
                  className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'compose'
                      ? 'bg-[#8DB8D2] text-[#0C141C]'
                      : 'text-[#8EA3B5] hover:text-[#F4F7FA]'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Enviar presupuesto
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'inbox'}
                  onClick={() => {
                    setActiveTab('inbox');
                    if (messages.length === 0 && token) {
                      void loadInbox(token);
                    }
                  }}
                  className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'inbox'
                      ? 'bg-[#8DB8D2] text-[#0C141C]'
                      : 'text-[#8EA3B5] hover:text-[#F4F7FA]'
                  }`}
                >
                  <Inbox className="h-4 w-4" />
                  Correos recientes
                </button>
              </div>

              {activeTab === 'compose' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="gmail-to"
                        className="block text-xs font-medium text-[#CBD7E2]"
                      >
                        Email destinatario (cliente o copia)
                      </label>
                      <input
                        id="gmail-to"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="cliente@ejemplo.com"
                        className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0C141C] px-3.5 text-sm text-[#F4F7FA] placeholder-[#5F7487] focus:border-[#8DB8D2] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="gmail-cc"
                        className="block text-xs font-medium text-[#CBD7E2]"
                      >
                        Con copia / CC (opcional)
                      </label>
                      <input
                        id="gmail-cc"
                        type="email"
                        value={ccEmail}
                        onChange={(e) => setCcEmail(e.target.value)}
                        placeholder={RS_GMAIL_EMAIL}
                        className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0C141C] px-3.5 text-sm text-[#F4F7FA] placeholder-[#5F7487] focus:border-[#8DB8D2] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="gmail-subject"
                      className="block text-xs font-medium text-[#CBD7E2]"
                    >
                      Asunto
                    </label>
                    <input
                      id="gmail-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-[#0C141C] px-3.5 text-sm text-[#F4F7FA] focus:border-[#8DB8D2] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gmail-body"
                      className="block text-xs font-medium text-[#CBD7E2]"
                    >
                      Detalle del presupuesto
                    </label>
                    <textarea
                      id="gmail-body"
                      rows={6}
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0C141C] p-3.5 text-xs leading-relaxed text-[#F4F7FA] focus:border-[#8DB8D2] focus:outline-none"
                    />
                  </div>

                  {actionResult && (
                    <div
                      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                        actionResult.type === 'success'
                          ? 'border-emerald-400/35 bg-emerald-950/30 text-emerald-200'
                          : 'border-red-400/35 bg-red-950/30 text-red-200'
                      }`}
                    >
                      {actionResult.type === 'success' ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      )}
                      <span>{actionResult.message}</span>
                    </div>
                  )}

                  {/* Explicit Confirmation Box before sending or saving draft */}
                  {pendingAction ? (
                    <div className="rounded-xl border border-[#8DB8D2] bg-[#0C141C] p-4 space-y-3">
                      <div className="text-sm font-semibold text-[#F4F7FA]">
                        {pendingAction === 'send'
                          ? '¿Confirmás enviar este presupuesto por correo?'
                          : '¿Confirmás guardar este presupuesto como borrador en Gmail?'}
                      </div>
                      <dl className="space-y-1 text-xs text-[#CBD7E2]">
                        <div>
                          <span className="text-[#8EA3B5]">Cuenta emisora: </span>
                          {user?.email}
                        </div>
                        <div>
                          <span className="text-[#8EA3B5]">Para: </span>
                          {recipientEmail || '(Sin destinatario)'}
                        </div>
                        <div>
                          <span className="text-[#8EA3B5]">Asunto: </span>
                          {subject}
                        </div>
                      </dl>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleExecuteConfirmedAction}
                          disabled={isSending}
                          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#8DB8D2] px-4 py-2.5 text-xs font-bold text-[#0C141C] hover:bg-[#B9D5E6] disabled:opacity-50"
                        >
                          {isSending
                            ? 'Procesando...'
                            : pendingAction === 'send'
                              ? 'Confirmar y enviar'
                              : 'Confirmar y guardar borrador'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction(null)}
                          disabled={isSending}
                          className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-[#1A2836] px-4 py-2.5 text-xs font-semibold text-[#CBD7E2]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <button
                        type="button"
                        disabled={!isBudgetReady || !isEmailValid || !customBody.trim()}
                        onClick={() => setPendingAction('send')}
                        className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#8DB8D2] px-4 py-3 text-xs font-bold tracking-wide text-[#0C141C] transition-colors hover:bg-[#B9D5E6] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                        Enviar presupuesto por Gmail
                      </button>

                      <button
                        type="button"
                        disabled={!isBudgetReady || !customBody.trim()}
                        onClick={() => setPendingAction('draft')}
                        className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#1A2836] px-4 py-3 text-xs font-semibold text-[#F4F7FA] transition-colors hover:border-[#8DB8D2]/60 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FileEdit className="h-4 w-4" />
                        Guardar borrador
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Recent Messages View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8EA3B5]">
                      Últimos correos de {user?.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => token && void loadInbox(token)}
                      disabled={isLoadingInbox}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#1A2836] px-3 text-xs font-medium text-[#CBD7E2] hover:border-[#8DB8D2]"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${
                          isLoadingInbox ? 'animate-spin' : ''
                        }`}
                      />
                      Actualizar
                    </button>
                  </div>

                  {inboxError && (
                    <div className="rounded-xl border border-red-400/35 bg-red-950/30 p-3 text-xs text-red-200">
                      {inboxError}
                    </div>
                  )}

                  {isLoadingInbox ? (
                    <div className="rounded-xl border border-white/10 bg-[#0C141C] p-6 text-center text-xs text-[#8EA3B5]">
                      Cargando correos de Gmail...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 bg-[#0C141C] p-6 text-center text-xs text-[#8EA3B5]">
                      No se encontraron mensajes recientes.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-[#0C141C]">
                      {messages.map((msg) => (
                        <div key={msg.id} className="p-3.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="truncate text-xs font-semibold text-[#F4F7FA]">
                              {msg.subject}
                            </div>
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-[#9AC2DA]">
                            {msg.from || msg.to}
                          </div>
                          {msg.snippet && (
                            <p className="mt-1 line-clamp-2 text-xs text-[#8EA3B5]">
                              {msg.snippet}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
