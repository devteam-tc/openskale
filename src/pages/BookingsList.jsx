import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket, Calendar, Clock, MapPin, AlertTriangle,
  CheckCircle, XCircle, Search, Ban
} from 'lucide-react';
import { useBookings, useCancelBooking } from '../hooks/queries';

export default function BookingsListPage() {
  const { data: bookings = [], isLoading } = useBookings();
  const cancelMutation = useCancelBooking();
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this ticket? Cancellation charges may apply.')) {
      return;
    }
    setCancellingId(id);
    try {
      await cancelMutation.mutateAsync(id);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'CONFIRMED') return b.status === 'CONFIRMED';
    if (filter === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">View and manage your train ticket reservations</p>
        </div>

        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
            All ({bookings.length})
          </button>
          <button className={`tab ${filter === 'CONFIRMED' ? 'active' : ''}`} onClick={() => setFilter('CONFIRMED')}>
            Confirmed ({bookings.filter(b => b.status === 'CONFIRMED').length})
          </button>
          <button className={`tab ${filter === 'CANCELLED' ? 'active' : ''}`} onClick={() => setFilter('CANCELLED')}>
            Cancelled ({bookings.filter(b => b.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '220px' }} />)}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <Ticket size={64} />
          <h3>No bookings found</h3>
          <p>You haven't booked any train tickets matching this status.</p>
          <div style={{ marginTop: '1.25rem' }}>
            <Link to="/" className="btn btn-primary btn-sm">
              <Search size={14} /> Book a Train
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredBookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED';
            return (
              <div key={b.id} className="ticket-card animate-in">
                <div
                  className="ticket-header"
                  style={{
                    background: isConfirmed ? 'var(--accent-gradient)' : 'linear-gradient(135deg, #475569, #334155)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>PNR NUMBER</div>
                    <div className="ticket-pnr">{b.pnr}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      className={`badge ${isConfirmed ? 'badge-success' : 'badge-danger'}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isConfirmed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {b.status}
                    </span>
                    {isConfirmed && (
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#fff', border: '1px solid rgba(239,68,68,0.4)' }}
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                      >
                        {cancellingId === b.id ? (
                          <><div className="spinner" /> Cancelling...</>
                        ) : (
                          <><Ban size={14} /> Cancel Ticket</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="ticket-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span className="train-number">{b.train_number}</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{b.train_name}</h3>
                      <div className="text-sm text-muted">Class: <strong style={{ color: 'var(--text-primary)' }}>{b.class_type}</strong> | Quota: {b.quota || 'General'}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="text-sm text-muted">Journey Date</div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--accent-secondary)' }}>
                        <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {b.journey_date}
                      </div>
                      <div className="text-sm text-muted">Booked on {new Date(b.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="train-route" style={{ margin: '1.25rem 0' }}>
                    <div className="train-station">
                      <div className="train-time">{b.departure_time || '--:--'}</div>
                      <div className="train-station-name">{b.source_name || b.source}</div>
                    </div>
                    <div className="train-duration">
                      <span>{b.duration || 'Direct'}</span>
                    </div>
                    <div className="train-station">
                      <div className="train-time">{b.arrival_time || '--:--'}</div>
                      <div className="train-station-name">{b.destination_name || b.destination}</div>
                    </div>
                  </div>

                  <hr className="ticket-divider" />

                  <h4 style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Passengers ({b.passengers?.length || 0})
                  </h4>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Passenger Name</th>
                          <th>Age</th>
                          <th>Gender</th>
                          <th>Berth Preference</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(b.passengers || []).map((p, pIdx) => (
                          <tr key={p.id || pIdx}>
                            <td>{pIdx + 1}</td>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                            <td>{p.age} yrs</td>
                            <td>{p.gender}</td>
                            <td>{p.berth_preference || 'No Preference'}</td>
                            <td>
                              <span className={`badge ${isConfirmed ? 'badge-success' : 'badge-danger'}`}>
                                {isConfirmed ? 'CNF' : 'CAN'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <span className="text-sm text-muted">Payment: </span>
                      <strong style={{ fontSize: '0.875rem' }}>
                        {b.payment_type ? b.payment_type.toUpperCase() : 'SIMULATED GATEWAY'}
                      </strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="text-sm text-muted">Total Fare Paid: </span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: isConfirmed ? 'var(--accent-secondary)' : 'var(--text-tertiary)' }}>
                        ₹{b.total_fare}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
