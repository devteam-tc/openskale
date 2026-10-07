import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Shield, Train, Plus, Trash2, MapPin, CheckCircle,
  Activity, Users, DollarSign, Calendar
} from 'lucide-react';
import { trainRouteSchema } from '../lib/schemas';
import { useAdminAddTrain, useAdminTrains, useAdminDashboard, useStations } from '../hooks/queries';
import { useToastStore } from '../stores';

export default function AdminRoutesPage() {
  const addToast = useToastStore(s => s.addToast);
  const { data: dashboardData } = useAdminDashboard();
  const { data: trains = [], isLoading: trainsLoading } = useAdminTrains();
  const { data: stationsData } = useStations();
  const stations = stationsData?.stations || [];

  const addTrainMutation = useAdminAddTrain();
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'list'

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(trainRouteSchema),
    defaultValues: {
      trainNumber: '',
      trainName: '',
      trainType: 'Express',
      stops: [
        { stationCode: '', stationName: '', city: '', arrivalTime: '06:00', departureTime: '06:15', day: 1, stopOrder: 1 },
        { stationCode: '', stationName: '', city: '', arrivalTime: '18:00', departureTime: '18:15', day: 1, stopOrder: 2 },
      ],
      classes: [
        { classType: '3A', totalSeats: 64, farePerKm: 1.25 },
        { classType: 'SL', totalSeats: 72, farePerKm: 0.65 },
      ],
    },
  });

  const {
    fields: stopFields,
    append: appendStop,
    remove: removeStop,
  } = useFieldArray({ control, name: 'stops' });

  const {
    fields: classFields,
    append: appendClass,
    remove: removeClass,
  } = useFieldArray({ control, name: 'classes' });

  const onStationSelect = (index, code) => {
    const station = stations.find(s => s.code === code);
    if (station) {
      // populate stationName and city
      // handled implicitly or user selects
    }
  };

  const onSubmit = async (data) => {
    try {
      // enrich stops with station details from lookup if stationCode matches
      const enrichedStops = data.stops.map(st => {
        const found = stations.find(s => s.code === st.stationCode);
        return {
          ...st,
          stationName: found ? found.name : st.stationName || st.stationCode,
          city: found ? found.city : st.city || st.stationCode,
        };
      });

      await addTrainMutation.mutateAsync({
        ...data,
        stops: enrichedStops,
      });

      reset();
      setActiveTab('list');
    } catch (err) {
      // error handled by mutation
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Management Portal</h1>
        <p className="page-subtitle">Configure train routes, schedules, coaches, and view system statistics</p>
      </div>

      {/* Stats summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orange"><Train size={24} /></div>
          <div>
            <div className="stat-value">{dashboardData?.totalTrains || trains.length || 0}</div>
            <div className="stat-label">Total Trains</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Activity size={24} /></div>
          <div>
            <div className="stat-value">{dashboardData?.totalBookings || 0}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div>
            <div className="stat-value">{dashboardData?.totalPassengers || 0}</div>
            <div className="stat-label">Passengers Booked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><DollarSign size={24} /></div>
          <div>
            <div className="stat-value">₹{dashboardData?.totalRevenue || 0}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>
          <Plus size={16} style={{ display: 'inline', marginRight: '4px' }} /> Add Train Route
        </button>
        <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          <Train size={16} style={{ display: 'inline', marginRight: '4px' }} /> View Train Routes ({trains.length})
        </button>
      </div>

      {activeTab === 'add' ? (
        <div className="card animate-in">
          <div className="card-header">
            <h2 className="card-title">Create New Train Route</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Train details */}
            <div className="form-row form-row-3" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Train Number (5 Digits)</label>
                <input
                  {...register('trainNumber')}
                  className={`form-input ${errors.trainNumber ? 'error' : ''}`}
                  placeholder="12301"
                />
                {errors.trainNumber && <p className="form-error">{errors.trainNumber.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Train Name</label>
                <input
                  {...register('trainName')}
                  className={`form-input ${errors.trainName ? 'error' : ''}`}
                  placeholder="Howrah Rajdhani Express"
                />
                {errors.trainName && <p className="form-error">{errors.trainName.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Train Category</label>
                <select {...register('trainType')} className="form-select">
                  <option value="Rajdhani">Rajdhani</option>
                  <option value="Shatabdi">Shatabdi</option>
                  <option value="Superfast">Superfast</option>
                  <option value="Express">Express</option>
                  <option value="Duronto">Duronto</option>
                  <option value="Mail">Mail</option>
                  <option value="Passenger">Passenger</option>
                </select>
              </div>
            </div>

            {/* Route Stops */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                  Route Stops & Stations ({stopFields.length})
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => appendStop({
                    stationCode: '',
                    stationName: '',
                    city: '',
                    arrivalTime: '12:00',
                    departureTime: '12:15',
                    day: 1,
                    stopOrder: stopFields.length + 1
                  })}
                >
                  <Plus size={14} /> Add Station Stop
                </button>
              </div>

              {errors.stops && !Array.isArray(errors.stops) && (
                <p className="form-error mb-2">{errors.stops.message}</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stopFields.map((field, idx) => (
                  <div key={field.id} style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Stop #{idx + 1}</span>
                      {stopFields.length > 2 && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeStop(idx)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="form-row form-row-4">
                      <div className="form-group">
                        <label className="form-label">Station</label>
                        <select
                          {...register(`stops.${idx}.stationCode`)}
                          className="form-select"
                          onChange={(e) => {
                            const found = stations.find(s => s.code === e.target.value);
                            if (found) {
                              register(`stops.${idx}.stationName`).onChange({ target: { value: found.name } });
                              register(`stops.${idx}.city`).onChange({ target: { value: found.city } });
                            }
                          }}
                        >
                          <option value="">Select Station</option>
                          {stations.map(st => (
                            <option key={st.id} value={st.code}>{st.name} ({st.code})</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Arr Time</label>
                        <input
                          {...register(`stops.${idx}.arrivalTime`)}
                          type="time"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Dep Time</label>
                        <input
                          {...register(`stops.${idx}.departureTime`)}
                          type="time"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Day</label>
                        <input
                          {...register(`stops.${idx}.day`)}
                          type="number"
                          min="1"
                          max="5"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coaches and Classes */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                  Coaches, Class Types & Seat Capacity
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => appendClass({ classType: '2A', totalSeats: 48, farePerKm: 1.8 })}
                >
                  <Plus size={14} /> Add Coach Class
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {classFields.map((field, idx) => (
                  <div key={field.id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div className="form-row form-row-4" style={{ alignItems: 'center' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Class</label>
                        <select {...register(`classes.${idx}.classType`)} className="form-select">
                          <option value="1A">1A (First AC)</option>
                          <option value="2A">2A (Second AC)</option>
                          <option value="3A">3A (Third AC)</option>
                          <option value="SL">SL (Sleeper)</option>
                          <option value="CC">CC (AC Chair Car)</option>
                          <option value="2S">2S (Second Sitting)</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Total Seats</label>
                        <input
                          {...register(`classes.${idx}.totalSeats`)}
                          type="number"
                          min="1"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Base Rate / Multiplier</label>
                        <input
                          {...register(`classes.${idx}.farePerKm`)}
                          type="number"
                          step="0.1"
                          min="0.1"
                          className="form-input"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                        {classFields.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => removeClass(idx)}
                            style={{ color: 'var(--danger)', marginTop: '1.25rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={addTrainMutation.isPending}
            >
              {addTrainMutation.isPending ? (
                <><div className="spinner" /> Saving Train Route...</>
              ) : (
                <><CheckCircle size={18} /> Publish Train Route</>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="card animate-in">
          <div className="card-header">
            <h2 className="card-title">Configured Train Routes</h2>
          </div>

          {trainsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px' }} />)}
            </div>
          ) : trains.length === 0 ? (
            <div className="empty-state">
              <Train size={48} />
              <h3>No train routes added yet</h3>
              <p>Switch to the "Add Train Route" tab above to create your first route.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Train #</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>From - To</th>
                    <th>Stops</th>
                    <th>Classes</th>
                  </tr>
                </thead>
                <tbody>
                  {trains.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                        {t.train_number}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.train_name}</td>
                      <td><span className="badge badge-info">{t.train_type}</span></td>
                      <td>
                        {t.source} → {t.destination}
                      </td>
                      <td>{t.stops_count || (t.stops ? t.stops.length : '-')} stops</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(t.classes || []).map((c, i) => (
                            <span key={i} className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                              {c.class_type} ({c.total_seats || c.totalSeats})
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
