import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application rendering failed", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="font-serif text-2xl font-bold">
              Не удалось открыть приложение
            </h1>
            <p className="text-sm text-muted-foreground">
              Обновите страницу. Если ошибка повторится, проверьте подключение к
              интернету.
            </p>
            <Button type="button" onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
