import { Home, TrendingUp, Briefcase, User } from 'lucide-react';
import { useNavigate } from '../Dashboard/useNavigate';

export const BottomNav = () => {
  const { currentPage, navigateTo } = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'trade', label: 'Trade', icon: TrendingUp },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-blue-600' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
