import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Введите корректный email", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Пароль должен содержать минимум 8 символов",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast({
          title:
            response.status === 409
              ? "Email уже зарегистрирован"
              : "Не удалось создать аккаунт",
          description: data?.error,
          variant: "destructive",
        });
        return;
      }

      await refreshUser();
      toast({ title: "Аккаунт создан" });
      setLocation("/");
    } catch {
      toast({
        title: "Не удалось создать аккаунт",
        description: "Проверьте подключение и попробуйте ещё раз.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <h1 className="font-serif text-2xl font-bold text-primary">
            Регистрация
          </h1>
          <p className="text-sm text-muted-foreground">
            Создайте аккаунт, чтобы сохранять прогресс.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-1.5">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="register-password">Пароль</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="register-confirm-password">
                Повторите пароль
              </Label>
              <Input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? "Создаём аккаунт..." : "Регистрация"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Войти
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
