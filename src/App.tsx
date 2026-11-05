import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useThemeStore } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';
import { ToastContainer } from './core/components/Toast';
import { ErrorBoundary } from './core/components/ErrorBoundary';

import { systemService } from './services/systemService';

export const App: React.FC = () => {
  const initTheme = useThemeStore((s) => s.initTheme);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    systemService.initSeedIfEmpty();
    initTheme();
    initAuth();
  }, [initTheme, initAuth]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  );
};

export default App;
