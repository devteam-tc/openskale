import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDB } from './db.js';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'irctc_super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());

// Initialize SQLite database
initDB();

// Root status & API discovery
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>IRCTC Backend API</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0e1a; color: #f1f5f9; padding: 2rem; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; background: #111827; padding: 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
          h1 { color: #f97316; margin-top: 0; }
          .badge { display: inline-block; background: rgba(34,197,94,0.2); color: #22c55e; padding: 4px 10px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; }
          .endpoint { background: #1a2234; padding: 10px 14px; border-radius: 6px; margin: 8px 0; font-family: monospace; font-size: 0.9rem; }
          .method { color: #38bdf8; font-weight: bold; }
          a { color: #fb923c; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚂 IRCTC Booking API <span class="badge">ONLINE (Port 3001)</span></h1>
          <p>The backend REST API server is running successfully with SQLite database.</p>
          <p><strong>Frontend App:</strong> <a href="http://localhost:5174" target="_blank">http://localhost:5174</a></p>
          
          <h3>Available Endpoints</h3>
          <div class="endpoint"><span class="method">GET</span> <a href="/api/trains/stations">/api/trains/stations</a> - List all stations</div>
          <div class="endpoint"><span class="method">GET</span> <a href="/api/trains/search?source=HWH&destination=NDLS&date=2026-10-15">/api/trains/search?source=HWH&destination=NDLS&date=2026-10-15</a> - Search trains</div>
          <div class="endpoint"><span class="method">POST</span> /api/auth/signup - User registration</div>
          <div class="endpoint"><span class="method">POST</span> /api/auth/login - User login</div>
          <div class="endpoint"><span class="method">GET/PUT</span> /api/auth/profile - User profile</div>
          <div class="endpoint"><span class="method">GET/POST/DEL</span> /api/payment-methods - Debit/Credit/UPI</div>
          <div class="endpoint"><span class="method">GET/POST/PUT/DEL</span> /api/passengers - Passenger master list</div>
          <div class="endpoint"><span class="method">POST</span> /api/bookings - Mock gateway train reservation</div>
          <div class="endpoint"><span class="method">GET/PUT</span> /api/bookings - View / Cancel reservations</div>
          <div class="endpoint"><span class="method">POST</span> /api/admin/trains - Add train route (Admin)</div>
        </div>
      </body>
    </html>
  `);
});

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    service: 'IRCTC Train Ticket Booking API',
    version: '1.0.0',
    frontend: 'http://localhost:5174',
    endpoints: {
      stations: '/api/trains/stations',
      search: '/api/trains/search?source=HWH&destination=NDLS',
      auth: '/api/auth/login',
      bookings: '/api/bookings',
      admin: '/api/admin/dashboard'
    }
  });
});


// ============ Auth Middleware ============
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

// ==========================================
// 1. AUTHENTICATION & PROFILE APIS
// ==========================================

// Signup
app.post('/api/auth/signup', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, 'user')
    `).run(name, email, phone, password_hash);

    const user = { id: result.lastInsertRowid, name, email, phone, role: 'user' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: userPayload, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const { name, phone } = req.body;
  try {
    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name, phone, req.user.id);
    const updated = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(req.user.id);
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PAYMENT METHODS APIS (DEBIT/CREDIT/UPI)
// ==========================================

// Get user payment methods
app.get('/api/payment-methods', authenticateToken, (req, res) => {
  try {
    const methods = db.prepare(`
      SELECT id, type, card_number, card_holder, expiry, upi_id, is_default, created_at
      FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC
    `).all(req.user.id);
    res.json(methods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add payment method
app.post('/api/payment-methods', authenticateToken, (req, res) => {
  const { type, cardNumber, cardHolder, expiry, cvv, upiId } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO payment_methods (user_id, type, card_number, card_holder, expiry, cvv, upi_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      type,
      cardNumber ? cardNumber.replace(/\s+/g, '') : null,
      cardHolder || null,
      expiry || null,
      cvv || null,
      upiId || null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Payment method added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete payment method
app.delete('/api/payment-methods/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM payment_methods WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true, message: 'Payment method removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set default payment method
app.put('/api/payment-methods/:id/default', authenticateToken, (req, res) => {
  try {
    const reset = db.prepare('UPDATE payment_methods SET is_default = 0 WHERE user_id = ?');
    const setDefault = db.prepare('UPDATE payment_methods SET is_default = 1 WHERE id = ? AND user_id = ?');

    const updateTx = db.transaction(() => {
      reset.run(req.user.id);
      setDefault.run(req.params.id, req.user.id);
    });
    updateTx();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. PASSENGERS MASTER LIST APIS
// ==========================================

// Get saved passengers
app.get('/api/passengers', authenticateToken, (req, res) => {
  try {
    const passengers = db.prepare(`
      SELECT * FROM passengers_master WHERE user_id = ? ORDER BY created_at DESC
    `).all(req.user.id);
    res.json(passengers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add passenger to master list
app.post('/api/passengers', authenticateToken, (req, res) => {
  const { name, age, gender, idType, idNumber } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO passengers_master (user_id, name, age, gender, id_type, id_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, name, age, gender, idType || null, idNumber || null);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Passenger added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update passenger
app.put('/api/passengers/:id', authenticateToken, (req, res) => {
  const { name, age, gender, idType, idNumber } = req.body;
  try {
    db.prepare(`
      UPDATE passengers_master SET name = ?, age = ?, gender = ?, id_type = ?, id_number = ?
      WHERE id = ? AND user_id = ?
    `).run(name, age, gender, idType || null, idNumber || null, req.params.id, req.user.id);

    res.json({ success: true, message: 'Passenger updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove passenger
app.delete('/api/passengers/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM passengers_master WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true, message: 'Passenger removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. TRAINS & SEARCH & AVAILABILITY APIS
// ==========================================

// Get all stations
app.get('/api/trains/stations', (req, res) => {
  try {
    const stations = db.prepare('SELECT * FROM stations ORDER BY name ASC').all();
    res.json({ stations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search Trains
app.get('/api/trains/search', (req, res) => {
  const { source, destination, date } = req.query;
  if (!source || !destination) {
    return res.status(400).json({ error: 'Source and destination stations required' });
  }

  try {
    // Find trains that stop at source and then at destination with stop_order(source) < stop_order(destination)
    const query = `
      SELECT 
        t.id, t.train_number, t.train_name, t.train_type,
        src_stop.departure_time as departure_time,
        src_st.code as source, src_st.name as source_name,
        dest_stop.arrival_time as arrival_time,
        dest_st.code as destination, dest_st.name as destination_name,
        (dest_stop.distance_km - src_stop.distance_km) as distance,
        dest_stop.day - src_stop.day as day_diff
      FROM trains t
      JOIN train_stops src_stop ON t.id = src_stop.train_id
      JOIN stations src_st ON src_stop.station_id = src_st.id
      JOIN train_stops dest_stop ON t.id = dest_stop.train_id
      JOIN stations dest_st ON dest_stop.station_id = dest_st.id
      WHERE src_st.code = ? AND dest_st.code = ? AND src_stop.stop_order < dest_stop.stop_order
    `;

    const trains = db.prepare(query).all(source, destination);

    const enrichedTrains = trains.map(tr => {
      // Fetch available classes for this train
      const classes = db.prepare(`
        SELECT class_type, total_seats, base_fare
        FROM train_classes WHERE train_id = ?
      `).all(tr.id);

      // Check booked seats for date
      const classesWithAvail = classes.map(c => {
        const bookedCount = db.prepare(`
          SELECT count(bp.id) as count
          FROM bookings b
          JOIN booking_passengers bp ON b.id = bp.booking_id
          WHERE b.train_id = ? AND b.journey_date = ? AND b.class_type = ? AND b.status = 'CONFIRMED'
        `).get(tr.id, date || '2026-10-15', c.class_type).count;

        const available = Math.max(c.total_seats - bookedCount, 0);
        return {
          class_type: c.class_type,
          fare: c.base_fare,
          total_seats: c.total_seats,
          available: available,
        };
      });

      return {
        ...tr,
        journey_date: date,
        duration: calculateDuration(tr.departure_time, tr.arrival_time, tr.day_diff),
        classes: classesWithAvail,
      };
    });

    res.json({ trains: enrichedTrains });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function calculateDuration(dep, arr, dayDiff = 0) {
  if (!dep || !arr) return 'Direct';
  const [dh, dm] = dep.split(':').map(Number);
  const [ah, am] = arr.split(':').map(Number);
  let totalMinutes = (ah * 60 + am + dayDiff * 24 * 60) - (dh * 60 + dm);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins}m`;
}

// Availability details
app.get('/api/trains/:id/availability', (req, res) => {
  const { date, classType } = req.query;
  try {
    const classInfo = db.prepare(`
      SELECT * FROM train_classes WHERE train_id = ? AND class_type = ?
    `).get(req.params.id, classType);

    if (!classInfo) return res.status(404).json({ error: 'Class not found for this train' });

    const bookedCount = db.prepare(`
      SELECT count(bp.id) as count
      FROM bookings b
      JOIN booking_passengers bp ON b.id = bp.booking_id
      WHERE b.train_id = ? AND b.journey_date = ? AND b.class_type = ? AND b.status = 'CONFIRMED'
    `).get(req.params.id, date, classType).count;

    res.json({
      trainId: req.params.id,
      date,
      classType,
      totalSeats: classInfo.total_seats,
      bookedSeats: bookedCount,
      availableSeats: Math.max(classInfo.total_seats - bookedCount, 0),
      fare: classInfo.base_fare,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. BOOKINGS & CANCELLATION APIS
// ==========================================

// Create booking (Mock/Simulated gateway)
app.post('/api/bookings', authenticateToken, (req, res) => {
  const {
    trainId,
    source,
    destination,
    journeyDate,
    classType,
    quota,
    passengers,
    paymentMethodId,
  } = req.body;

  if (!trainId || !source || !destination || !passengers || passengers.length === 0) {
    return res.status(400).json({ error: 'Missing required booking parameters' });
  }

  try {
    // 1. Get stations
    const srcStation = db.prepare('SELECT id FROM stations WHERE code = ?').get(source);
    const destStation = db.prepare('SELECT id FROM stations WHERE code = ?').get(destination);

    if (!srcStation || !destStation) {
      return res.status(400).json({ error: 'Invalid stations provided' });
    }

    // 2. Get class fare
    const classInfo = db.prepare(`
      SELECT base_fare, total_seats FROM train_classes WHERE train_id = ? AND class_type = ?
    `).get(trainId, classType);

    const farePerPerson = classInfo ? classInfo.base_fare : 500;
    const totalFare = farePerPerson * passengers.length;

    // 3. Generate 10-digit PNR
    const pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // 4. Payment method details
    let paymentType = 'Card / Gateway';
    if (paymentMethodId) {
      const pm = db.prepare('SELECT type FROM payment_methods WHERE id = ?').get(paymentMethodId);
      if (pm) paymentType = pm.type;
    }

    // 5. Database transaction for atomic booking creation
    const createBookingTx = db.transaction(() => {
      const bookingInsert = db.prepare(`
        INSERT INTO bookings (
          pnr, user_id, train_id, source_station_id, destination_station_id,
          journey_date, class_type, quota, total_fare, status, payment_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
      `).run(
        pnr,
        req.user.id,
        trainId,
        srcStation.id,
        destStation.id,
        journeyDate,
        classType,
        quota || 'General',
        totalFare,
        paymentType
      );

      const bookingId = bookingInsert.lastInsertRowid;

      // Insert each passenger with allocated coach & seat number
      const insertPassenger = db.prepare(`
        INSERT INTO booking_passengers (booking_id, name, age, gender, berth_preference, seat_number, coach)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      passengers.forEach((p, idx) => {
        const coachPrefix = classType === '1A' ? 'H1' : classType === '2A' ? 'A1' : classType === '3A' ? 'B1' : 'S1';
        const seatNo = `${coachPrefix}-${Math.floor(10 + Math.random() * 60)}`;
        insertPassenger.run(
          bookingId,
          p.name,
          p.age,
          p.gender,
          p.berthPreference || 'No Preference',
          seatNo,
          coachPrefix
        );
      });

      return bookingId;
    });

    const bookingId = createBookingTx();

    // Fetch the created booking with enriched details
    const booking = getBookingDetailsById(bookingId);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to fetch complete booking details
function getBookingDetailsById(id) {
  const b = db.prepare(`
    SELECT 
      b.*,
      t.train_number, t.train_name, t.train_type,
      src.code as source, src.name as source_name,
      dest.code as destination, dest.name as destination_name,
      src_stop.departure_time,
      dest_stop.arrival_time
    FROM bookings b
    JOIN trains t ON b.train_id = t.id
    JOIN stations src ON b.source_station_id = src.id
    JOIN stations dest ON b.destination_station_id = dest.id
    LEFT JOIN train_stops src_stop ON t.id = src_stop.train_id AND src_stop.station_id = src.id
    LEFT JOIN train_stops dest_stop ON t.id = dest_stop.train_id AND dest_stop.station_id = dest.id
    WHERE b.id = ?
  `).get(id);

  if (!b) return null;

  const passengers = db.prepare('SELECT * FROM booking_passengers WHERE booking_id = ?').all(id);
  return { ...b, passengers };
}

// Get all bookings for current user
app.get('/api/bookings', authenticateToken, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT 
        b.*,
        t.train_number, t.train_name, t.train_type,
        src.code as source, src.name as source_name,
        dest.code as destination, dest.name as destination_name,
        src_stop.departure_time,
        dest_stop.arrival_time
      FROM bookings b
      JOIN trains t ON b.train_id = t.id
      JOIN stations src ON b.source_station_id = src.id
      JOIN stations dest ON b.destination_station_id = dest.id
      LEFT JOIN train_stops src_stop ON t.id = src_stop.train_id AND src_stop.station_id = src.id
      LEFT JOIN train_stops dest_stop ON t.id = dest_stop.train_id AND dest_stop.station_id = dest.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(req.user.id);

    const enriched = bookings.map(b => {
      const passengers = db.prepare('SELECT * FROM booking_passengers WHERE booking_id = ?').all(b.id);
      return { ...b, passengers };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single booking by ID
app.get('/api/bookings/:id', authenticateToken, (req, res) => {
  try {
    const booking = getBookingDetailsById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this booking' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel booking
app.put('/api/bookings/:id/cancel', authenticateToken, (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    db.prepare("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?").run(req.params.id);

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Simulated refund initiated.',
      refundAmount: booking.total_fare * 0.9, // 10% cancellation fee
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. ADMIN APIS
// ==========================================

// Add train route
app.post('/api/admin/trains', requireAdmin, (req, res) => {
  const { trainNumber, trainName, trainType, stops, classes } = req.body;

  if (!trainNumber || !trainName || !stops || stops.length < 2) {
    return res.status(400).json({ error: 'Train details and at least 2 stops are required' });
  }

  try {
    const insertTrainTx = db.transaction(() => {
      // 1. Insert train
      const trainRes = db.prepare(`
        INSERT INTO trains (train_number, train_name, train_type)
        VALUES (?, ?, ?)
      `).run(trainNumber, trainName, trainType || 'Express');

      const trainId = trainRes.lastInsertRowid;

      // 2. Insert stops
      const insertStop = db.prepare(`
        INSERT INTO train_stops (train_id, station_id, stop_order, arrival_time, departure_time, day, distance_km)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stops.forEach((st, idx) => {
        let station = db.prepare('SELECT id FROM stations WHERE code = ?').get(st.stationCode);
        let stationId = station?.id;

        if (!stationId) {
          // create station if doesn't exist
          const newStation = db.prepare(`
            INSERT INTO stations (code, name, city, state) VALUES (?, ?, ?, ?)
          `).run(st.stationCode, st.stationName || st.stationCode, st.city || st.stationCode, 'India');
          stationId = newStation.lastInsertRowid;
        }

        insertStop.run(
          trainId,
          stationId,
          idx + 1,
          st.arrivalTime || null,
          st.departureTime || null,
          st.day || 1,
          (idx) * 450
        );
      });

      // 3. Insert classes
      const insertClass = db.prepare(`
        INSERT INTO train_classes (train_id, class_type, total_seats, base_fare)
        VALUES (?, ?, ?, ?)
      `);

      if (classes && classes.length > 0) {
        classes.forEach(c => {
          const fare = c.farePerKm ? c.farePerKm * 800 : 750;
          insertClass.run(trainId, c.classType, c.totalSeats, fare);
        });
      } else {
        // defaults
        insertClass.run(trainId, '3A', 64, 1250);
        insertClass.run(trainId, 'SL', 72, 450);
      }

      return trainId;
    });

    const trainId = insertTrainTx();
    res.status(201).json({ success: true, message: 'Train route added successfully', trainId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin list trains
app.get('/api/admin/trains', requireAdmin, (req, res) => {
  try {
    const trains = db.prepare('SELECT * FROM trains ORDER BY created_at DESC').all();

    const enriched = trains.map(t => {
      const stops = db.prepare(`
        SELECT ts.*, s.code, s.name, s.city
        FROM train_stops ts
        JOIN stations s ON ts.station_id = s.id
        WHERE ts.train_id = ?
        ORDER BY ts.stop_order ASC
      `).all(t.id);

      const classes = db.prepare('SELECT * FROM train_classes WHERE train_id = ?').all(t.id);

      const firstStop = stops[0];
      const lastStop = stops[stops.length - 1];

      return {
        ...t,
        source: firstStop ? `${firstStop.name} (${firstStop.code})` : '—',
        destination: lastStop ? `${lastStop.name} (${lastStop.code})` : '—',
        stops_count: stops.length,
        stops,
        classes,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Dashboard stats
app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
  try {
    const totalTrains = db.prepare('SELECT count(*) as count FROM trains').get().count;
    const totalBookings = db.prepare('SELECT count(*) as count FROM bookings WHERE status = "CONFIRMED"').get().count;
    const totalPassengers = db.prepare(`
      SELECT count(bp.id) as count
      FROM bookings b
      JOIN booking_passengers bp ON b.id = bp.booking_id
      WHERE b.status = "CONFIRMED"
    `).get().count;
    const revenueRow = db.prepare('SELECT sum(total_fare) as sum FROM bookings WHERE status = "CONFIRMED"').get();
    const totalRevenue = revenueRow.sum || 0;

    res.json({
      totalTrains,
      totalBookings,
      totalPassengers,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`IRCTC Backend Server listening on http://localhost:${PORT}`);
});
