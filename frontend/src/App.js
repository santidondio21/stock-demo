import React, { useState } from 'react';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import UserSelection from '@/pages/UserSelection';
import DepositoDashboard from '@/pages/DepositoDashboard';
import NegocioDashboard from '@/pages/NegocioDashboard';
import DemoBanner from '@/components/DemoBanner';
import { SessionProvider, useSession } from '@/context/SessionContext';

function AppContent() {
  const { ready } = useSession();
  const [selectedUser, setSelectedUser] = useState(() => {
    const savedUser = localStorage.getItem('dino_demo_user');
    return savedUser || null;
  });

  const handleSelectUser = (userRole) => {
    setSelectedUser(userRole);
    localStorage.setItem('dino_demo_user', userRole);
  };

  const handleLogout = () => {
    setSelectedUser(null);
    localStorage.removeItem('dino_demo_user');
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="text-stone-500 text-lg">Iniciando demo...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <DemoBanner />
      {!selectedUser ? (
        <UserSelection onSelectUser={handleSelectUser} />
      ) : selectedUser === 'deposito' ? (
        <DepositoDashboard onLogout={handleLogout} />
      ) : (
        <NegocioDashboard userRole={selectedUser} onLogout={handleLogout} />
      )}
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App;
