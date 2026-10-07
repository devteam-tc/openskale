import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import {
  User, Mail, Phone, CreditCard, Plus, Trash2, Star,
  Users, Edit2, Save, X, Wallet
} from 'lucide-react';
import { useAuthStore, useToastStore } from '../stores';
import { profileSchema, passengerSchema, cardSchema, upiSchema } from '../lib/schemas';
import {
  useUpdateProfile,
  usePaymentMethods, useAddPaymentMethod, useRemovePaymentMethod,
  useSavedPassengers, useAddPassenger, useUpdatePassenger, useRemovePassenger,
} from '../hooks/queries';

// ============ Profile Tab ============
function ProfileTab() {
  const user = useAuthStore(s => s.user);
  const updateMutation = useUpdateProfile();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const onSubmit = (data) => updateMutation.mutate(data);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Personal Information</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          <p className="text-sm text-muted mt-1">Email cannot be changed</p>
        </div>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input {...register('name')} className={`form-input ${errors.name ? 'error' : ''}`} id="profile-name" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input {...register('phone')} className={`form-input ${errors.phone ? 'error' : ''}`} id="profile-phone" />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending} id="profile-save">
          {updateMutation.isPending ? <><div className="spinner" /> Saving...</> : <><Save size={16} /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}

// ============ Payment Methods Tab ============
function PaymentTab() {
  const { data: methods = [], isLoading } = usePaymentMethods();
  const addMutation = useAddPaymentMethod();
  const removeMutation = useRemovePaymentMethod();
  const [showForm, setShowForm] = useState(false);
  const [payType, setPayType] = useState('debit');

  const cardForm = useForm({ resolver: zodResolver(cardSchema), defaultValues: { type: 'debit' } });
  const upiForm = useForm({ resolver: zodResolver(upiSchema), defaultValues: { type: 'upi' } });

  const onAddCard = async (data) => {
    await addMutation.mutateAsync(data);
    setShowForm(false);
    cardForm.reset();
  };

  const onAddUPI = async (data) => {
    await addMutation.mutateAsync(data);
    setShowForm(false);
    upiForm.reset();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Payment Methods</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)} id="add-payment-btn">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add New</>}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div className="tabs" style={{ marginBottom: '1rem' }}>
            <button className={`tab ${payType === 'debit' ? 'active' : ''}`} onClick={() => { setPayType('debit'); cardForm.setValue('type', 'debit'); }}>Debit Card</button>
            <button className={`tab ${payType === 'credit' ? 'active' : ''}`} onClick={() => { setPayType('credit'); cardForm.setValue('type', 'credit'); }}>Credit Card</button>
            <button className={`tab ${payType === 'upi' ? 'active' : ''}`} onClick={() => setPayType('upi')}>UPI</button>
          </div>

          {payType !== 'upi' ? (
            <form onSubmit={cardForm.handleSubmit(onAddCard)}>
              <input type="hidden" {...cardForm.register('type')} />
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input {...cardForm.register('cardNumber')} className={`form-input ${cardForm.formState.errors.cardNumber ? 'error' : ''}`} placeholder="1234567890123456" id="card-number" />
                {cardForm.formState.errors.cardNumber && <p className="form-error">{cardForm.formState.errors.cardNumber.message}</p>}
              </div>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input {...cardForm.register('cardHolder')} className={`form-input ${cardForm.formState.errors.cardHolder ? 'error' : ''}`} id="card-holder" />
                  {cardForm.formState.errors.cardHolder && <p className="form-error">{cardForm.formState.errors.cardHolder.message}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry (MM/YY)</label>
                  <input {...cardForm.register('expiry')} className={`form-input ${cardForm.formState.errors.expiry ? 'error' : ''}`} placeholder="12/25" id="card-expiry" />
                  {cardForm.formState.errors.expiry && <p className="form-error">{cardForm.formState.errors.expiry.message}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input {...cardForm.register('cvv')} type="password" className={`form-input ${cardForm.formState.errors.cvv ? 'error' : ''}`} placeholder="***" id="card-cvv" />
                  {cardForm.formState.errors.cvv && <p className="form-error">{cardForm.formState.errors.cvv.message}</p>}
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={addMutation.isPending} id="save-card">
                {addMutation.isPending ? <><div className="spinner" /> Saving...</> : 'Save Card'}
              </button>
            </form>
          ) : (
            <form onSubmit={upiForm.handleSubmit(onAddUPI)}>
              <input type="hidden" {...upiForm.register('type')} />
              <div className="form-group">
                <label className="form-label">UPI ID</label>
                <input {...upiForm.register('upiId')} className={`form-input ${upiForm.formState.errors.upiId ? 'error' : ''}`} placeholder="yourname@upi" id="upi-id" />
                {upiForm.formState.errors.upiId && <p className="form-error">{upiForm.formState.errors.upiId.message}</p>}
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={addMutation.isPending} id="save-upi">
                {addMutation.isPending ? <><div className="spinner" /> Saving...</> : 'Save UPI'}
              </button>
            </form>
          )}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '60px' }} />)}
        </div>
      ) : methods.length === 0 ? (
        <div className="empty-state">
          <Wallet size={48} />
          <h3>No payment methods</h3>
          <p>Add a debit/credit card or UPI to make payments faster</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {methods.map(m => (
            <div key={m.id} className="payment-method-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: m.type === 'upi' ? 'var(--info-bg)' : 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.type === 'upi' ? <Wallet size={18} style={{ color: 'var(--info)' }} /> : <CreditCard size={18} style={{ color: 'var(--success)' }} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {m.type === 'upi' ? m.upi_id : `${m.type} Card •••• ${m.card_number?.slice(-4)}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {m.type === 'upi' ? 'UPI' : `${m.card_holder} · Exp ${m.expiry}`}
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => removeMutation.mutate(m.id)} style={{ color: 'var(--danger)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Passengers Tab ============
function PassengersTab() {
  const { data: passengers = [], isLoading } = useSavedPassengers();
  const addMutation = useAddPassenger();
  const removeMutation = useRemovePassenger();
  const [showForm, setShowForm] = useState(false);
  const addToast = useToastStore(s => s.addToast);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passengerSchema),
  });

  const onAdd = async (data) => {
    await addMutation.mutateAsync(data);
    setShowForm(false);
    reset();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Saved Passengers</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)} id="add-passenger-btn">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Passenger</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onAdd)} style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input {...register('name')} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Passenger name" id="passenger-name" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input {...register('age')} type="number" className={`form-input ${errors.age ? 'error' : ''}`} placeholder="25" id="passenger-age" />
              {errors.age && <p className="form-error">{errors.age.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select {...register('gender')} className={`form-select ${errors.gender ? 'error' : ''}`} id="passenger-gender">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="form-error">{errors.gender.message}</p>}
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-full" disabled={addMutation.isPending} id="save-passenger">
                {addMutation.isPending ? <div className="spinner" /> : 'Save'}
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '52px' }} />)}
        </div>
      ) : passengers.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No saved passengers</h3>
          <p>Save frequently travelling passengers for quick booking</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {passengers.map(p => (
            <div key={p.id} className="passenger-card">
              <div className="passenger-info">
                <div className="passenger-avatar">
                  <User size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{p.gender} · {p.age} yrs</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => removeMutation.mutate(p.id)} style={{ color: 'var(--danger)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Profile Page ============
export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const user = useAuthStore(s => s.user);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Account</h1>
        <p className="page-subtitle">Manage your profile, payment methods, and saved passengers</p>
      </div>

      <div className="sidebar-layout">
        <div>
          <div className="tabs">
            <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
            <button className={`tab ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>Payment</button>
            <button className={`tab ${activeTab === 'passengers' ? 'active' : ''}`} onClick={() => setActiveTab('passengers')}>Passengers</button>
          </div>
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'payment' && <PaymentTab />}
          {activeTab === 'passengers' && <PassengersTab />}
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{user?.name}</h3>
          <p className="text-muted text-sm">{user?.email}</p>
          <p className="text-muted text-sm">{user?.phone}</p>
          {user?.role === 'admin' && (
            <span className="badge badge-warning" style={{ marginTop: '0.75rem' }}>Admin</span>
          )}
        </div>
      </div>
    </div>
  );
}
