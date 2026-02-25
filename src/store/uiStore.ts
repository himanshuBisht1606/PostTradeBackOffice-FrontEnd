import { create } from 'zustand';
import type { BreadcrumbItem } from '@core/types/common.types';

interface UiState {
  sidebarCollapsed: boolean;
  breadcrumb: BreadcrumbItem[];
  toggleSidebar: () => void;
  setBreadcrumb: (items: BreadcrumbItem[]) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  breadcrumb: [],

  toggleSidebar() {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setBreadcrumb(items) {
    set({ breadcrumb: items });
  },
}));
