
import React, { useState } from 'react';
import Login from './components/Login';
import MainLayout from './components/MainLayout';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{email: string; name: string} | null>(null);

  const handleLogin = (email: string, pass: string): boolean => {
    if (email === 'iqbalassada17@gmail.com' && pass === '123456') {
      setIsAuthenticated(true);
      setUser({ email, name: 'Iqbal' });
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <div className="min-h-screen text-slate-200">
      {isAuthenticated ? (
        <MainLayout onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
