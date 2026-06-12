import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">Проверяем авторизацию...</div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Card className="w-full max-w-xl shadow-md">
          <CardContent className="space-y-5 p-8 text-center">
            <h1 className="font-serif text-2xl font-bold text-primary">
              Статистика доступна после входа
            </h1>
            <p className="text-muted-foreground">
              Создайте аккаунт или войдите, чтобы сохранять прогресс, видеть
              точность ответов и отслеживать слабые слова.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
