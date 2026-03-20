import { query } from '../config/database.js';

const normalizeRegistry = (v) => {
  if (typeof v !== 'string') return v;
  const letters = (v.match(/[А-ЯӨҮа-яөү]/g) || []).join('').toUpperCase().slice(0, 2);
  const digits = (v.match(/\d/g) || []).join('').slice(0, 8);
  return `${letters}${digits}`;
};
const isValidRegistry = (v) => /^[А-ЯӨҮ]{2}\d{8}$/.test(v);

export const getAllPatients = async (req, res) => {
  try {
    const patients = await query(`
      SELECT p.id, p.first_name, p.last_name, p.date_of_birth,
             p.gender, p.phone, p.blood_type, u.email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json({ total: patients.length, patients });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const getMyPatientProfile = async (req, res) => {
  try {
    const patients = await query(`
      SELECT p.*, u.email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      LIMIT 1
    `, [req.user.id]);

    if (patients.length === 0) {
      const users = await query('SELECT email FROM users WHERE id = ? LIMIT 1', [req.user.id]);
      return res.json({ profile: null, email: users[0]?.email || null });
    }

    res.json(patients[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ð¡ÐµÑ€Ð²ÐµÑ€Ð¸Ð¹Ð½ Ð°Ð»Ð´Ð°Ð°.', details: err.message });
  }
};

export const updateMyPatientProfile = async (req, res) => {
  try {
    let { first_name, last_name, date_of_birth, gender, phone, address, blood_type, registry_number } = req.body;
    registry_number = normalizeRegistry(registry_number);
    if (registry_number && !isValidRegistry(registry_number)) {
      return res.status(400).json({ error: 'Регистрийн дугаар буруу. (2 монгол үсэг + 8 тоо)' });
    }

    const patients = await query(
      'SELECT * FROM patients WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    if (patients.length === 0) {
      if (!first_name || !last_name || !date_of_birth || !gender) {
        return res.status(400).json({ error: 'Профайл үүсгэхийн тулд нэр, овог, төрсөн огноо, хүйс заавал.' });
      }

      const result = await query(`
        INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_type, registry_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [req.user.id, first_name, last_name, date_of_birth, gender, phone || null, address || null, blood_type || null, registry_number || null]);

      const created = await query('SELECT p.*, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?', [result.insertId]);
      return res.status(201).json({ message: 'Өвчтөний профайл үүсгэлээ.', patientId: result.insertId, profile: created[0] });
    }

    const current = patients[0];
    const next = {
      first_name: first_name ?? current.first_name,
      last_name: last_name ?? current.last_name,
      date_of_birth: date_of_birth ?? current.date_of_birth,
      gender: gender ?? current.gender,
      phone: phone ?? current.phone,
      address: address ?? current.address,
      blood_type: blood_type ?? current.blood_type,
      registry_number: registry_number ?? current.registry_number
    };

    await query(`
      UPDATE patients
      SET first_name=?, last_name=?, date_of_birth=?, gender=?, phone=?, address=?, blood_type=?, registry_number=?
      WHERE user_id=?
    `, [
      next.first_name,
      next.last_name,
      next.date_of_birth,
      next.gender,
      next.phone,
      next.address,
      next.blood_type,
      next.registry_number,
      req.user.id
    ]);

    const updated = await query('SELECT p.*, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? LIMIT 1', [req.user.id]);
    res.json({ message: 'Өвчтөний профайл шинэчлэгдлээ.', profile: updated[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ð¡ÐµÑ€Ð²ÐµÑ€Ð¸Ð¹Ð½ Ð°Ð»Ð´Ð°Ð°.', details: err.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'patient') {
      const patientCheck = await query(
        'SELECT id FROM patients WHERE id = ? AND user_id = ?',
        [id, req.user.id]
      );
      if (patientCheck.length === 0) {
        return res.status(403).json({ error: 'Зөвшөөрөлгүй.' });
      }
    }

    const patients = await query(`
      SELECT p.*, u.email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (patients.length === 0) {
      return res.status(404).json({ error: 'Өвчтөн олдсонгүй.' });
    }

    res.json(patients[0]);
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const createPatient = async (req, res) => {
  try {
    let { user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_type, registry_number } = req.body;
    registry_number = normalizeRegistry(registry_number);
    if (registry_number && !isValidRegistry(registry_number)) {
      return res.status(400).json({ error: 'Регистрийн дугаар буруу. (2 монгол үсэг + 8 тоо)' });
    }

    const result = await query(`
      INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_type, registry_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_type, registry_number]);

    res.status(201).json({ message: 'Өвчтөн амжилттай бүртгэгдлээ.', patientId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    let { first_name, last_name, phone, address, blood_type, registry_number } = req.body;
    registry_number = normalizeRegistry(registry_number);
    if (registry_number && !isValidRegistry(registry_number)) {
      return res.status(400).json({ error: 'Регистрийн дугаар буруу. (2 үсэг + 8 тоо)' });
    }

    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Зөвшөөрөлгүй.' });
    }

    const own = await query(
      'SELECT id FROM patients WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (own.length === 0) {
      return res.status(403).json({ error: 'Зөвшөөрөлгүй.' });
    }

    await query(`
      UPDATE patients SET first_name=?, last_name=?, phone=?, address=?, blood_type=?, registry_number=?
      WHERE id=?
    `, [first_name, last_name, phone, address, blood_type, registry_number, id]);

    res.json({ message: 'Өвчтөний мэдээлэл шинэчлэгдлээ.' });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};
