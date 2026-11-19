import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0C141C] px-4 text-[#F4F7FA]">
          <div className="max-w-md rounded-2xl border border-[#8DB8D2]/35 bg-[#131E29] p-6 text-center">
            <h1 className="font-display text-2xl font-bold text-[#F4F7FA]">
              Ocurrió un inconveniente inesperado
            </h1>
            <p className="mt-2 text-sm text-[#CBD7E2]">
              Recargá la página para volver a cargar la calculadora de RS Remodelaciones.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#8DB8D2] px-5 py-2.5 text-sm font-bold text-[#0C141C] transition-colors hover:bg-[#B9D5E6]"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
