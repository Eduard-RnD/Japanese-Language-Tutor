import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          setLocation("/login");
          return;
        }

        setAllowed(true);
      })
      .finally(() => setLoading(false));
  }, [setLocation]);

  if (loading) {
    return <div className="p-8 text-muted-foreground">Checking authorization...</div>;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
