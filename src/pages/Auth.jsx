import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import styles from './Auth.module.css';
import hosLogo from '../assets/hos.jpg';

export default function Auth() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'patient' });
  const { login } = useAuth();
  const toast = useToast();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // OAuth callback — URL-ээс token авна
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    if (error) {
      toast(`${error === 'google' ? 'Google' : 'Facebook'}-ээр нэвтрэхэд алдаа гарлаа.`, 'error');
      window.history.replaceState({}, '', '/');
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(user, token);
        window.history.replaceState({}, '', '/');
        toast('Амжилттай нэвтэрлээ! 🎉');
      } catch(e) {
        toast('Нэвтрэхэд алдаа гарлаа.', 'error');
      }
    }
  }, [login, toast]);

  const handleLogin = async () => {
    if (!form.email || !form.password) return toast('Бүх талбарыг бөглөнө үү.', 'error');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
      login(data.user, data.token);
      toast('Амжилттай нэвтэрлээ! 🎉');
    } catch (e) {
      toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!form.email || !form.password) return toast('Бүх талбарыг бөглөнө үү.', 'error');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast('Бүртгэл амжилттай! Нэвтэрнэ үү.');
      setTab('login');
    } catch (e) {
      toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.bg} />
      <div className={styles.card + ' fade-up'}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <img src={hosLogo} alt="" className={styles.logoImg} />
          </div>
          <div>
            <h1 className={styles.logoTitle}>Hospital Management System</h1>
            <p className={styles.logoSub}>Эмнэлгийн удирдлагын систем</p>
          </div>
        </div>

        <div className={styles.tabs}>
          <button className={styles.tab + (tab === 'login' ? ' ' + styles.active : '')} onClick={() => setTab('login')}>Нэвтрэх</button>
          <button className={styles.tab + (tab === 'register' ? ' ' + styles.active : '')} onClick={() => setTab('register')}>Бүртгүүлэх</button>
        </div>

        <div className={styles.fields}>
          <label className={styles.label}>Имэйл</label>
          <input className={styles.input} type="email" placeholder="example@hospital.mn" value={form.email} onChange={set('email')} onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleRegister())} />
        </div>
        <div className={styles.fields}>
          <label className={styles.label}>Нууц үг</label>
          <input className={styles.input} type="password" placeholder="••••••••" value={form.password} onChange={set('password')} onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleRegister())} />
        </div>

        {tab === 'register' && (
          <div className={styles.fields}>
            <div className={styles.note}>Зөвхөн өвчтөн бүртгүүлнэ.</div>
          </div>
        )}

        <button className={styles.btn} disabled={loading} onClick={tab === 'login' ? handleLogin : handleRegister}>
          {loading ? <span className="spinner" /> : tab === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
        </button>

        {/* ── Хэрэв нэвтрэх tab байвал OAuth товчнуудыг харуулна ── */}
        {tab === 'login' && (
          <>
            {/* Хуваагч шугам */}
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', margin:'1.25rem 0' }}>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              <span style={{ color:'var(--muted)', fontSize:'.75rem', fontWeight:500 }}>эсвэл</span>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            </div>

            {/* Google */}
            <a
              href="http://localhost:3000/api/auth/google"
              style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:'.75rem',
                padding:'.75rem', borderRadius:11, border:'1px solid var(--border)',
                background:'var(--surface2)', color:'var(--text)', textDecoration:'none',
                fontWeight:600, fontSize:'.875rem', marginBottom:'.75rem',
                transition:'all .2s', fontFamily:'Manrope,sans-serif',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#4285f4'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google-ээр нэвтрэх
            </a>

           
            
          </>
        )}
      </div>
    </div>
  );
}
