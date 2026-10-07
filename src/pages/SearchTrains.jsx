import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowRightLeft, Calendar, MapPin, Train, Clock,
  ArrowRight, Filter, ChevronDown
} from 'lucide-react';
import { searchSchema } from '../lib/schemas';
import { useStations } from '../hooks/queries';
import { useBookingStore, useToastStore } from '../stores';
import { trainAPI } from '../api/client';
import { format } from 'date-fns';

export default function SearchTrainsPage() {
  const navigate = useNavigate();
  const { data: stationsData, isLoading: stationsLoading } = useStations();
  const stations = stationsData?.stations || [];
  const selectTrain = useBookingStore(s => s.selectTrain);
  const setSearchParams = useBookingStore(s => s.setSearchParams);
  const setSearchResults = useBookingStore(s => s.setSearchResults);
  const addToast = useToastStore(s => s.addToast);

  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState('General');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: { quota: 'General' },
  });

  const source = watch('source');
  const destination = watch('destination');

  const handleSwap = () => {
    const src = source;
    const dest = destination;
    setValue('source', dest);
    setValue('destination', src);
  };

  const onSubmit = async (data) => {
    setSearching(true);
    setSearched(true);
    try {
      const res = await trainAPI.search({
        source: data.source,
        destination: data.destination,
        date: data.date,
      });
      setResults(res.trains || []);
      setSearchParams(data);
      setSearchResults(res.trains || []);
    } catch (err) {
      addToast({ type: 'error', message: err.message });
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectTrain = (train, classType) => {
    selectTrain(train, classType);
    navigate('/book');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>
          Book Train Tickets
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.0625rem', maxWidth: '500px', margin: '0 auto' }}>
          Search, compare and book train tickets across India with ease
        </p>
      </div>

      {/* Search Form */}
      <div className="search-hero animate-in">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Source */}
            <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
              <label className="form-label">
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                From
              </label>
              <select
                {...register('source')}
                className={`form-select ${errors.source ? 'error' : ''}`}
                id="search-source"
              >
                <option value="">Select Station</option>
                {stations.map(s => (
                  <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </select>
              {errors.source && <p className="form-error">{errors.source.message}</p>}
            </div>

            {/* Swap */}
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.75rem' }}>
              <button type="button" className="swap-btn" onClick={handleSwap} title="Swap stations" id="swap-stations">
                <ArrowRightLeft size={18} />
              </button>
            </div>

            {/* Destination */}
            <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
              <label className="form-label">
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                To
              </label>
              <select
                {...register('destination')}
                className={`form-select ${errors.destination ? 'error' : ''}`}
                id="search-destination"
              >
                <option value="">Select Station</option>
                {stations.map(s => (
                  <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </select>
              {errors.destination && <p className="form-error">{errors.destination.message}</p>}
            </div>

            {/* Date */}
            <div className="form-group" style={{ flex: 1.5, minWidth: '160px' }}>
              <label className="form-label">
                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Journey Date
              </label>
              <input
                {...register('date')}
                type="date"
                min={today}
                className={`form-input ${errors.date ? 'error' : ''}`}
                id="search-date"
              />
              {errors.date && <p className="form-error">{errors.date.message}</p>}
            </div>

            {/* Quota */}
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Quota</label>
              <select
                {...register('quota')}
                className="form-select"
                id="search-quota"
              >
                <option value="General">General</option>
                <option value="Ladies">Ladies</option>
                <option value="Tatkal">Tatkal</option>
                <option value="Senior Citizen">Senior Citizen</option>
              </select>
            </div>

            {/* Search Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingTop: '0.25rem', paddingBottom: '1.25rem' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={searching} id="search-trains-btn">
                {searching ? <div className="spinner" /> : <Search size={18} />}
                <span>Search</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {searching && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '200px' }} />
          ))}
        </div>
      )}

      {!searching && searched && results.length === 0 && (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <Train size={64} />
          <h3>No trains found</h3>
          <p>Try adjusting your search criteria or pick a different date</p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              {results.length} Train{results.length > 1 ? 's' : ''} Found
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((train, idx) => (
              <div key={train.id || idx} className="train-card animate-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="train-number">{train.train_number}</span>
                    <h3 className="train-name">{train.train_name}</h3>
                  </div>
                  <span className="badge badge-info">{train.train_type}</span>
                </div>

                <div className="train-route">
                  <div className="train-station">
                    <div className="train-time">{train.departure_time || '--:--'}</div>
                    <div className="train-station-name">{train.source_name || train.source}</div>
                  </div>
                  <div className="train-duration">
                    <span>{train.duration || '—'}</span>
                  </div>
                  <div className="train-station">
                    <div className="train-time">{train.arrival_time || '--:--'}</div>
                    <div className="train-station-name">{train.destination_name || train.destination}</div>
                  </div>
                </div>

                <div className="train-classes">
                  {(train.classes || []).map((cls, ci) => (
                    <div
                      key={ci}
                      className="class-chip"
                      onClick={() => handleSelectTrain(train, cls)}
                      id={`select-class-${train.train_number}-${cls.class_type}`}
                    >
                      <div className="class-name">{cls.class_type}</div>
                      <div className="class-fare">₹{cls.fare}</div>
                      <div className="class-avail">
                        {cls.available > 0 ? `Avl ${cls.available}` : 'WL'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!searched && (
        <div className="stats-grid" style={{ marginTop: '3rem' }}>
          <div className="stat-card">
            <div className="stat-icon orange"><Train size={22} /></div>
            <div>
              <div className="stat-value">500+</div>
              <div className="stat-label">Trains Available</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><MapPin size={22} /></div>
            <div>
              <div className="stat-value">7000+</div>
              <div className="stat-label">Stations Connected</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><Clock size={22} /></div>
            <div>
              <div className="stat-value">24/7</div>
              <div className="stat-label">Booking Available</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
