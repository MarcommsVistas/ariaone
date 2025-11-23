import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import V2Index from "./pages/v2/Index";
import Generate from "./pages/v2/Generate";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./store/useAuthStore";
import { FontManager } from "./components/FontManager";

const queryClient = new QueryClient();

const App = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FontManager />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" replace /> : <Login />}
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2" 
              element={
                <ProtectedRoute>
                  <V2Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2/generate/:templateId" 
              element={
                <ProtectedRoute>
                  <Generate />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
