import express from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport.js';
import { register, login, getMe, changePassword } from '../controllers/authController.js';
import { getAllPatients, getPatientById, createPatient, updatePatient, getMyPatientProfile, updateMyPatientProfile } from '../controllers/patientController.js';
import { getAllDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor, getDoctorAppointments, getDepartments, updateDoctorPassword, getMyDoctorProfile } from '../controllers/doctorController.js';
import { createAppointment, getAllAppointments, getMyAppointments, getDoctorBookedSlots, updateAppointmentStatus, cancelAppointment } from '../controllers/appointmentController.js';
import { createPrescription, getPatientPrescriptions, createMedicalRecord, getPatientMedicalRecords } from '../controllers/medicalController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=google`,
    session: false
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userParam = encodeURIComponent(JSON.stringify(req.user));
    const redirect = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?token=${token}&user=${userParam}`;
    res.redirect(redirect);
  }
);

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);
router.put('/auth/change-password', authenticate, changePassword);

router.get('/patients/me',  authenticate, authorize('patient'), getMyPatientProfile);
router.put('/patients/me',  authenticate, authorize('patient'), updateMyPatientProfile);

router.get('/patients',     authenticate, authorize('admin', 'doctor'), getAllPatients);
router.get('/patients/:id', authenticate, authorize('admin', 'doctor'), getPatientById);
router.post('/patients',    authenticate, authorize('admin'), createPatient);
router.put('/patients/:id', authenticate, authorize('patient'), updatePatient);

router.get('/doctors',                    authenticate, authorize('admin', 'doctor', 'patient'), getAllDoctors);
router.get('/doctors/me',                 authenticate, authorize('doctor'), getMyDoctorProfile);
router.get('/doctors/:id',                authenticate, authorize('admin', 'doctor'), getDoctorById);
router.get('/doctors/:id/appointments',   authenticate, authorize('admin', 'doctor'), getDoctorAppointments);
router.post('/doctors',                   authenticate, authorize('admin'), createDoctor);
router.put('/doctors/:id',                authenticate, authorize('admin'), updateDoctor);
router.put('/doctors/:id/password',       authenticate, authorize('admin'), updateDoctorPassword);
router.delete('/doctors/:id',             authenticate, authorize('admin'), deleteDoctor);
router.get('/departments',                authenticate, authorize('admin', 'patient'), getDepartments);

router.post('/appointments',                  authenticate, authorize('patient'), createAppointment);
router.get('/appointments',                   authenticate, authorize('admin', 'doctor'), getAllAppointments);
router.get('/appointments/me',                authenticate, authorize('patient'), getMyAppointments);
router.get('/appointments/doctor/:doctorId',  authenticate, authorize('patient'), getDoctorBookedSlots);
router.put('/appointments/:id/status',        authenticate, authorize('admin', 'doctor'), updateAppointmentStatus);
router.delete('/appointments/:id',            authenticate, authorize('patient'), cancelAppointment);

router.post('/prescriptions',                      authenticate, authorize('doctor'), createPrescription);
router.get('/prescriptions/patient/:patientId',    authenticate, authorize('admin', 'doctor'), getPatientPrescriptions);

router.post('/medical-records',                       authenticate, authorize('doctor'), createMedicalRecord);
router.get('/medical-records/patient/:patientId',     authenticate, authorize('admin', 'doctor', 'patient'), getPatientMedicalRecords);

export default router;
