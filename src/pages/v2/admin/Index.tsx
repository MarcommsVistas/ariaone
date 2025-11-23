import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";
import { NavigationV2 } from "@/components/v2/NavigationV2";
import { AdminDashboardV2 } from "@/components/v2/AdminDashboardV2";

const AdminIndex = () => {
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
      <div className="flex-1 overflow-auto">
        <AdminDashboardV2 />
      </div>
    </div>
  );
};

export default AdminIndex;
