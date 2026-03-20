import { useEffect, useState } from 'react';
import api from '../api';
import { PageHeader } from '../components/UI';
import { useAuth } from '../AuthContext';
import styles from './Dashboard.module.css';
import patientIcon from '../assets/uvchtun.jpg';
import doctorIcon from '../assets/emchid.jpg';
import apptIcon from '../assets/tsag.jpg';
import pendingIcon from '../assets/pend.jpg';

const fmtDate = d => d ? new Date(d).toLocaleString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const statusLabel = s => ({ pending: 'Хүлээгдэж байна', confirmed: 'Баталгаажсан', completed: 'Дууссан', cancelled: 'Цуцлагдсан' })[s] || s;

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ patients: '—', doctors: '—', appointments: '—', pending: '—' });
  const [recentAppts, setRecentAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'patient') {
          const a = await api.get('/appointments/me').catch(() => ({ data: { total: '—', appointments: [] } }));
          setStats({
            patients: '—',
            doctors: '—',
            appointments: a.data.total,
            pending: Array.isArray(a.data.appointments) ? a.data.appointments.filter(x => x.status === 'pending').length : '—',
          });
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          const patientAppts = (a.data.appointments || [])
            .filter(x => new Date(x.appointment_date).getTime() >= sixMonthsAgo.getTime());
          setRecentAppts(patientAppts.slice(0, 8));
        } else {
          const [p, d, a] = await Promise.all([
            api.get('/patients').catch(() => ({ data: { total: '—' } })),
            api.get('/doctors').catch(() => ({ data: { total: '—' } })),
            api.get('/appointments').catch(() => ({ data: { total: '—', appointments: [] } })),
          ]);
          setStats({
            patients: p.data.total,
            doctors: d.data.total,
            appointments: a.data.total,
            pending: Array.isArray(a.data.appointments) ? a.data.appointments.filter(x => x.status === 'pending').length : '—',
          });
          const appts = a.data.appointments || [];
          if (user?.role === 'admin') {
            const since = Date.now() - 24 * 60 * 60 * 1000;
            setRecentAppts(appts.filter(x => new Date(x.appointment_date).getTime() >= since).slice(0, 8));
          } else {
            setRecentAppts(appts.slice(0, 8));
          }
        }
      } finally { setLoading(false); }
    };
    load();
  }, [user?.role]);

  return (
    <div className={'fade-up'}>
      <PageHeader title="Хяналтын самбар"  />

      <div className={styles.statsGrid}>
        {(user?.role === 'patient'
          ? [
              { key: 'appointments', img: apptIcon, value: stats.appointments, label: 'Цаг захиалга', color: '#a78bfa' },
              { key: 'pending', img: pendingIcon, value: stats.pending, label: 'Хүлээгдэж байна', color: '#ffb347' },
            ]
          : [
              { key: 'patients', img: patientIcon, value: stats.patients, label: 'Нийт өвчтөн', color: '#38bdf8' },
              { key: 'doctors', img: doctorIcon, value: stats.doctors, label: 'Нийт эмч', color: '#22c55e' },
              { key: 'appointments', img: apptIcon, value: stats.appointments, label: 'Цаг захиалга', color: '#a78bfa' },
              { key: 'pending', img: pendingIcon, value: stats.pending, label: 'Хүлээгдэж байна', color: '#ffb347' },
            ]
        ).map((s, i) => (
          <div
            key={i}
            className={`${styles.statCard} ${s.key === 'doctors' ? styles.statCardCompact : ''}`}
            style={{ '--c': s.color }}
          >
            <div className={styles.statGlow} />
            <div className={styles.statTop}>
              <div className={styles.statIcon}>
                {s.img ? <img src={s.img} alt="" /> : s.icon}
              </div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
            <div className={styles.statValue}>{loading ? <span className="spinner" /> : s.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>
            {user?.role === 'admin'
              ? 'Сүүлийн 24 цагийн цаг захиалгууд'
              : user?.role === 'patient'
                ? 'Сүүлийн 6 сарын цаг захиалгууд'
                : 'Сүүлийн цаг захиалгууд'}
          </h3>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              {user?.role === 'patient' ? (
                <>
                  <th>№</th><th>Эмч</th><th>Тасаг</th><th>Өрөө</th><th>Огноо</th><th>Статус</th>
                </>
              ) : (
                <>
                  <th>№</th><th>Өвчтөн</th><th>Утас</th><th>Эмч</th><th>Өрөө</th><th>Огноо</th><th>Статус</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={user?.role === 'patient' ? 6 : 7} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></td></tr>
            ) : recentAppts.length === 0 ? (
              <tr><td colSpan={user?.role === 'patient' ? 6 : 7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Мэдээлэл байхгүй</td></tr>
            ) : recentAppts.map((a, i) => (
              <tr key={a.id}>
                {user?.role === 'patient' ? (
                  <>
                    <td>{i + 1}</td>
                    <td>{a.doctor_first} {a.doctor_last}</td>
                    <td>{a.specialization || '—'}</td>
                    <td>{a.room_number || '—'}</td>
                    <td>{fmtDate(a.appointment_date)}</td>
                    <td><span className={`badge ${a.status}`}>{statusLabel(a.status)}</span></td>
                  </>
                ) : (
                  <>
                    <td>{i + 1}</td>
                    <td>{a.patient_first} {a.patient_last}</td>
                    <td>{a.patient_phone || '—'}</td>
                    <td>{a.doctor_first} {a.doctor_last}</td>
                    <td>{a.room_number || '—'}</td>
                    <td>{fmtDate(a.appointment_date)}</td>
                    <td><span className={`badge ${a.status}`}>{statusLabel(a.status)}</span></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
