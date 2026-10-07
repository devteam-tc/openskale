import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, paymentAPI, passengerAPI, trainAPI, bookingAPI, adminAPI } from '../api/client';
import { useAuthStore, useToastStore, useBookingStore } from '../stores';

// ============ Auth Hooks ============
export function useSignup() {
  const login = useAuthStore(s => s.login);
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: authAPI.signup,
    onSuccess: (data) => {
      login(data.user, data.token);
      addToast({ type: 'success', message: 'Account created successfully!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

export function useLogin() {
  const login = useAuthStore(s => s.login);
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      login(data.user, data.token);
      addToast({ type: 'success', message: 'Welcome back!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: authAPI.getProfile,
    enabled: useAuthStore.getState().isAuthenticated,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore(s => s.updateUser);
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      addToast({ type: 'success', message: 'Profile updated!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

// ============ Payment Method Hooks ============
export function usePaymentMethods() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: paymentAPI.getAll,
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: paymentAPI.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      addToast({ type: 'success', message: 'Payment method added!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: paymentAPI.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      addToast({ type: 'success', message: 'Payment method removed!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

// ============ Passenger Hooks ============
export function useSavedPassengers() {
  return useQuery({
    queryKey: ['passengers'],
    queryFn: passengerAPI.getAll,
  });
}

export function useAddPassenger() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: passengerAPI.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      addToast({ type: 'success', message: 'Passenger added to master list!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

export function useUpdatePassenger() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: ({ id, data }) => passengerAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      addToast({ type: 'success', message: 'Passenger updated!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

export function useRemovePassenger() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: passengerAPI.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      addToast({ type: 'success', message: 'Passenger removed!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

// ============ Train Hooks ============
export function useStations() {
  return useQuery({
    queryKey: ['stations'],
    queryFn: trainAPI.getStations,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useSearchTrains(params) {
  return useQuery({
    queryKey: ['trains', 'search', params],
    queryFn: () => trainAPI.search(params),
    enabled: !!params,
  });
}

export function useTrainAvailability(trainId, params) {
  return useQuery({
    queryKey: ['trains', trainId, 'availability', params],
    queryFn: () => trainAPI.getAvailability(trainId, params),
    enabled: !!trainId && !!params,
  });
}

// ============ Booking Hooks ============
export function useCreateBooking() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: bookingAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      addToast({ type: 'success', message: 'Booking confirmed!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: bookingAPI.getAll,
  });
}

export function useBookingById(id) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingAPI.getById(id),
    enabled: !!id,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: bookingAPI.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      addToast({ type: 'success', message: 'Booking cancelled successfully!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

// ============ Admin Hooks ============
export function useAdminAddTrain() {
  const queryClient = useQueryClient();
  const addToast = useToastStore(s => s.addToast);

  return useMutation({
    mutationFn: adminAPI.addTrain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trains'] });
      addToast({ type: 'success', message: 'Train route added!' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

export function useAdminTrains() {
  return useQuery({
    queryKey: ['admin', 'trains'],
    queryFn: adminAPI.getTrains,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminAPI.getDashboard,
  });
}
