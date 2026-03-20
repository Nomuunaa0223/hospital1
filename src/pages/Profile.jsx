import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../ToastContext';
import { PageHeader, Btn, Field, Input, Select, FormGrid, TableCard } from '../components/UI';
import { useAuth } from '../AuthContext';
import styles from './Profile.module.css';

const bloodOptions = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const toInputDate = v => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const isDoctor = user?.role === 'doctor';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    phone: '',
    address: '',
    blood_type: 'A+',
    registry_number: ''
  });

  const set = k => e => {
    let v = e.target.value;
    if (k === 'registry_number') {
      const letters = (v.match(/[А-ЯӨҮа-яөү]/g) || []).join('').toUpperCase().slice(0, 2);
      const digits = (v.match(/\d/g) || []).join('').slice(0, 8);
      v = `${letters}${digits}`.slice(0, 10);
    }
    setForm(f => ({ ...f, [k]: v }));
    setErrors(errs => ({ ...errs, [k]: '' }));
  };

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const { data } = await api.get('/patients/me');
      if (data?.profile === null) {
        setNotFound(true);
        setEmail(data.email || '');
        setForm({ first_name: '', last_name: '', date_of_birth: '', gender: 'male', phone: '', address: '', blood_type: 'A+', registry_number: '' });
        setErrors({});
        setEditing(true);
        return;
      }
      setEmail(data.email || '');
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        date_of_birth: toInputDate(data.date_of_birth),
        gender: data.gender || 'male',
        phone: data.phone || '',
        address: data.address || '',
        blood_type: data.blood_type || 'A+',
        registry_number: data.registry_number || ''
      });
      setEditing(false);
    } catch (e) {
      toast(e.response?.data?.error || 'Профайл ачаалахад алдаа гарлаа.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadDoctor = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors/me');
      setEmail(data.email || '');
      setDoctorProfile(data.profile || null);
    } catch (e) {
      toast(e.response?.data?.error || 'Профайл ачаалахад алдаа гарлаа.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isDoctor) {
      loadDoctor();
    } else {
      load();
    }
  }, [isDoctor, load, loadDoctor]);

  const validate = () => {
    const next = {};
    if (!form.first_name?.trim()) next.first_name = 'Нэр заавал';
    if (!form.last_name?.trim()) next.last_name = 'Овог заавал';
    if (!form.date_of_birth) next.date_of_birth = 'Төрсөн огноо заавал';
    if (!form.gender) next.gender = 'Хүйс заавал';
    if (!form.phone) next.phone = 'Утасны дугаар заавал';
    if (!form.address) next.address = 'Гэрийн хаяг заавал';
    if (form.registry_number && !/^[А-ЯӨҮ]{2}\d{8}$/.test(form.registry_number)) {
      next.registry_number = 'Регистр: 2 монгол үсэг + 8 тоо';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      window.alert('Бүх заавал талбаруудыг бүрэн бөглөнө үү.');
    }
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        date_of_birth: form.date_of_birth || null
      };
      const { status, data } = await api.put('/patients/me', payload);
      toast(status === 201 ? 'Профайл үүсгэгдлээ.' : 'Профайл амжилттай шинэчлэгдлээ.');
      if (data?.profile) {
        setNotFound(false);
        setForm({
          first_name: data.profile.first_name || '',
          last_name: data.profile.last_name || '',
          date_of_birth: toInputDate(data.profile.date_of_birth),
          gender: data.profile.gender || 'male',
          phone: data.profile.phone || '',
          address: data.profile.address || '',
          blood_type: data.profile.blood_type || 'A+',
          registry_number: data.profile.registry_number || ''
        });
        setEditing(false);
      } else {
        load();
      }
    } catch (e) {
      toast(e.response?.data?.error || 'Шинэчлэхэд алдаа гарлаа.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isDoctor) {
    return (
      <div className="fade-up">
        <PageHeader
          title="Миний профайл"
          subtitle="Өөрийн мэдээллээ харах"
        />

        <div className={styles.grid}>
          <TableCard>
            <div className={styles.profileCard}>
              <div className={styles.avatar}>
                {(doctorProfile?.first_name?.[0] || email?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <h3 className={styles.name}>
                  {doctorProfile?.first_name || '—'} {doctorProfile?.last_name || ''}
                </h3>
                <p className={styles.email}>{email || '—'}</p>
                <div className={styles.badges}>
                  <span className="badge doctor">Эмч</span>
                  {doctorProfile?.specialization && <span className="badge confirmed">{doctorProfile.specialization}</span>}
                </div>
              </div>
            </div>

            {loading ? (
              <div className={styles.loading}>Ачаалж байна...</div>
            ) : !doctorProfile ? (
              <div className={styles.readonlyHint}>Эмчийн профайл олдсонгүй.</div>
            ) : (
              <div className={styles.meta}>
                <div>
                  <span className={styles.metaLabel}>Утас</span>
                  <p className={styles.metaValue}>{doctorProfile.phone || '—'}</p>
                </div>
                <div>
                  <span className={styles.metaLabel}>Өрөө</span>
                  <p className={styles.metaValue}>{doctorProfile.room_number || '—'}</p>
                </div>
                <div>
                  <span className={styles.metaLabel}>Албан тушаал</span>
                  <p className={styles.metaValue}>{doctorProfile.position_title || '—'}</p>
                </div>
                <div>
                  <span className={styles.metaLabel}>Туршлага (жил)</span>
                  <p className={styles.metaValue}>{doctorProfile.experience_years ?? '—'}</p>
                </div>
                <div className={styles.metaWide}>
                  <span className={styles.metaLabel}>Ажлын өдрүүд</span>
                  <p className={styles.metaValue}>{doctorProfile.available_days || '—'}</p>
                </div>
              </div>
            )}
          </TableCard>

          <TableCard>
            <div className={styles.readonlyHint}>Профайл засах эрх одоогоор нээлтгүй.</div>
          </TableCard>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <PageHeader
        title="Миний профайл"
        subtitle="Өөрийн мэдээллээ харах, засах"
      >
        <div className={styles.headerActions}>
          <Btn variant="outline" onClick={load} disabled={loading || saving}>Дахин ачаалах</Btn>
          {editing ? (
            <>
              <Btn variant="outline" onClick={() => { setEditing(false); setErrors({}); load(); }} disabled={loading || saving}>Болих</Btn>
              <Btn onClick={save} disabled={loading || saving}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</Btn>
            </>
          ) : (
            <Btn onClick={() => setEditing(true)} disabled={loading || saving}>Засах</Btn>
          )}
        </div>
      </PageHeader>

      <div className={styles.grid}>
        <TableCard>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>
              {(form.first_name?.[0] || email?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <h3 className={styles.name}>
                {form.first_name || '—'} {form.last_name || ''}
              </h3>
              <p className={styles.email}>{email || '—'}</p>
              <div className={styles.badges}>
                <span className="badge patient">Өвчтөн</span>
                <span className="badge confirmed">{form.blood_type || '—'}</span>
              </div>
            </div>
          </div>

          <div className={styles.meta}>
            <div>
              <span className={styles.metaLabel}>Хүйс</span>
              <p className={styles.metaValue}>
                {form.gender === 'male' ? 'Эрэгтэй' : form.gender === 'female' ? 'Эмэгтэй' : 'Бусад'}
              </p>
            </div>
            <div>
              <span className={styles.metaLabel}>Утас</span>
              <p className={styles.metaValue}>{form.phone || '—'}</p>
            </div>
            <div>
              <span className={styles.metaLabel}>Төрсөн огноо</span>
              <p className={styles.metaValue}>{form.date_of_birth || '—'}</p>
            </div>
            <div>
              <span className={styles.metaLabel}>Регистрийн дугаар</span>
              <p className={styles.metaValue}>{form.registry_number || '—'}</p>
            </div>
            <div className={styles.metaWide}>
              <span className={styles.metaLabel}>Хаяг</span>
              <p className={styles.metaValue}>{form.address || '—'}</p>
            </div>
          </div>
        </TableCard>

        <TableCard>
          {loading ? (
            <div className={styles.loading}>Ачаалж байна...</div>
          ) : editing ? (
            <>
              {notFound && (
                <div className={styles.notice}>Профайл үүсгээгүй байна. Доорх талбаруудыг бөглөж хадгалаарай.</div>
              )}
              <FormGrid>
              <Field label="Нэр">
                <Input value={form.first_name} onChange={set('first_name')} />
                {errors.first_name && <small className={styles.error}>{errors.first_name}</small>}
              </Field>
              <Field label="Овог">
                <Input value={form.last_name} onChange={set('last_name')} />
                {errors.last_name && <small className={styles.error}>{errors.last_name}</small>}
              </Field>
              <Field label="Утас"><Input value={form.phone} onChange={set('phone')} /></Field>
              <Field label="Хүйс">
                <Select value={form.gender} onChange={set('gender')}>
                  <option value="male">Эрэгтэй</option>
                  <option value="female">Эмэгтэй</option>
                  <option value="other">Бусад</option>
                </Select>
                {errors.gender && <small className={styles.error}>{errors.gender}</small>}
              </Field>
              <Field label="Цусны бүлэг">
                <Select value={form.blood_type} onChange={set('blood_type')}>
                  {bloodOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </Select>
              </Field>
              <Field label="Төрсөн огноо">
                <Input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
                {errors.date_of_birth && <small className={styles.error}>{errors.date_of_birth}</small>}
              </Field>
              <Field label="Регистрийн дугаар">
                <Input value={form.registry_number} onChange={set('registry_number')} maxLength={10} placeholder="АА12345678" />
                {errors.registry_number && <small className={styles.error}>{errors.registry_number}</small>}
              </Field>
              <Field label="Хаяг">
                <Input value={form.address} onChange={set('address')} placeholder="Хот/Дүүрэг/Хороо/Тоот"
                
                
                />
              </Field>
            </FormGrid>
            </>
          ) : (
            <div className={styles.readonlyHint}>Засах товч дарж мэдээллээ өөрчлөөрэй.</div>
          )}
        </TableCard>
      </div>
    </div>
  );
}
