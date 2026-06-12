import { Link, useLocation } from "wouter";
import { BarChart2, BookOpen, Library, LogOut, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, loading, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Обучение", icon: BookOpen },
    { href: "/words", label: "Слова", icon: Library },
    { href: "/topics", label: "Темы", icon: Tags },
    { href: "/stats", label: "Статистика", icon: BarChart2 },
  ];

  const handleLogout = async () => {
    await logout();
    if (location === "/stats") setLocation("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <nav className="flex w-full shrink-0 flex-col gap-5 border-b border-border bg-card/50 p-4 md:w-64 md:gap-8 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-2 py-2 md:py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary font-serif text-xl font-bold text-primary-foreground">
            学
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-primary">
            Manabu
          </span>
        </div>

        <ul className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.href} className="shrink-0">
                <Link href={item.href}>
                  <div
                    className={`flex cursor-pointer items-center gap-3 rounded-md px-4 py-3 transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-border pt-4">
          {loading ? (
            <p className="px-2 text-sm text-muted-foreground">
              Проверяем вход...
            </p>
          ) : user ? (
            <div className="space-y-3">
              <div className="px-2">
                <p className="truncate text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === "admin" ? "Администратор" : "Пользователь"}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              <Button asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
