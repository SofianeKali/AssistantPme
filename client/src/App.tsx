import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InternalShell } from "@/components/InternalShell";
import { InternalHeader } from "@/components/InternalHeader";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import BetaSignup from "@/pages/BetaSignup";
import Contact from "@/pages/Contact";
import Subscribe from "@/pages/Subscribe";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Emails from "@/pages/Emails";
import Calendar from "@/pages/Calendar";
import Documents from "@/pages/Documents";
import Alerts from "@/pages/Alerts";
import Tasks from "@/pages/Tasks";
import Tags from "@/pages/Tags";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/beta" component={BetaSignup} />
          <Route path="/contact" component={Contact} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/login" component={Login} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/emails" component={Emails} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/documents" component={Documents} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/tags" component={Tags} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        {isLoading || !isAuthenticated ? (
          <>
            <Router />
            <Toaster />
          </>
        ) : (
          <SidebarProvider style={style}>
            <InternalShell>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <InternalHeader />
                  <main className="flex-1 overflow-auto pb-16 md:pb-0">
                    <Router />
                  </main>
                </div>
              </div>
            </InternalShell>
            <MobileBottomNav />
            <Toaster />
          </SidebarProvider>
        )}
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
