import { Link, useLocation } from "wouter";
import { BookOpen, Library, Tags, BarChart2 } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Practice", icon: BookOpen },
    { href: "/words", label: "Words", icon: Library },
    { href: "/topics", label: "Topics", icon: Tags },
    { href: "/stats", label: "Stats", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/50 p-4 flex flex-col gap-8 shrink-0">
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-serif text-xl font-bold">
            学
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-primary">
            Manabu
          </span>
        </div>

        <ul className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.href} className="shrink-0">
                <Link href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
