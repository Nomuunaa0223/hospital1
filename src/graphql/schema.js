import { buildSchema } from 'graphql';
import { query } from '../config/database.js';

const requireAuth = (context) => {
  if (!context?.user) {
    throw new Error('Token олдсонгүй. Нэвтэрнэ үү.');
  }
};

const requireRoles = (context, roles) => {
  requireAuth(context);
  if (!roles.includes(context.user.role)) {
    throw new Error(`Зөвшөөрөлгүй. Шаардлагатай эрх: ${roles.join(', ')}`);
  }
};

export const schema = buildSchema(`
  type Doctor {
    id: ID!
    first_name: String!
    last_name: String!
    specialization: String!
    phone: String
    room_number: String
    position_title: String
    available_days: String
    appointments: [Appointment]
  }

  type Patient {
    id: ID!
    first_name: String!
    last_name: String!
    date_of_birth: String!
    gender: String!
    blood_type: String
    appointments: [Appointment]
    prescriptions: [Prescription]
  }

  type Appointment {
    id: ID!
    appointment_date: String!
    status: String!
    notes: String
    doctor: Doctor
    patient: Patient
  }

  type Prescription {
    id: ID!
    medication: String!
    dosage: String!
    duration: String!
    instructions: String
    issued_at: String
  }

  type Query {
    doctor(id: ID!): Doctor
    doctors: [Doctor]
    patient(id: ID!): Patient
    patients: [Patient]
    appointment(id: ID!): Appointment
    appointments(status: String): [Appointment]
  }
`);

export const rootValue = {
  doctor: async ({ id }, context) => {
    requireRoles(context, ['admin', 'doctor']);
    const doctors = await query('SELECT * FROM doctors WHERE id = ?', [id]);
    if (!doctors.length) return null;
    const doctor = doctors[0];

    doctor.appointments = async (_args, ctx) => {
      requireRoles(ctx, ['admin', 'doctor']);
      return await query(`
        SELECT a.*, p.first_name, p.last_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.doctor_id = ?
        ORDER BY a.appointment_date DESC
      `, [id]);
    };

    return doctor;
  },

  doctors: async (_args, context) => {
    requireRoles(context, ['admin', 'doctor']);
    const doctors = await query('SELECT * FROM doctors ORDER BY last_name');
    return doctors.map(d => ({
      ...d,
      appointments: async (_args, ctx) => {
        requireRoles(ctx, ['admin', 'doctor']);
        return await query(
          'SELECT * FROM appointments WHERE doctor_id = ?', [d.id]
        );
      }
    }));
  },

  patient: async ({ id }, context) => {
    requireRoles(context, ['admin', 'doctor']);
    const patients = await query('SELECT * FROM patients WHERE id = ?', [id]);
    if (!patients.length) return null;
    const patient = patients[0];

    patient.appointments = async (_args, ctx) => {
      requireRoles(ctx, ['admin', 'doctor']);
      return await query(
        'SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC',
        [id]
      );
    };

    patient.prescriptions = async (_args, ctx) => {
      requireRoles(ctx, ['admin', 'doctor']);
      return await query(
        'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY issued_at DESC',
        [id]
      );
    };

    return patient;
  },

  patients: async (_args, context) => {
    requireRoles(context, ['admin', 'doctor']);
    return await query('SELECT * FROM patients ORDER BY last_name');
  },

  appointment: async ({ id }, context) => {
    requireRoles(context, ['admin', 'doctor']);
    const appointments = await query('SELECT * FROM appointments WHERE id = ?', [id]);
    return appointments[0] || null;
  },

  appointments: async ({ status }, context) => {
    requireRoles(context, ['admin', 'doctor']);
    if (status) {
      return await query('SELECT * FROM appointments WHERE status = ?', [status]);
    }
    return await query('SELECT * FROM appointments ORDER BY appointment_date DESC');
  }
};
