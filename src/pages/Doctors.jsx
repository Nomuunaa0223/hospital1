import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { PageHeader, SearchBar, SearchInput, Btn, TableCard, EmptyRow, LoadingRow, Field, Input, Select, FormGrid, ModalFooter } from '../components/UI';
import { useToast } from '../ToastContext';
import { useAuth } from '../AuthContext';
import styles from './Table.module.css';

export default function Doctors() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [all, setAll] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pwdModal, setPwdModal] = useState(false);
  const [pwdDoctor, setPwdDoctor] = useState(null);
  const [pwdValue, setPwdValue] = useState('');
  const [autoPassword, setAutoPassword] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', specialization: '', phone: '', available_days: '', profile_image_url: '', experience_years: '', room_number: '', position_title: '', email: '', password: '' });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors');
      setAll(data.doctors); setFiltered(data.doctors);
    } catch { toast('Мэдээлэл ачаалахад алдаа гарлаа.', 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.departments || []);
    } catch {
      setDepartments([]);
    }
  }, []);

  useEffect(() => { if (isAdmin) loadDepartments(); }, [isAdmin, loadDepartments]);

  const filter = e => {
    const normalize = (s) => {
      const map = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z','и':'i','й':'i','к':'k','л':'l','м':'m','н':'n','о':'o','ө':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ү':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sh','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
        'ö':'o','ü':'u'
      };
      return (s || '')
        .toLowerCase()
        .replace(/[өүёа-яöü]/g, ch => map[ch] ?? ch)
        .replace(/[^a-z0-9]/g, '');
    };
    const q = normalize(e.target.value);
    setFiltered(all.filter(d => {
      if (!q) return true;
      const first = normalize(d.first_name);
      const last = normalize(d.last_name);
      return first.startsWith(q) || last.startsWith(q);
    }));
  };

  const submit = async () => {
    try {
      if (editingId) {
        const payload = { ...form, experience_years: form.experience_years ? +form.experience_years : null };
        delete payload.password;
        await api.put(`/doctors/${editingId}`, payload);
        toast('Эмчийн мэдээлэл шинэчлэгдлээ!');
      } else {
        const payload = { ...form, experience_years: form.experience_years ? +form.experience_years : null };
        if (autoPassword) delete payload.password;
        const { data } = await api.post('/doctors', payload);
        toast('Эмч амжилттай нэмэгдлээ!');
        if (data?.tempPassword) {
          toast(`Түр нууц үг: ${data.tempPassword}`);
        }
      }
      setModal(false);
      setEditingId(null);
      setForm({ first_name: '', last_name: '', specialization: '', phone: '', available_days: '', profile_image_url: '', experience_years: '', room_number: '', position_title: '', email: '', password: '' });
      setAutoPassword(true);
      load();
    } catch (e) { toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error'); }
  };

  const openEdit = (d) => {
    setEditingId(d.id);
    setForm({
      first_name: d.first_name || '',
      last_name: d.last_name || '',
      specialization: d.specialization || '',
      phone: d.phone || '',
      available_days: d.available_days || '',
      profile_image_url: d.profile_image_url || '',
      experience_years: d.experience_years ?? '',
      room_number: d.room_number ?? '',
      position_title: d.position_title ?? '',
      email: d.email || '',
      password: ''
    });
    setModal(true);
  };

  const remove = async (id) => {
    if (!window.confirm('Эмчийг устгах уу?')) return;
    try {
      await api.delete(`/doctors/${id}`);
      toast('Эмч устгагдлаа.');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error');
    }
  };

  const openPwd = (d) => {
    setPwdDoctor(d);
    setPwdValue('');
    setPwdModal(true);
  };

  const submitPwd = async () => {
    if (!pwdDoctor?.id) return;
    if (!pwdValue || pwdValue.length < 6) {
      return toast('Нууц үг 6+ тэмдэгт байна.', 'error');
    }
    try {
      await api.put(`/doctors/${pwdDoctor.id}/password`, { password: pwdValue });
      toast('Нууц үг шинэчлэгдлээ!');
      setPwdModal(false);
      setPwdDoctor(null);
      setPwdValue('');
    } catch (e) {
      toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error');
    }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Эмч нар" subtitle="Бүртгэлтэй эмч нарын жагсаалт" />
      <SearchBar>
        <SearchInput placeholder=" Хайх эмчийн нэрээ оруулна уу..." onChange={filter} />
        {isAdmin && <Btn className={styles.addBtn} onClick={() => { setEditingId(null); setAutoPassword(true); setModal(true); }}>＋ Эмч нэмэх</Btn>}
      </SearchBar>

      <TableCard>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>№</th><th>Нэр</th><th>Тасаг</th><th>Имэйл</th><th>Утас</th><th>Туршлага</th>{isAdmin && <th>Албан тушаал</th>}<th>Өрөө</th><th>Ажлын өдрүүд</th>{isAdmin && <th>Үйлдэл</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? <LoadingRow cols={isAdmin ? 11 : 9} /> : filtered.length === 0 ? <EmptyRow cols={isAdmin ? 11 : 9} /> :
              filtered.map((d, i) => (
                <tr key={d.id}>
                  <td>{i + 1}</td>
                  <td><strong>{d.first_name} {d.last_name}</strong></td>
                  <td>{d.specialization || '—'}</td>
                  <td>{d.email}</td>
                  <td>{d.phone || '—'}</td>
                  <td>{d.experience_years ? `${d.experience_years} жил` : '—'}</td>
                  {isAdmin && <td>{d.position_title || '—'}</td>}
                  <td>{d.room_number || '—'}</td>
                  <td>{d.available_days || '—'}</td>
                  {isAdmin && (
                    <td>
                      <div className={styles.actions}>
                        <Btn size="sm" variant="outline" className={styles.editBtn} onClick={() => openEdit(d)}>Засах</Btn>
                        <Btn size="sm" variant="danger" onClick={() => remove(d.id)}>Устгах</Btn>
                        <Btn size="sm" variant="outline" onClick={() => openPwd(d)}>Нууц үг</Btn>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            }
          </tbody>
        </table>
      </TableCard>

      {isAdmin && (
        <Modal open={modal} onClose={() => { setModal(false); setEditingId(null); }} title={editingId ? 'Эмч засах' : 'Эмч нэмэх'}>
          <FormGrid style={{ gap: '.6rem' }}>
            <Field label="Нэр"><Input value={form.first_name} onChange={set('first_name')} /></Field>
            <Field label="Овог"><Input value={form.last_name} onChange={set('last_name')}/></Field>
            <Field label="Тасаг">
              <Select value={form.specialization} onChange={set('specialization')}>
                <option value="">Тасаг сонгох</option>
                {departments.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </Select>
            </Field>
            <Field label="Утас"><Input value={form.phone} onChange={set('phone')} placeholder="99001122" /></Field>
            <Field label="Өрөөний дугаар"><Input value={form.room_number} onChange={set('room_number')} placeholder="101" /></Field>
            <Field label="Албан тушаал">
              <Select value={form.position_title} onChange={set('position_title')}>
                <option value="">Албан тушаал сонгох</option>
                <option value="Резидент эмч">Резидент эмч</option>
                <option value="Ээлжийн эмч">Ээлжийн эмч</option>
                <option value="Үзлэгийн эмч">Үзлэгийн эмч</option>
                <option value="Тасгийн эмч">Тасгийн эмч</option>
                <option value="Ахлах эмч">Ахлах эмч</option>
                <option value="Эрхлэгч эмч">Эрхлэгч эмч</option>
                <option value="Зөвлөх эмч">Зөвлөх эмч</option>
              </Select>
            </Field>
            <Field label="Ажлын өдрүүд"><Input value={form.available_days} onChange={set('available_days')} placeholder="Mon-Sun"/></Field>
            <Field label="Туршлага (жил)"><Input type="number" value={form.experience_years} onChange={set('experience_years')} /></Field>
            {editingId && <Field label="Имэйл"><Input type="email" value={form.email} onChange={set('email')} /></Field>}
            {!editingId && (
              <>
                <Field label="Имэйл"><Input type="email" value={form.email} onChange={set('email')} placeholder="doctor@example.com" /></Field>
                <Field label="Түр нууц үг үүсгэх">
                  <div style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
                    <input type="checkbox" checked={autoPassword} onChange={e => setAutoPassword(e.target.checked)} />
                    <span style={{ fontSize:'.85rem', color:'var(--muted)' }}>Систем автоматаар үүсгэнэ</span>
                  </div>
                </Field>
                {!autoPassword && (
                  <Field label="Нууц үг"><Input type="password" value={form.password} onChange={set('password')} placeholder="Doc1234!" /></Field>
                )}
              </>
            )}
          </FormGrid>
          <ModalFooter>
            <Btn variant="outline" onClick={() => { setModal(false); setEditingId(null); }}>Болих</Btn>
            <Btn onClick={submit}>{editingId ? 'Шинэчлэх' : 'Хадгалах'}</Btn>
          </ModalFooter>
        </Modal>
      )}

      {isAdmin && (
        <Modal open={pwdModal} onClose={() => { setPwdModal(false); setPwdDoctor(null); }} title="Нууц үг шинэчлэх">
          <FormGrid style={{ gap: '.6rem' }}>
            <Field label="Эмч">
              <Input value={pwdDoctor ? `${pwdDoctor.first_name} ${pwdDoctor.last_name}` : ''} disabled />
            </Field>
            <Field label="Шинэ нууц үг">
              <Input type="password" value={pwdValue} onChange={e => setPwdValue(e.target.value)} placeholder="••••••••" />
            </Field>
          </FormGrid>
          <ModalFooter>
            <Btn variant="outline" onClick={() => { setPwdModal(false); setPwdDoctor(null); }}>Болих</Btn>
            <Btn onClick={submitPwd}>Шинэчлэх</Btn>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
