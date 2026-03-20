import { useAuth } from '../AuthContext';
import patientIcon from '../assets/uvchtun.jpg';
import doctorIcon from '../assets/emchid.jpg';
import apptIcon from '../assets/tsag.jpg';
import pendingIcon from '../assets/pend.jpg';

const roleLabel = r => ({ admin: 'Админ', doctor: 'Эмч', patient: 'Өвчтөн' }[r] || r);

const adminNav  = [
  { id: 'dashboard',    icon: pendingIcon, label: 'Хяналтын самбар' },
  { id: 'patients',     icon: patientIcon, label: 'Өвчтөнүүд' },
  { id: 'doctors',      icon: doctorIcon, label: 'Эмч нар' },
  { id: 'appointments', icon: apptIcon, label: 'Цаг захиалга' },
];
const doctorNav = [
  { id: 'dashboard',    icon: pendingIcon, label: 'Хяналтын самбар' },
  { id: 'appointments', icon: apptIcon, label: 'Цаг захиалга' },
  { id: 'patients',     icon: patientIcon, label: 'Өвчтөнүүд' },
  { id: 'profile',      icon: doctorIcon, label: 'Миний профайл' },
];
const patientNav = [
  { id: 'dashboard',      icon: pendingIcon, label: 'Хяналтын самбар' },
  { id: 'myAppointments', icon: apptIcon, label: 'Миний цагууд' },  { id: 'medicalRecords', icon: doctorIcon, label: 'Эмнэлгийн түүх' },  { id: 'profile',        icon: patientIcon, label: 'Миний профайл' },
];

const s = {
  sidebar:  { width:240, minHeight:'100vh', background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'1.5rem 1rem', position:'fixed', left:0, top:0, bottom:0, zIndex:100 },
  logo:     { display:'flex', alignItems:'center', gap:'.65rem', marginBottom:'2.5rem', padding:'0 .5rem' },
  logoIcon: { width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#00d4aa,#3b9eff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' },
  logoText: { fontFamily:"Roboto, serif", fontSize:'1.78rem', fontWeight:900, letterSpacing:'.02em', color:'#112c66' },
  nav:      { display:'flex', flexDirection:'column', gap:'.25rem' },
  footer:   { marginTop:'auto', borderTop:'1px solid var(--border)', paddingTop:'1rem' },
  contact:  { borderTop:'1px solid var(--border)', paddingTop:'.9rem', marginTop:'1rem' },
  contactTitle: { fontSize:'.98rem', fontWeight:400, color:'#2e4c8c', letterSpacing:'.05em', marginBottom:'.55rem' },
  contactItem: { fontSize:'.82rem', color:'var(--text)', marginBottom:'.4rem', lineHeight:1.35, paddingLeft:'.35rem', borderLeft:'2px solid rgba(64, 100, 189, 0.25)' },
  badge:    { display:'flex', alignItems:'center', gap:'.7rem', padding:'.65rem .85rem', borderRadius:10, background:'var(--surface2)', marginBottom:'.5rem' },
  avatar:   { width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#00d4aa,#3b9eff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.85rem', fontWeight:800, color:'#060d1a', flexShrink:0 },
  logoutBtn:{ width:'100%', padding:'.6rem .85rem', background:'linear-gradient(135deg, rgba(0,212,170,.85), rgba(47,107,255,.15))', border:'1px solid rgba(0,212,170,.45)', borderRadius:10, color:'#06101b', cursor:'pointer', fontSize:'.82rem', fontFamily:'Manrope,sans-serif', fontWeight:700, letterSpacing:'.01em', boxShadow:'0 8px 18px rgba(0,212,170,.25)', transition:'background .15s ease, border-color .15s ease, box-shadow .2s ease, transform .12s ease' },
};

export default function Sidebar({ page, setPage }) {
  const { user, logout } = useAuth();
  const nav = user?.role === 'admin' ? adminNav : user?.role === 'doctor' ? doctorNav : patientNav;

  return (
    <aside style={s.sidebar}>
      <div style={s.logo}>
        <span style={s.logoText}>Hospital Management System</span>
      </div>
      <nav style={s.nav}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            display:'flex', alignItems:'center', gap:'.7rem',
            padding:'.65rem .85rem', borderRadius:10, cursor:'pointer',
            background: page === item.id ? 'rgba(0,212,170,.1)' : 'none',
            border:'none', color: page === item.id ? 'var(--accent)' : 'var(--muted)',
            fontSize:'.875rem', fontWeight:500, fontFamily:'Manrope,sans-serif',
            textAlign:'left', width:'100%', transition:'all .15s'
          }}>
            <span style={{ width:22, height:22, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
              <img src={item.icon} alt="" style={{ width:20, height:20, borderRadius:6, objectFit:'contain' }} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>
      {user?.role === 'patient' && (
        <div style={s.contact}>
          <div style={s.contactTitle}>Холбоо барих</div>
          <div style={s.contactItem}>Эмнэлгийн хаяг: Энхтайвны өргөн чөлөө Шангрил-Ла молл 1010</div>
          <div style={s.contactItem}>Утас: 7011-2233</div>
          <div style={s.contactItem}>Имэйл: Suld@hospital.mn</div>
        </div>
      )}
      <div style={s.footer}>
        <div style={s.badge}>
          <div style={{ overflow:'hidden' }}>
            <p style={{ fontSize:'.78rem', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</p>
            <span className={`badge ${user?.role}`}>{roleLabel(user?.role)}</span>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={logout}>Гарах</button>
      </div>
    </aside>
  );
}
