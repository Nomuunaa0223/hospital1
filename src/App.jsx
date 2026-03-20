import './index.css';
import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Prescriptions from './pages/Prescriptions';
import MedicalRecords from './pages/MedicalRecords';
import Appointments from './pages/Appointments';
import Profile from './pages/Profile';
import BookingDepartments from './pages/BookingDepartments';
import BookingDoctors from './pages/BookingDoctors';
import BookingSchedule from './pages/BookingSchedule';
import ChangePassword from './pages/ChangePassword';
import Sidebar from './components/Sidebar';
import styles from './App.module.css';

function Inner() {
  const { user, checking } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  if (checking) return <div style={{ padding: '2rem' }}>Шалгаж байна...</div>;
  if (!user) return <Auth />;
  if (user?.must_change_password) return <ChangePassword />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':      return <Dashboard />;
      case 'patients':       return <Patients />;
      case 'doctors':        return <Doctors />;
      case 'appointments':
        return (
          <Appointments
            onSelectAppointment={(appt) => {
              setSelectedPatientId(appt?.patient_id || null);
              setSelectedAppointmentId(appt?.id || null);
              setSelectedDoctorId(appt?.doctor_id || null);
              setPage('medicalRecords');
            }}
          />
        );
      case 'prescriptions':
        return (
          <Prescriptions
            selectedPatientId={selectedPatientId}
            selectedAppointmentId={selectedAppointmentId}
            selectedDoctorId={selectedDoctorId}
            onGoRecords={() => setPage('medicalRecords')}
          />
        );
      case 'medicalRecords':
        return (
          <MedicalRecords
            selectedPatientId={selectedPatientId}
            selectedAppointmentId={selectedAppointmentId}
            selectedDoctorId={selectedDoctorId}
            onGoPrescriptions={() => setPage('prescriptions')}
          />
        );
      case 'myAppointments': return <Appointments myOnly onNewBooking={() => setPage('bookingDepartments')} />;
      case 'profile':        return <Profile />;
      case 'bookingDepartments':
        return (
          <BookingDepartments
            selected={selectedDepartment}
            onSelect={(dep) => { setSelectedDepartment(dep); setSelectedDoctor(null); setPage('bookingDoctors'); }}
          />
        );
      case 'bookingDoctors':
        return (
          <BookingDoctors
            department={selectedDepartment}
            onBack={() => setPage('bookingDepartments')}
            onSelectDoctor={(doc) => { setSelectedDoctor(doc); setPage('bookingSchedule'); }}
          />
        );
      case 'bookingSchedule':
        return (
          <BookingSchedule
            department={selectedDepartment}
            doctor={selectedDoctor}
            onBack={() => setPage('bookingDoctors')}
            onDone={() => setPage('myAppointments')}
          />
        );
      default:               return <Dashboard />;
    }
  };

  return (
    <div className={styles.app}>
      <Sidebar page={page} setPage={setPage} />
      <main className={styles.main}>
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Inner />
      </ToastProvider>
    </AuthProvider>
  );
}
