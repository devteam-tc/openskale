import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'irctc.db'));

// Enable Foreign Keys
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'debit', 'credit', 'upi'
      card_number TEXT,
      card_holder TEXT,
      expiry TEXT,
      cvv TEXT,
      upi_id TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS passengers_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      id_type TEXT,
      id_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_number TEXT UNIQUE NOT NULL,
      train_name TEXT NOT NULL,
      train_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS train_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      stop_order INTEGER NOT NULL,
      arrival_time TEXT,
      departure_time TEXT,
      day INTEGER DEFAULT 1,
      distance_km INTEGER DEFAULT 0,
      FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS train_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_id INTEGER NOT NULL,
      class_type TEXT NOT NULL, -- '1A', '2A', '3A', 'SL', 'CC', '2S'
      total_seats INTEGER NOT NULL,
      base_fare REAL NOT NULL,
      FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pnr TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      train_id INTEGER NOT NULL,
      source_station_id INTEGER NOT NULL,
      destination_station_id INTEGER NOT NULL,
      journey_date TEXT NOT NULL,
      class_type TEXT NOT NULL,
      quota TEXT DEFAULT 'General',
      total_fare REAL NOT NULL,
      status TEXT DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'CANCELLED'
      payment_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (train_id) REFERENCES trains(id),
      FOREIGN KEY (source_station_id) REFERENCES stations(id),
      FOREIGN KEY (destination_station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS booking_passengers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      berth_preference TEXT,
      seat_number TEXT,
      coach TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount > 0) return; // already seeded

  const salt = bcrypt.genSaltSync(10);
  const userPasswordHash = bcrypt.hashSync('password123', salt);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  const demoUserId = insertUser.run('Divya Sri', 'user@demo.com', '9876543210', userPasswordHash, 'user').lastInsertRowid;
  insertUser.run('System Administrator', 'admin@demo.com', '9988776655', adminPasswordHash, 'admin');

  // 2. Seed Stations
  const stations = [
    { code: 'NDLS', name: 'New Delhi', city: 'Delhi', state: 'Delhi' },
    { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal' },
    { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra' },
    { code: 'MAS', name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu' },
    { code: 'SBC', name: 'KSR Bengaluru', city: 'Bengaluru', state: 'Karnataka' },
    { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', state: 'Telangana' },
    { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat' },
    { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar' },
    { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh' },
    { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh' },
  ];

  const insertStation = db.prepare(`
    INSERT INTO stations (code, name, city, state) VALUES (?, ?, ?, ?)
  `);
  const stationMap = {};
  for (const s of stations) {
    const res = insertStation.run(s.code, s.name, s.city, s.state);
    stationMap[s.code] = res.lastInsertRowid;
  }

  // 3. Seed Trains
  const insertTrain = db.prepare(`
    INSERT INTO trains (train_number, train_name, train_type) VALUES (?, ?, ?)
  `);
  const insertStop = db.prepare(`
    INSERT INTO train_stops (train_id, station_id, stop_order, arrival_time, departure_time, day, distance_km)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertClass = db.prepare(`
    INSERT INTO train_classes (train_id, class_type, total_seats, base_fare)
    VALUES (?, ?, ?, ?)
  `);

  // Train 1: 12301 - Howrah Rajdhani (HWH -> NDLS via CNB)
  const t1 = insertTrain.run('12301', 'Howrah Rajdhani Express', 'Rajdhani').lastInsertRowid;
  insertStop.run(t1, stationMap['HWH'], 1, '16:50', '16:55', 1, 0);
  insertStop.run(t1, stationMap['PNBE'], 2, '21:30', '21:40', 1, 530);
  insertStop.run(t1, stationMap['CNB'], 3, '04:15', '04:20', 2, 1010);
  insertStop.run(t1, stationMap['NDLS'], 4, '10:05', '10:15', 2, 1450);

  insertClass.run(t1, '1A', 24, 3850);
  insertClass.run(t1, '2A', 48, 2450);
  insertClass.run(t1, '3A', 64, 1650);

  // Train 2: 12952 - Mumbai Rajdhani (CSMT / MMCT -> NDLS)
  const t2 = insertTrain.run('12952', 'Mumbai Rajdhani Express', 'Rajdhani').lastInsertRowid;
  insertStop.run(t2, stationMap['CSMT'], 1, '17:00', '17:05', 1, 0);
  insertStop.run(t2, stationMap['BPL'], 2, '02:30', '02:35', 2, 820);
  insertStop.run(t2, stationMap['NDLS'], 3, '08:35', '08:45', 2, 1386);

  insertClass.run(t2, '1A', 24, 3650);
  insertClass.run(t2, '2A', 52, 2250);
  insertClass.run(t2, '3A', 72, 1550);

  // Train 3: 20607 - Vande Bharat Express (MAS -> SBC)
  const t3 = insertTrain.run('20607', 'Vande Bharat Express', 'Superfast').lastInsertRowid;
  insertStop.run(t3, stationMap['MAS'], 1, '05:50', '05:55', 1, 0);
  insertStop.run(t3, stationMap['SBC'], 2, '10:20', '10:25', 1, 359);

  insertClass.run(t3, 'CC', 120, 995);
  insertClass.run(t3, '1A', 40, 1890);

  // Train 4: 12724 - Telangana Express (NDLS -> SC via BPL)
  const t4 = insertTrain.run('12724', 'Telangana Express', 'Superfast').lastInsertRowid;
  insertStop.run(t4, stationMap['NDLS'], 1, '16:00', '16:10', 1, 0);
  insertStop.run(t4, stationMap['BPL'], 2, '00:45', '00:50', 2, 700);
  insertStop.run(t4, stationMap['SC'], 3, '17:10', '17:20', 2, 1670);

  insertClass.run(t4, '2A', 40, 2100);
  insertClass.run(t4, '3A', 64, 1480);
  insertClass.run(t4, 'SL', 80, 560);

  // Train 5: 12933 - Karnavati Express (CSMT/MMCT -> ADI)
  const t5 = insertTrain.run('12933', 'Karnavati Express', 'Express').lastInsertRowid;
  insertStop.run(t5, stationMap['CSMT'], 1, '14:05', '14:15', 1, 0);
  insertStop.run(t5, stationMap['ADI'], 2, '21:30', '21:40', 1, 490);

  insertClass.run(t5, 'CC', 90, 680);
  insertClass.run(t5, '2S', 120, 210);

  // 4. Seed Saved Passengers for Demo User
  const insertPass = db.prepare(`
    INSERT INTO passengers_master (user_id, name, age, gender) VALUES (?, ?, ?, ?)
  `);
  insertPass.run(demoUserId, 'Divya Sri', 26, 'Female');
  insertPass.run(demoUserId, 'Ramesh Kumar', 58, 'Male');
  insertPass.run(demoUserId, 'Sunita Devi', 54, 'Female');

  // 5. Seed Payment Methods for Demo User
  const insertPay = db.prepare(`
    INSERT INTO payment_methods (user_id, type, card_number, card_holder, expiry, cvv, upi_id, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPay.run(demoUserId, 'debit', '4532112233445566', 'Divya Sri', '09/28', '123', null, 1);
  insertPay.run(demoUserId, 'upi', null, null, null, null, 'divyasri@okaxis', 0);

  // 6. Seed a sample past booking
  const insertBooking = db.prepare(`
    INSERT INTO bookings (pnr, user_id, train_id, source_station_id, destination_station_id, journey_date, class_type, quota, total_fare, status, payment_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const b1 = insertBooking.run(
    '2847591024',
    demoUserId,
    t1,
    stationMap['HWH'],
    stationMap['NDLS'],
    '2026-10-15',
    '3A',
    'General',
    3300,
    'CONFIRMED',
    'debit'
  ).lastInsertRowid;

  const insertBPass = db.prepare(`
    INSERT INTO booking_passengers (booking_id, name, age, gender, berth_preference, seat_number, coach)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertBPass.run(b1, 'Divya Sri', 26, 'Female', 'Lower', 'B1-21', 'B1');
  insertBPass.run(b1, 'Sunita Devi', 54, 'Female', 'Lower', 'B1-22', 'B1');
}

export default db;
