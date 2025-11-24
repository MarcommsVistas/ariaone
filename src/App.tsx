import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import V2Index from "./pages/v2/Index";
import Generate from "./pages/v2/Generate";
import Preview from "./pages/v2/Preview";
import AdminIndex from "./pages/v2/admin/Index";
import Templates from "./pages/v2/admin/Templates";
import Studio from "./pages/v2/admin/Studio";
import Categories from "./pages/v2/admin/Categories";
import Reviews from "./pages/v2/admin/Reviews";
import ReviewStudio from "./pages/v2/admin/ReviewStudio";
import BrandVoice from "./pages/v2/admin/BrandVoice";
import ProjectHistory from "./pages/v2/admin/ProjectHistory";
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
            <Route 
              path="/v2/preview/:instanceId" 
              element={
                <ProtectedRoute>
                  <Preview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2/admin/reviews" 
              element={
                <ProtectedRoute>
                  <Reviews />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2/admin/review/:instanceId" 
              element={
                <ProtectedRoute>
                  <ReviewStudio />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2/admin" 
              element={
                <ProtectedRoute>
                  <AdminIndex />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2/admin/templates" 
              element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2/admin/studio/:templateId" 
              element={
                <ProtectedRoute>
                  <Studio />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2/admin/categories" 
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2/admin/brand-voice" 
              element={
                <ProtectedRoute>
                  <BrandVoice />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/v2/admin/project-history" 
              element={
                <ProtectedRoute>
                  <ProjectHistory />
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
