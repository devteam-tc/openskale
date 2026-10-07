import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users, Plus, Trash2, CreditCard, Wallet, Train, MapPin,
  Calendar, CheckCircle, ArrowLeft, User, Shield
} from 'lucide-react';
import { bookingFormSchema } from '../lib/schemas';
import { useBookingStore, useToastStore } from '../stores';
import { useSavedPassengers, usePaymentMethods, useCreateBooking } from '../hooks/queries';

// ============ Step Indicator ============
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Passengers' },
    { num: 2, label: 'Review' },
    { num: 3, label: 'Payment' },
    { num: 4, label: 'Confirmed' },
  ];

  return (
    <div className="booking-steps">
      {steps.map(step => (
        <div
          key={step.num}
          className={`booking-step ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}
        >
          <div className="step-number">
            {currentStep > step.num ? <CheckCircle size={14} /> : step.num}
          </div>
          <span className="step-label">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============ Train Summary Sidebar ============
function TrainSummary({ train, selectedClass, passengerCount }) {
  const fare = selectedClass?.fare || 0;
  const total = fare * Math.max(passengerCount, 1);

  return (
    <div className="card" style={{ position: 'sticky', top: '80px' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>Journey Summary</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Train size={16} style={{ color: 'var(--accent-secondary)' }} />
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{train?.train_name}</div>
          <div className="text-sm text-muted">{train?.train_number} · {train?.train_type}</div>
        </div>
      </div>

      <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{train?.departure_time}</div>
            <div className="text-sm text-muted">{train?.source_name || train?.source}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{train?.arrival_time}</div>
            <div className="text-sm text-muted">{train?.destination_name || train?.destination}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">Class</span>
          <span className="font-semibold">{selectedClass?.class_type}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">Fare per person</span>
          <span className="font-semibold">₹{fare}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">Passengers</span>
          <span className="font-semibold">{passengerCount}</span>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--accent-secondary)' }}>₹{total}</span>
        </div>
      </div>
    </div>
  );
}

// ============ Book Ticket Page ============
export default function BookTicketPage() {
  const navigate = useNavigate();
  const { selectedTrain, selectedClass, resetBooking } = useBookingStore();
  const addToast = useToastStore(s => s.addToast);
  const { data: savedPassengers = [] } = useSavedPassengers();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const createBookingMutation = useCreateBooking();

  const [step, setStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      passengers: [{ name: '', age: '', gender: '', berthPreference: 'No Preference' }],
      classType: selectedClass?.class_type || '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'passengers' });
  const watchPassengers = watch('passengers');

  useEffect(() => {
    if (!selectedTrain) {
      navigate('/');
    }
  }, [selectedTrain, navigate]);

  if (!selectedTrain) return null;

  const addSavedPassenger = (passenger) => {
    append({
      name: passenger.name,
      age: passenger.age,
      gender: passenger.gender,
      berthPreference: 'No Preference',
    });
  };

  // Step 1: Add passengers
  const handlePassengerSubmit = (data) => {
    setStep(2);
  };

  // Step 2 -> 3: Review and proceed to payment
  const handleProceedToPayment = () => {
    setStep(3);
  };

  // Step 3: Process payment and create booking
  const handlePayment = async () => {
    if (!selectedPayment && paymentMethods.length > 0) {
      addToast({ type: 'error', message: 'Please select a payment method' });
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const bookingData = {
        trainId: selectedTrain.id,
        source: selectedTrain.source,
        destination: selectedTrain.destination,
        journeyDate: selectedTrain.journey_date || new Date().toISOString().split('T')[0],
        classType: selectedClass?.class_type,
        quota: 'General',
        passengers: watchPassengers,
        paymentMethodId: selectedPayment,
      };

      const result = await createBookingMutation.mutateAsync(bookingData);
      setBookingResult(result.booking);
      setStep(4);
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => { resetBooking(); navigate('/'); }} id="back-to-search">
          <ArrowLeft size={16} /> Back to Search
        </button>
      </div>

      <StepIndicator currentStep={step} />

      <div className="sidebar-layout">
        <div>
          {/* Step 1: Passengers */}
          {step === 1 && (
            <div className="card animate-in">
              <div className="card-header">
                <h2 className="card-title"><Users size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />Passenger Details</h2>
              </div>

              {/* Saved Passengers Quick Add */}
              {savedPassengers.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p className="text-sm text-muted mb-1">Quick add from saved list:</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {savedPassengers.map(p => (
                      <button
                        key={p.id}
                        className="btn btn-secondary btn-sm"
                        onClick={() => addSavedPassenger(p)}
                        disabled={fields.length >= 6}
                        type="button"
                      >
                        <User size={12} /> {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(handlePassengerSubmit)} id="passenger-form">
                {fields.map((field, index) => (
                  <div key={field.id} style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                        Passenger {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(index)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="form-row form-row-4">
                      <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                          {...register(`passengers.${index}.name`)}
                          className={`form-input ${errors.passengers?.[index]?.name ? 'error' : ''}`}
                          placeholder="Full name"
                        />
                        {errors.passengers?.[index]?.name && (
                          <p className="form-error">{errors.passengers[index].name.message}</p>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Age</label>
                        <input
                          {...register(`passengers.${index}.age`)}
                          type="number"
                          className={`form-input ${errors.passengers?.[index]?.age ? 'error' : ''}`}
                          placeholder="Age"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select
                          {...register(`passengers.${index}.gender`)}
                          className={`form-select ${errors.passengers?.[index]?.gender ? 'error' : ''}`}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Berth Pref.</label>
                        <select
                          {...register(`passengers.${index}.berthPreference`)}
                          className="form-select"
                        >
                          <option value="No Preference">No Preference</option>
                          <option value="Lower">Lower</option>
                          <option value="Middle">Middle</option>
                          <option value="Upper">Upper</option>
                          <option value="Side Lower">Side Lower</option>
                          <option value="Side Upper">Side Upper</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {errors.passengers?.root && (
                  <p className="form-error mb-2">{errors.passengers.root.message}</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => append({ name: '', age: '', gender: '', berthPreference: 'No Preference' })}
                    disabled={fields.length >= 6}
                    id="add-passenger"
                  >
                    <Plus size={14} /> Add Passenger
                  </button>
                  <button type="submit" className="btn btn-primary" id="proceed-to-review">
                    Proceed to Review <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="card animate-in">
              <div className="card-header">
                <h2 className="card-title"><Shield size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />Review Booking</h2>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Passengers</h3>
                {watchPassengers.map((p, i) => (
                  <div key={i} className="passenger-card" style={{ marginBottom: '0.5rem' }}>
                    <div className="passenger-info">
                      <div className="passenger-avatar"><User size={16} /></div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.name}</div>
                        <div className="text-sm text-muted">{p.gender} · {p.age} yrs · {p.berthPreference}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)} id="back-to-passengers">
                  <ArrowLeft size={14} /> Edit Passengers
                </button>
                <button className="btn btn-primary" onClick={handleProceedToPayment} id="proceed-to-payment">
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="card animate-in">
              <div className="card-header">
                <h2 className="card-title"><CreditCard size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />Payment</h2>
              </div>

              {paymentMethods.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {paymentMethods.map(pm => (
                    <div
                      key={pm.id}
                      className={`payment-method-card ${selectedPayment === pm.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPayment(pm.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selectedPayment === pm.id ? 'var(--accent-primary)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedPayment === pm.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-primary)' }} />}
                        </div>
                        {pm.type === 'upi' ? <Wallet size={18} /> : <CreditCard size={18} />}
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>
                            {pm.type === 'upi' ? pm.upi_id : `${pm.type} Card •••• ${pm.card_number?.slice(-4)}`}
                          </div>
                          <div className="text-sm text-muted">
                            {pm.type === 'upi' ? 'UPI' : pm.card_holder}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.25rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(234,179,8,0.2)', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--warning)' }}>
                    No saved payment methods. A simulated payment will be used.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button className="btn btn-primary btn-lg" onClick={handlePayment} disabled={processing} id="pay-now">
                  {processing ? (
                    <>
                      <div className="spinner" /> Processing Payment...
                    </>
                  ) : (
                    <>Pay ₹{(selectedClass?.fare || 0) * watchPassengers.length}</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && bookingResult && (
            <div className="animate-in">
              <div className="ticket-card">
                <div className="ticket-header">
                  <div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>PNR Number</div>
                    <div className="ticket-pnr">{bookingResult.pnr}</div>
                  </div>
                  <span className="badge badge-success" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>
                    {bookingResult.status}
                  </span>
                </div>

                <div className="ticket-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Train</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedTrain?.train_name}</div>
                      <div className="text-sm text-muted">{selectedTrain?.train_number}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Class</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedClass?.class_type}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedTrain?.departure_time}</div>
                      <div className="text-sm text-muted">{selectedTrain?.source_name || selectedTrain?.source}</div>
                    </div>
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                      {selectedTrain?.duration || '—'}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedTrain?.arrival_time}</div>
                      <div className="text-sm text-muted">{selectedTrain?.destination_name || selectedTrain?.destination}</div>
                    </div>
                  </div>

                  <hr className="ticket-divider" />

                  <h4 style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Passengers</h4>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Age</th>
                          <th>Gender</th>
                          <th>Berth</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bookingResult.passengers || watchPassengers).map((p, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                            <td>{p.age}</td>
                            <td>{p.gender}</td>
                            <td>{p.berth_preference || p.berthPreference}</td>
                            <td><span className="badge badge-success">Confirmed</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontWeight: 600 }}>Total Fare</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>₹{bookingResult.total_fare}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => { resetBooking(); navigate('/bookings'); }} id="view-bookings">
                  View All Bookings
                </button>
                <button className="btn btn-primary" onClick={() => { resetBooking(); navigate('/'); }} id="book-another">
                  Book Another Ticket
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {step < 4 && (
          <TrainSummary
            train={selectedTrain}
            selectedClass={selectedClass}
            passengerCount={watchPassengers?.length || 1}
          />
        )}
      </div>
    </div>
  );
}
