import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ Auth Store ============
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============ Booking Store ============
export const useBookingStore = create((set, get) => ({
  // Search state
  searchParams: null,
  searchResults: [],

  // Selected train & class
  selectedTrain: null,
  selectedClass: null,

  // Booking passengers
  passengers: [],

  // Payment
  selectedPaymentMethod: null,

  // Current step (1-4)
  currentStep: 1,

  // Actions
  setSearchParams: (params) => set({ searchParams: params }),
  setSearchResults: (results) => set({ searchResults: results }),

  selectTrain: (train, classType) => set({
    selectedTrain: train,
    selectedClass: classType,
    currentStep: 2,
  }),

  setPassengers: (passengers) => set({ passengers }),

  goToStep: (step) => set({ currentStep: step }),

  setPaymentMethod: (method) => set({ selectedPaymentMethod: method }),

  confirmBooking: () => set({ currentStep: 4 }),

  resetBooking: () => set({
    searchParams: null,
    searchResults: [],
    selectedTrain: null,
    selectedClass: null,
    passengers: [],
    selectedPaymentMethod: null,
    currentStep: 1,
  }),
}));

// ============ Toast Store ============
export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now();
    set({ toasts: [...get().toasts, { ...toast, id }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter(t => t.id !== id) });
    }, 4000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },
}));
