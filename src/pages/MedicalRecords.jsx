import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { useToast } from '../ToastContext';
import { useAuth } from '../AuthContext';

const inp = { width:'100%', padding:'.55rem 1rem', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontFamily:'Manrope,sans-serif', fontSize:'.875rem', outline:'none' };
const lbl = { display:'block', fontSize:'.78rem', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' };
const thStyle = { textAlign:'left', padding:'.75rem 1.5rem', fontSize:'.72rem', color:'var(--muted)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', borderBottom:'1px solid var(--border)' };
const tdStyle = { padding:'.9rem 1.5rem', fontSize:'.875rem', borderBottom:'1px solid rgba(28,45,71,.5)' };

export default function MedicalRecords({ selectedPatientId = null, selectedAppointmentId = null, selectedDoctorId = null, onGoPrescriptions }) {
  const toast = useToast();
  const { user } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ appointment_id:'', patient_id:'', doctor_id:'', diagnosis:'', treatment:'', test_results:'', record_date:'', is_confidential: false });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const search = useCallback(async (id) => {
    const pid = id || patientId;
    if (!pid) return toast('Алдаа', 'error');
    setLoading(true);
    try {
      const { data } = await api.get(`/medical-records/patient/${pid}`);
      setList(data.records);
    } catch(e) { toast(e.response?.data?.error || 'Алдаа.', 'error'); }
    finally { setLoading(false); }
  }, [patientId, toast]);

  useEffect(() => {
    if (user?.role === 'patient' && user?.id) {
      const id = String(user.id);
      setPatientId(id);
      search(id);
    }
  }, [user, search]);

  useEffect(() => {
    if (user?.role !== 'patient' && selectedPatientId) {
      const id = String(selectedPatientId);
      setPatientId(id);
      search(id);
      setForm(f => ({
        ...f,
        appointment_id: selectedAppointmentId ? String(selectedAppointmentId) : f.appointment_id,
        patient_id: id,
        doctor_id: selectedDoctorId ? String(selectedDoctorId) : f.doctor_id
      }));
    }
  }, [selectedAppointmentId, selectedPatientId, selectedDoctorId, user?.role, search]);

  const markCompleted = async () => {
    if (!selectedAppointmentId) return;
    try {
      await api.put(`/appointments/${selectedAppointmentId}/status`, { status: 'completed' });
      toast('Үзлэг дуусгавар боллоо.');
      if (patientId) search(patientId);
    } catch (e) {
      toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error');
    }
  };

  const submit = async () => {
    try {
      await api.post('/medical-records', {
        ...form,
        appointment_id: +form.appointment_id || null,
        patient_id: +form.patient_id,
        doctor_id: +form.doctor_id,
        is_confidential: form.is_confidential === 'true' || form.is_confidential === true
      });
      toast('Эмнэлгийн бичлэг амжилттай хадгалагдлаа!');
      setModal(false);
      setForm({ patient_id:'', doctor_id:'', diagnosis:'', treatment:'', test_results:'', record_date:'', is_confidential: false });
      if (patientId) search();
    } catch(e) { toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error'); }
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem' }}>
          {user?.role === 'patient' ? 'Миний эмнэлгийн бичлэг, жор' : 'Эмнэлгийн бичлэг & Жор'}
        </h2>
        <p style={{ color:'var(--muted)', fontSize:'.875rem', marginTop:'.3rem' }}>Өвчтөний эмнэлгийн мэдээлэл, жорын түүх</p>
      </div>

      <div style={{ display:'flex', gap:'.75rem', marginBottom:'1.5rem', alignItems:'center' }}>
        {user?.role !== 'patient' && (
          <>
            
            <button onClick={() => search()} style={{ padding:'.65rem 1.8rem', background:'rgba(59,158,255,.15)', border:'none', borderRadius:10, color:'black', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>
              Өвчний түүх
            </button>
          </>
        )}

        {user?.role !== 'patient' && (
          <>
            {onGoPrescriptions && (
              <button onClick={onGoPrescriptions} style={{ padding:'.65rem 1.1rem', background:'rgba(59,158,255,.12)', border:'1px solid rgba(59,158,255,.35)', borderRadius:10, color:'var(--accent2)', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>
                Эмийн жор
              </button>
            )}
            {selectedAppointmentId && (
              <button onClick={markCompleted} style={{ padding:'.65rem 1.1rem', background:'rgba(34,197,94,.12)', border:'1px solid rgba(34,197,94,.35)', borderRadius:10, color:'#22c55e', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>
                Үзлэг дууссан
              </button>
            )}
            <button onClick={() => setModal(true)} style={{ padding:'.65rem 1.2rem', background:'rgba(0,212,170,.15)', border:'none', borderRadius:10, color:'var(--accent)', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif', marginLeft:'auto' }}>
              ＋ Бичлэг нэмэх
            </button>
          </>
        )}
      </div>

      {user?.role === 'doctor' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'1rem', marginBottom:'1.5rem' }}>
          <h3 style={{ margin:'0 0 0.75rem', fontSize:'1rem' }}>Шинээр эмнэлгийн бичлэг оруулах</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={lbl}>Өвчтөний ID</label>
              <input style={inp} type="number" value={form.patient_id} onChange={set('patient_id')} />
            </div>
            <div>
              <label style={lbl}>Эмчийн ID</label>
              <input style={inp} type="number" value={form.doctor_id} onChange={set('doctor_id')} />
            </div>
            <div>
              <label style={lbl}>Үзлэг ID</label>
              <input style={inp} type="number" value={form.appointment_id} onChange={set('appointment_id')} />
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={lbl}>Шинж тэмдэг</label>
              <input style={inp} value={form.treatment} onChange={set('treatment')} />
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={lbl}>Анхан онош</label>
              <input style={inp} value={form.diagnosis} onChange={set('diagnosis')} />
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={lbl}>Авсан шинжилгээ</label>
              <input style={inp} value={form.test_results} onChange={set('test_results')} />
            </div>
            <div>
              <label style={lbl}>Огноо</label>
              <input style={inp} type="date" value={form.record_date} onChange={set('record_date')} />
            </div>
            <div>
              <label style={lbl}>Статус</label>
              <select style={inp} value={form.is_confidential} onChange={set('is_confidential')}>
                <option value={false}>Дууссан</option>
                <option value={true}>Эмчлэгдэж байгаа</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop:'1rem', display:'flex', justifyContent:'flex-end' }}>
            <button onClick={submit} style={{ padding:'.55rem 1rem', background:'rgba(0,212,170,.15)', border:'none', borderRadius:8, color:'var(--accent)', fontWeight:700, cursor:'pointer' }}>
              Хадгалах
            </button>
          </div>
        </div>
      )}

      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden', marginBottom:'1.5rem' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {user?.role === 'doctor' ? (
                ['№', 'Өвчтөний нэр', 'Регистрийн No', 'Эмч', 'Шинж тэмдэг', 'Анхан онош', 'Эцсийн онош', 'Угдсан шинжилгээ', 'Статус', 'Огноо'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))
              ) : (
                ['№', 'Оношлогоо', 'Эмчилгээ', 'Эмч', 'Огноо', 'Нууц байдал'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={user?.role === 'doctor' ? 10 : 6} style={{ textAlign:'center', padding:'2rem' }}><span className="spinner"/></td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={user?.role === 'doctor' ? 10 : 6} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)' }}>
                Өгөгдөл олдсонгүй
              </td></tr>
            ) : list.map((r, i) => (
              <tr key={r.id}>
                {user?.role === 'doctor' ? (
                  <>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={tdStyle}>{`${r.patient_first || ''} ${r.patient_last || ''}`.trim() || '—'}</td>
                    <td style={tdStyle}>{r.registry_number || '—'}</td>
                    <td style={tdStyle}>{`${r.doctor_first || ''} ${r.doctor_last || ''}`.trim() || '—'}</td>
                    <td style={tdStyle}>{r.treatment || '—'}</td>
                    <td style={tdStyle}>{r.diagnosis || '—'}</td>
                    <td style={tdStyle}>{(r.treatment || r.diagnosis) ? (r.treatment || r.diagnosis) : '—'}</td>
                    <td style={tdStyle}>{r.test_results || '—'}</td>
                    <td style={tdStyle}>{r.is_confidential ? 'Нууц' : 'Ил'}</td>
                    <td style={tdStyle}>{r.record_date ? new Date(r.record_date).toLocaleDateString('mn-MN') : '—'}</td>
                  </>
                ) : (
                  <>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={tdStyle}>{r.diagnosis || '—'}</td>
                    <td style={tdStyle}>{r.treatment || '—'}</td>
                    <td style={tdStyle}>{`${r.doctor_first || ''} ${r.doctor_last || ''}`.trim() || '—'}</td>
                    <td style={tdStyle}>{r.record_date ? new Date(r.record_date).toLocaleDateString('mn-MN') : '—'}</td>
                    <td style={tdStyle}>{r.is_confidential ? 'Нууц' : 'Ил'}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {user?.role !== 'patient' && (
        <Modal open={modal} onClose={() => setModal(false)} title="Medical record">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1rem' }}>
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>№</label>
              <input style={inp} type="number" placeholder="1" value={form.patient_id} onChange={set('patient_id')} />
            </div>
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Эмчийн ID</label>
              <input style={inp} type="number" placeholder="1" value={form.doctor_id} onChange={set('doctor_id')} />
            </div>
            <div style={{ marginBottom:'.75rem', gridColumn:'1/-1' }}>
              <label style={lbl}>Өвчны хэлбэр</label>
              <input style={inp} placeholder="" value={form.diagnosis} onChange={set('diagnosis')} />
            </div>
            <div style={{ marginBottom:'.75rem', gridColumn:'1/-1' }}>
              <label style={lbl}>Эмчилгээ</label>
              <input style={inp} placeholder="" value={form.treatment} onChange={set('treatment')} />
            </div>
            <div style={{ marginBottom:'.75rem', gridColumn:'1/-1' }}>
              <label style={lbl}>Шинжилгээны хариу</label>
              <input style={inp} placeholder="" value={form.test_results} onChange={set('test_results')} />
            </div>
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Огноо</label>
              <input style={inp} type="date" value={form.record_date} onChange={set('record_date')} />
            </div>
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Байдал</label>
              <select style={inp} value={form.is_confidential} onChange={set('is_confidential')}>
                <option value={false}>Дууссан</option>
                <option value={true}>Эмчлэгдэж байгаа</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end', marginTop:'1rem' }}>
            <button onClick={() => setModal(false)} style={{ padding:'.55rem 1.1rem', background:'none', border:'1px solid var(--border)', borderRadius:9, color:'var(--muted)', cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>Засах</button>
            <button onClick={submit} style={{ padding:'.55rem 1.1rem', background:'rgba(0,212,170,.15)', border:'none', borderRadius:9, color:'var(--accent)', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>Хадгалах</button>
          </div>
        </Modal>
      )}
    </div>
  );
}