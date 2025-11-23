import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { AdminStudio } from "@/components/admin/AdminStudio";

const Studio = () => {
  const { userRole, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (userRole !== 'marcomms') {
    return <Navigate to="/v2" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationV2 />
      <div className="flex-1 overflow-hidden">
        <AdminStudio />
      </div>
    </div>
  );
};

export default Studio;
