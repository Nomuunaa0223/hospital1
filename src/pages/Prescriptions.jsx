import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { useToast } from '../ToastContext';
import { useAuth } from '../AuthContext';

const inp = { width:'100%', padding:'.7rem 1rem', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontFamily:'Manrope,sans-serif', fontSize:'.875rem', outline:'none' };
const lbl = { display:'block', fontSize:'.78rem', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' };
const thStyle = { textAlign:'left', padding:'.75rem 1.5rem', fontSize:'.72rem', color:'var(--muted)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', borderBottom:'1px solid var(--border)' };
const tdStyle = { padding:'.9rem 1.5rem', fontSize:'.875rem', borderBottom:'1px solid rgba(28,45,71,.5)' };

export default function Prescriptions({ selectedPatientId = null, selectedAppointmentId = null, selectedDoctorId = null, onGoRecords }) {
  const toast = useToast();
  const { user } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ appointment_id:'', doctor_id:'', patient_id:'', medication:'', dosage:'', duration:'', instructions:'' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const search = useCallback(async (id) => {
    const pid = id || patientId;
    if (!pid) return toast('Өвчтөний ID оруулна уу.', 'error');
    setLoading(true);
    try {
      const { data } = await api.get(`/prescriptions/patient/${pid}`);
      setList(data.prescriptions);
    } catch(e) { toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error'); }
    finally { setLoading(false); }
  }, [patientId, toast]);

  // Өвчтөн нэвтэрсэн бол автоматаар өөрийн жорыг харуулна
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
        patient_id: id,
        doctor_id: selectedDoctorId ? String(selectedDoctorId) : f.doctor_id,
        appointment_id: selectedAppointmentId ? String(selectedAppointmentId) : f.appointment_id
      }));
    }
  }, [selectedPatientId, selectedDoctorId, selectedAppointmentId, user?.role, search]);

  const markCompleted = async () => {
    if (!selectedAppointmentId) return;
    try {
      await api.put(`/appointments/${selectedAppointmentId}/status`, { status: 'completed' });
      toast('Үзлэг дууссан гэж тэмдэглэгдлээ.');
    } catch (e) {
      toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error');
    }
  };

  const submit = async () => {
    try {
      await api.post('/prescriptions', {
        ...form,
        appointment_id: +form.appointment_id,
        doctor_id: +form.doctor_id,
        patient_id: +form.patient_id
      });
      toast('Амжилттай хадгалагдлаа!');
      setModal(false);
      setForm({ appointment_id:'', doctor_id:'', patient_id:'', medication:'', dosage:'', duration:'', instructions:'' });
      if (patientId) search();
    } catch(e) { toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error'); }
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem' }}>
          {user?.role === 'patient' ? 'Миний жорууд' : 'Жорын жагсаалт'}
        </h2>
        <p style={{ color:'var(--muted)', fontSize:'.875rem', marginTop:'.3rem' }}>Өвчтөний жорын мэдээлэл</p>
      </div>

      {/* Хайлт зөвхөн admin/doctor-д харагдана */}
      <div style={{ display:'flex', gap:'.75rem', marginBottom:'1.5rem', alignItems:'center' }}>
        {user?.role !== 'patient' && (
          <>
            <input
              style={{ ...inp, maxWidth:220 }}
              type="number"
              placeholder="Өвчтөний ID"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
            <button onClick={() => search()} style={{ padding:'.65rem 1.8rem', background:'rgba(59,158,255,.15)', border:'none', borderRadius:10, color:'var(--accent2)', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>
              Эмийн Жор
            </button>
          </>
        )}

        {/* Жор нэмэх зөвхөн doctor/admin-д */}
        {user?.role !== 'patient' && (
          <>
            {onGoRecords && (
              <button onClick={onGoRecords} style={{ padding:'.65rem 1.1rem', background:'rgba(59,158,255,.12)', border:'1px solid rgba(59,158,255,.35)', borderRadius:10, color:'var(--accent2)', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>
                Бичлэг
              </button>
            )}
            {selectedAppointmentId && (
              <button onClick={markCompleted} style={{ padding:'.65rem 1.1rem', background:'rgba(34,197,94,.12)', border:'1px solid rgba(34,197,94,.35)', borderRadius:10, color:'#22c55e', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>
                Үзлэг дууссан
              </button>
            )}
            <button onClick={() => setModal(true)} style={{ padding:'.65rem 1.2rem', background:'rgba(0,212,170,.15)', border:'none', borderRadius:10, color:'var(--accent)', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif', marginLeft:'auto' }}>
              ＋ Жор бичих
            </button>
          </>
        )}
      </div>

      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Эм','Тун','Хугацаа','Эмч','Мэргэжил','Он/Сар/Өдөр'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem' }}><span className="spinner"/></td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)' }}>
                {user?.role === 'patient' ? 'Жор байхгүй байна' : patientId ? 'Жор олдсонгүй' : 'Өвчтөний ID оруулж хайна уу'}
              </td></tr>
            ) : list.map(p => (
              <tr key={p.id}>
                <td style={tdStyle}><strong>{p.medication}</strong></td>
                <td style={tdStyle}>{p.dosage}</td>
                <td style={tdStyle}>{p.duration}</td>
                <td style={tdStyle}>{p.doctor_first} {p.doctor_last}</td>
                <td style={tdStyle}><span className="badge doctor">{p.specialization}</span></td>
                <td style={tdStyle}>{p.issued_at ? new Date(p.issued_at).toLocaleDateString('mn-MN') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Жор бичих modal - зөвхөн doctor/admin */}
      {user?.role !== 'patient' && (
        <Modal open={modal} onClose={() => setModal(false)} title="Жор бичих">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1rem' }}>
            {[
              ['Цаг захиалга','appointment_id','number'],
              ['Эмч','doctor_id','number'],
              ['Өвчтөн','patient_id','number'],
              ['Эм','medication','text'],
              ['Тун','dosage','text'],
              ['Хугацаа','duration','text'],
            ].map(([label,key,type]) => (
              <div key={key} style={{ marginBottom:'1rem' }}>
                <label style={lbl}>{label}</label>
                <input style={inp} type={type} value={form[key]} onChange={set(key)} />
              </div>
            ))}
            <div style={{ marginBottom:'1rem', gridColumn:'1/-1' }}>
              <label style={lbl}>Заавар</label>
              <input style={inp} value={form.instructions} onChange={set('instructions')} />
            </div>
          </div>
          <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end', marginTop:'1.5rem' }}>
            <button onClick={() => setModal(false)} style={{ padding:'.55rem 1.1rem', background:'none', border:'1px solid var(--border)', borderRadius:9, color:'var(--muted)', cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>Болих</button>
            <button onClick={submit} style={{ padding:'.55rem 1.1rem', background:'rgba(0,212,170,.15)', border:'none', borderRadius:9, color:'var(--accent)', fontWeight:700, cursor:'pointer', fontFamily:'Manrope,sans-serif' }}>Хадгалах</button>
          </div>
        </Modal>
      )}
    </div>
  );
}




