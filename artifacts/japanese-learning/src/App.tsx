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
import { ProtectedRoute } from "@/components/protected-route";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
  <Route path="/login" component={Login} />

  <Route path="/">
    <ProtectedRoute>
      <Practice />
    </ProtectedRoute>
  </Route>

  <Route path="/words">
    <ProtectedRoute>
      <Words />
    </ProtectedRoute>
  </Route>

  <Route path="/topics">
    <ProtectedRoute>
      <Topics />
    </ProtectedRoute>
  </Route>

  <Route path="/stats">
    <ProtectedRoute>
      <Stats />
    </ProtectedRoute>
  </Route>

  <Route>
    <div className="text-center py-20 text-muted-foreground">Page not found</div>
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
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
