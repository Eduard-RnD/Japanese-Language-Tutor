import { Layout } from "@/components/layout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Practice from "@/pages/practice";
import Words from "@/pages/words";
import Topics from "@/pages/topics";
import Stats from "@/pages/stats";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/" component={Practice} />
        <Route path="/words" component={Words} />
        <Route path="/topics" component={Topics} />
        <Route path="/stats">
          <ProtectedRoute>
            <Stats />
          </ProtectedRoute>
        </Route>
        <Route>
          <div className="py-20 text-center text-muted-foreground">
            Страница не найдена
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
