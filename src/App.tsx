import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Auth/Login';
import { SignUp } from './components/Auth/SignUp';
import { Dashboard } from './components/Dashboard/Dashboard';
import { StockDetails } from './components/Stock/StockDetails';
import { Portfolio } from './components/Portfolio/Portfolio';
import { Watchlist } from './components/Watchlist/Watchlist';
import { Profile } from './components/Profile/Profile';
import { BottomNav } from './components/Layout/BottomNav';
import { useNavigate } from './components/Dashboard/useNavigate';

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { currentPage, selectedStock } = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <Login onToggleMode={() => setAuthMode('signup')} />
    ) : (
      <SignUp onToggleMode={() => setAuthMode('login')} />
    );
  }

  const renderPage = () => {
    if (currentPage === 'stock' && selectedStock) {
      return <StockDetails symbol={selectedStock} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'trade':
        return <Watchlist />;
      case 'portfolio':
        return <Portfolio />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderPage()}
      <BottomNav />
    </div>
  );
}

export default App;
