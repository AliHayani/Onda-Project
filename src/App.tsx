import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './features/auth/useAuth';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
