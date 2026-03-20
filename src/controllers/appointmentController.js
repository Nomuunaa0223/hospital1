import { query } from '../config/database.js';

export const createAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, notes } = req.body;
    const patientRow = await query('SELECT id FROM patients WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (patientRow.length === 0) {
      return res.status(400).json({ error: 'Өвчтөний профайл үүсээгүй байна.' });
    }
    const patient_id = patientRow[0].id;
    if (!doctor_id || !appointment_date) {
      return res.status(400).json({ error: 'Эмч болон огноо/цаг заавал.' });
    }

    const dt = new Date(appointment_date);
    if (Number.isNaN(dt.getTime())) {
      return res.status(400).json({ error: 'Огноо/цаг буруу.' });
    }
    const day = dt.getDay(); // 0=Sun,6=Sat
    if (day === 0 || day === 6) {
      return res.status(400).json({ error: 'Амралтын өдөр цаг авах боломжгүй.' });
    }
    const hours = dt.getHours();
    const minutes = dt.getMinutes();
    const inWindow = (hours > 8 || (hours === 8 && minutes >= 30)) &&
                     (hours < 17 || (hours === 17 && minutes === 0));
    const onHalfHour = minutes === 0 || minutes === 30;
    if (!inWindow || !onHalfHour) {
      return res.status(400).json({ error: 'Цаг нь 30 минутын интервалтай, 08:30–17:00 хооронд байх ёстой.' });
    }
    const conflict = await query(`
      SELECT id FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'
    `, [doctor_id, appointment_date]);

    if (conflict.length > 0) {
      return res.status(409).json({ error: 'Тухайн цагт эмч завгүй байна.' });
    }

    const result = await query(`
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, notes)
      VALUES (?, ?, ?, ?)
    `, [patient_id, doctor_id, appointment_date, notes]);

    res.status(201).json({
      message: 'Цаг амжилттай захиалагдлаа.',
      appointmentId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;
    let sql = `
      SELECT a.id, a.appointment_date, a.status, a.notes,
             p.id AS patient_id, p.first_name AS patient_first, p.last_name AS patient_last, p.phone AS patient_phone,
             d.id AS doctor_id, d.first_name AS doctor_first, d.last_name AS doctor_last, d.room_number,
             d.specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    if (date)   { sql += ' AND DATE(a.appointment_date) = ?'; params.push(date); }
    if (req.user?.role === 'doctor') { sql += ' AND d.user_id = ?'; params.push(req.user.id); }

    sql += ' ORDER BY a.appointment_date DESC';

    const appointments = await query(sql, params);
    res.json({ total: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const getDoctorBookedSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // YYYY-MM-DD
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Эмч болон огноо заавал.' });
    }
    const rows = await query(`
      SELECT TIME(a.appointment_date) AS time
      FROM appointments a
      WHERE a.doctor_id = ? AND DATE(a.appointment_date) = ? AND a.status != 'cancelled'
    `, [doctorId, date]);

    const times = rows.map(r => String(r.time).slice(0,5)); // HH:MM
    res.json({ times });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await query(`
      SELECT a.id, a.appointment_date, a.status, a.notes,
             p.id AS patient_id, p.first_name AS patient_first, p.last_name AS patient_last, p.phone AS patient_phone,
             d.id AS doctor_id, d.first_name AS doctor_first, d.last_name AS doctor_last, d.room_number,
             d.specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE p.user_id = ?
      ORDER BY a.appointment_date DESC
    `, [req.user.id]);

    res.json({ total: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Буруу статус.' });
    }

    await query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Цагийн статус "${status}" болж өөрчлөгдлөө.` });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const own = await query(`
      SELECT a.id FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = ? AND p.user_id = ?
    `, [id, req.user.id]);
    if (own.length === 0) {
      return res.status(403).json({ error: 'Зөвшөөрөлгүй.' });
    }
    await query('UPDATE appointments SET status = "cancelled" WHERE id = ?', [id]);
    res.json({ message: 'Цаг цуцлагдлаа.' });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа.', details: err.message });
  }
};
