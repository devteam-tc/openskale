import { z } from 'zod';

// ============ Auth Schemas ============
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============ Profile Schema ============
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
});

// ============ Payment Method Schemas ============
export const cardSchema = z.object({
  type: z.enum(['debit', 'credit']),
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  cardHolder: z.string().min(2, 'Cardholder name is required'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3-4 digits'),
});

export const upiSchema = z.object({
  type: z.literal('upi'),
  upiId: z.string().regex(/^[\w.-]+@[\w]+$/, 'Enter valid UPI ID (e.g., name@upi)'),
});

export const paymentMethodSchema = z.discriminatedUnion('type', [
  cardSchema,
  upiSchema,
]);

// ============ Passenger Schema ============
export const passengerSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  age: z.coerce.number().int().min(1, 'Age must be at least 1').max(120, 'Age must be at most 120'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Select gender' }),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
});

// ============ Search Schema ============
export const searchSchema = z.object({
  source: z.string().min(1, 'Select source station'),
  destination: z.string().min(1, 'Select destination station'),
  date: z.string().min(1, 'Select journey date'),
  quota: z.string().default('General'),
}).refine(data => data.source !== data.destination, {
  message: 'Source and destination cannot be the same',
  path: ['destination'],
});

// ============ Booking Passenger Schema ============
export const bookingPassengerSchema = z.object({
  name: z.string().min(2, 'Passenger name is required'),
  age: z.coerce.number().int().min(1).max(120),
  gender: z.enum(['Male', 'Female', 'Other']),
  berthPreference: z.enum(['Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper', 'No Preference']).default('No Preference'),
});

export const bookingFormSchema = z.object({
  passengers: z.array(bookingPassengerSchema).min(1, 'Add at least one passenger').max(6, 'Maximum 6 passengers allowed'),
  classType: z.string().min(1, 'Select class'),
});

// ============ Admin - Train Route Schema ============
export const stationStopSchema = z.object({
  stationCode: z.string().min(1, 'Station code is required'),
  stationName: z.string().min(1, 'Station name is required'),
  city: z.string().min(1, 'City is required'),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  day: z.coerce.number().int().min(1).default(1),
  stopOrder: z.coerce.number().int().min(1),
});

export const trainRouteSchema = z.object({
  trainNumber: z.string().regex(/^\d{5}$/, 'Train number must be 5 digits'),
  trainName: z.string().min(2, 'Train name is required'),
  trainType: z.enum(['Express', 'Superfast', 'Rajdhani', 'Shatabdi', 'Duronto', 'Mail', 'Passenger']),
  stops: z.array(stationStopSchema).min(2, 'At least 2 stops required'),
  classes: z.array(z.object({
    classType: z.enum(['1A', '2A', '3A', 'SL', 'CC', '2S']),
    totalSeats: z.coerce.number().int().min(1),
    farePerKm: z.coerce.number().positive(),
  })).min(1, 'At least one class is required'),
});
