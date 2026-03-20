import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await query(`
      SELECT d.id, d.user_id, d.first_name, d.last_name, d.specialization,
             d.phone, d.room_number, d.position_title, d.available_days, d.license_number, d.profile_image_url, d.experience_years, u.email
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.specialization
    `);
    res.json({ total: doctors.length, doctors });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const getMyDoctorProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Нэвтэрнэ үү.' });
    }

    const userRows = await query('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);
    const email = userRows[0]?.email || null;

    const rows = await query(`
      SELECT d.id, d.user_id, d.first_name, d.last_name, d.specialization,
             d.phone, d.room_number, d.position_title, d.available_days, d.license_number,
             d.profile_image_url, d.experience_years
      FROM doctors d
      WHERE d.user_id = ?
      LIMIT 1
    `, [userId]);

    if (rows.length === 0) {
      return res.json({ profile: null, email });
    }

    res.json({ profile: rows[0], email });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const getDepartments = async (req, res) => {
  try {
    // Prefer explicit departments table if it exists, fallback to doctor specializations
    const tables = await query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'departments'
    `);

    if (tables.length > 0) {
      const rows = await query(`SELECT name FROM departments ORDER BY name`);
      return res.json({ total: rows.length, departments: rows.map(r => r.name) });
    }

    const rows = await query(`
      SELECT DISTINCT specialization
      FROM doctors
      WHERE specialization IS NOT NULL AND specialization <> ''
      ORDER BY specialization
    `);
    res.json({ total: rows.length, departments: rows.map(r => r.specialization) });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctors = await query(`
      SELECT d.*, u.email
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (doctors.length === 0) {
      return res.status(404).json({ error: 'Эмч олдсонгүй.' });
    }

    const appointments = await query(`
      SELECT a.id, a.appointment_date, a.status,
             p.first_name, p.last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = ? AND a.appointment_date >= NOW()
      ORDER BY a.appointment_date
      LIMIT 10
    `, [id]);

    res.json({ ...doctors[0], upcoming_appointments: appointments });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const { email, password, first_name, last_name, specialization, phone, room_number, position_title, license_number, available_days, profile_image_url, experience_years } = req.body;
    const normalizedRoom = room_number === '' ? null : room_number;
    const normalizedTitle = position_title === '' ? null : position_title;

    if (!email) {
      return res.status(400).json({ error: 'Имэйл заавал.' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Энэ имэйл бүртгэлтэй байна.' });
    }

    let lic = license_number;
    if (!lic) {
      lic = `LIC-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    }

    const tempPassword = password && String(password).length > 0
      ? String(password)
      : `Doc${Math.random().toString(36).slice(2,6)}!${Math.floor(Math.random() * 90 + 10)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const userRes = await query(
      'INSERT INTO users (email, password, role, must_change_password) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, 'doctor', true]
    );

    let result;
    try {
      result = await query(`
        INSERT INTO doctors (user_id, first_name, last_name, specialization, phone, room_number, position_title, license_number, available_days, profile_image_url, experience_years)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userRes.insertId,
        first_name,
        last_name,
        specialization,
        phone,
        normalizedRoom,
        normalizedTitle,
        lic,
        available_days,
        profile_image_url || null,
        experience_years || null
      ]);
    } catch (e) {
      await query('DELETE FROM users WHERE id = ?', [userRes.insertId]);
      throw e;
    }

    res.status(201).json({ message: 'Эмч амжилттай бүртгэгдлээ.', doctorId: result.insertId, tempPassword });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, specialization, phone, room_number, position_title, license_number, available_days, profile_image_url, experience_years, email } = req.body;
    const normalizedRoom = room_number === '' ? null : room_number;
    const normalizedTitle = position_title === '' ? null : position_title;

    const rows = await query('SELECT * FROM doctors WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Эмч олдсонгүй.' });
    }
    const current = rows[0];

    await query(`
      UPDATE doctors
      SET first_name = ?, last_name = ?, specialization = ?, phone = ?, room_number = ?, position_title = ?, license_number = ?, available_days = ?, profile_image_url = ?, experience_years = ?
      WHERE id = ?
    `, [
      first_name ?? current.first_name,
      last_name ?? current.last_name,
      specialization ?? current.specialization,
      phone ?? current.phone,
      normalizedRoom ?? current.room_number,
      normalizedTitle ?? current.position_title,
      license_number || current.license_number,
      available_days ?? current.available_days,
      profile_image_url ?? current.profile_image_url,
      experience_years ?? current.experience_years,
      id
    ]);

    if (email) {
      await query('UPDATE users SET email = ? WHERE id = ?', [email, current.user_id]);
    }

    res.json({ message: 'Эмчийн мэдээлэл шинэчлэгдлээ.' });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT user_id FROM doctors WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Эмч олдсонгүй.' });
    }
    const userId = rows[0].user_id;
    await query('DELETE FROM doctors WHERE id = ?', [id]);
    await query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Эмч устгагдлаа.' });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const getDoctorAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const appointments = await query(`
      SELECT a.id, a.appointment_date, a.status, a.notes,
             p.first_name AS patient_first, p.last_name AS patient_last,
             p.phone AS patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = ?
      ORDER BY a.appointment_date DESC
    `, [id]);

    res.json({ total: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const updateDoctorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Нууц үг бага дорх 6 тэмдэгт байна.' });
    }

    const rows = await query('SELECT user_id FROM doctors WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Эмч олдсонгүй.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password = ?, must_change_password = ? WHERE id = ?', [hashedPassword, true, rows[0].user_id]);
    res.json({ message: 'Нууц үг амжилттай шинэчлэгдлээ.' });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};
