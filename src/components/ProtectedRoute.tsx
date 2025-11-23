import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { VersionSelectionModal } from './auth/VersionSelectionModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, initialize, preferredVersion, setPreferredVersion } = useAuthStore();
  const [showVersionModal, setShowVersionModal] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Show version selection modal if user is logged in but hasn't selected a version
    if (user && preferredVersion === null && !isLoading) {
      setShowVersionModal(true);
    }
  }, [user, preferredVersion, isLoading]);

  const handleVersionSelected = (version: 'v1' | 'v2') => {
    setPreferredVersion(version);
    setShowVersionModal(false);
    
    // Redirect to appropriate version
    if (version === 'v2') {
      window.location.href = '/v2';
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <VersionSelectionModal 
        open={showVersionModal} 
        onVersionSelected={handleVersionSelected}
      />
      {children}
    </>
  );
};
