import { create } from 'zustand';

type NavigationState = {
  currentPage: 'dashboard' | 'trade' | 'portfolio' | 'profile' | 'stock';
  selectedStock: string | null;
  navigateTo: (page: NavigationState['currentPage'], stock?: string) => void;
};

export const useNavigate = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  selectedStock: null,
  navigateTo: (page, stock) => set({ currentPage: page, selectedStock: stock || null }),
}));
