import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useThemeStore } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';
import { ToastContainer } from './core/components/Toast';
import { ErrorBoundary } from './core/components/ErrorBoundary';

export const App: React.FC = () => {
  const initTheme = useThemeStore((s) => s.initTheme);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
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
