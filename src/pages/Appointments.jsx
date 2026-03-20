import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { PageHeader, SearchBar, SearchInput, Btn, TableCard, EmptyRow, LoadingRow, Field, Input, Select, FormGrid, ModalFooter } from '../components/UI';
import { useToast } from '../ToastContext';
import { useAuth } from '../AuthContext';
import styles from './Table.module.css';

const fmtDate = d => d ? new Date(d).toLocaleString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const statusLabel = s => ({ pending: 'Хүлээгдэж байна', confirmed: 'Баталгаажсан', completed: 'Дууссан', cancelled: 'Цуцлагдсан' })[s] || s;

export default function Appointments({ myOnly = false, onNewBooking, onSelectAppointment }) {
  const { user } = useAuth();
  const toast = useToast();
  const [doctors, setDoctors] = useState([]);
  const [all, setAll] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [form, setForm] = useState({ doctor_id: '', appointment_date: '', notes: '' });
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('08:30');
  const [takenTimes, setTakenTimes] = useState([]);
  const [department, setDepartment] = useState('');
  const isDoctorSchedule = user?.role === 'doctor' && !myOnly;

  const timeSlots = useMemo(() => {
    const slots = [];
    let mins = 8 * 60 + 30;
    const end = 17 * 60;
    while (mins <= end) {
      const h = String(Math.floor(mins / 60)).padStart(2, '0');
      const m = String(mins % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
      mins += 30;
    }
    return slots;
  }, []);

  const workDays = useMemo(() => {
    const days = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (days.length < 5) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        days.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, []);

  const scheduleMap = useMemo(() => {
    const map = {};
    for (const a of filtered) {
      const dt = new Date(a.appointment_date);
      if (Number.isNaN(dt.getTime())) continue;
      const dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const timeKey = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      map[dateKey] = map[dateKey] || {};
      map[dateKey][timeKey] = a;
    }
    return map;
  }, [filtered]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(myOnly ? '/appointments/me' : '/appointments');
      setAll(data.appointments); setFiltered(data.appointments);
    } catch { toast('Мэдээлэл ачаалахад алдаа гарлаа.', 'error'); }
    finally { setLoading(false); }
  }, [myOnly, toast]);

  const loadDoctors = useCallback(async () => {
    try {
      const { data } = await api.get('/doctors');
      setDoctors(data.doctors || []);
    } catch {
      setDoctors([]);
    }
  }, []);

  const departments = Array.from(
    new Set((doctors || []).map(d => d.specialization).filter(Boolean))
  ).sort();

  useEffect(() => { load(); if (myOnly) loadDoctors(); }, [load, loadDoctors, myOnly]);

  useEffect(() => {
    const loadTaken = async () => {
      if (!myOnly || !form.doctor_id || !visitDate) { setTakenTimes([]); return; }
      try {
        const { data } = await api.get(`/appointments/doctor/${form.doctor_id}`, { params: { date: visitDate } });
        setTakenTimes(data.times || []);
      } catch {
        setTakenTimes([]);
      }
    };
    loadTaken();
  }, [myOnly, form.doctor_id, visitDate]);

  useEffect(() => {
    let list = all;
    if (myOnly) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      list = list.filter(a => new Date(a.appointment_date).getTime() >= oneMonthAgo.getTime());
    }
    if (searchQ) list = list.filter(a => `${a.patient_first} ${a.patient_last} ${a.doctor_first} ${a.doctor_last}`.toLowerCase().includes(searchQ.toLowerCase()));

    setFiltered(list);
  }, [searchQ, all, myOnly]);

  const submitAdd = async () => {
    try {
      if (!visitDate || !visitTime) {
        return toast('Огноо, цаг сонгоно уу.', 'error');
      }
      if (!form.doctor_id) {
        return toast('Эмч сонгоно уу.', 'error');
      }
      const d = new Date(`${visitDate}T${visitTime}:00`);
      const day = d.getDay();
      if (day === 0 || day === 6) {
        return toast('Амралтын өдөр сонгож болохгүй.', 'error');
      }
      const appointment_date = `${visitDate}T${visitTime}:00`;
      await api.post('/appointments', { ...form, appointment_date, doctor_id: +form.doctor_id });
      toast('Цаг амжилттай захиалагдлаа!');
      setAddModal(false);
      setForm({ doctor_id: '', appointment_date: '', notes: '' });
      setVisitDate('');
      setVisitTime('08:30');
      setTakenTimes([]);
      setDepartment('');
      load();
    } catch (e) { toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error'); }
  };

  const handleScheduleClick = (appt) => {
    if (!appt) return;
    if (onSelectAppointment) {
      onSelectAppointment(appt);
    }
  };

  return (
    <div className="fade-up">
      <PageHeader title={myOnly ? 'Миний цаг захиалгууд' : 'Цаг захиалга'} />
      <SearchBar>
        {!myOnly && (
          <SearchInput placeholder=" Хайх нэрээ оруулна уу..." onChange={e => setSearchQ(e.target.value)} />
        )}
        {myOnly && <Btn onClick={() => onNewBooking ? onNewBooking() : setAddModal(true)}>＋ Цаг захиалах</Btn>}
      </SearchBar>

      {isDoctorSchedule ? (
        <TableCard>
          <div className={styles.scheduleWrap}>
            <table className={`${styles.table} ${styles.scheduleTable}`}>
              <thead>
                <tr>
                  <th className={styles.scheduleTimeCol}>Цаг</th>
                  {workDays.map(d => (
                    <th key={d.toISOString()}>
                      {d.toLocaleDateString('mn-MN', { weekday: 'short', month: '2-digit', day: '2-digit' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={workDays.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
                      <span className="spinner" />
                    </td>
                  </tr>
                ) : (
                  timeSlots.map(t => (
                    <tr key={t}>
                      <td className={styles.scheduleTime}>{t}</td>
                      {workDays.map(d => {
                        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        const appt = scheduleMap[dateKey]?.[t];
                        return (
                          <td key={`${dateKey}-${t}`} className={styles.scheduleCell}>
                            {appt ? (
                              <div
                                className={`${styles.scheduleItem} ${appt.status === 'completed' ? styles.scheduleItemCompleted : ''}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleScheduleClick(appt)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleScheduleClick(appt); }}
                                title="Дарж өвчтөний бичлэг/жор руу орох"
                              >
                                <div className={styles.scheduleName}>{appt.patient_first} {appt.patient_last}</div>
                                <div className={styles.scheduleMeta}>
                                  <span className={`badge ${appt.status}`}>{statusLabel(appt.status)}</span>
                                </div>
                                {appt.status === 'completed' && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleScheduleClick(appt); }}
                                    style={{ marginTop: '0.35rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.35rem', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
                                  >
                                    Medical record
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className={styles.scheduleEmpty}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      ) : (
        <TableCard>
          <table className={`${styles.table} ${styles.appointmentsTable}`}>
            <thead>
              <tr>
                {myOnly ? (
                  <>
                    <th>№</th><th>Өвчтөн</th><th>Эмч</th><th>Огноо</th><th>Статус</th>
                  </>
                ) : (
                  <>
                    <th>№</th><th>Өвчтөн</th><th>Утас</th><th>Эмч</th><th>Өрөө</th><th>Огноо</th><th>Статус</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow cols={myOnly ? 5 : 7} /> : filtered.length === 0 ? <EmptyRow cols={myOnly ? 5 : 7} msg="Цаг захиалга байхгүй" /> :
                filtered.map((a, i) => (
                  <tr key={a.id}>
                    {myOnly ? (
                      <>
                        <td>{i + 1}</td>
                        <td><strong>{a.patient_first} {a.patient_last}</strong></td>
                        <td>
                          {a.doctor_first} {a.doctor_last}
                          {a.specialization && <><br /><small style={{ color: 'var(--muted)' }}>{a.specialization}</small></>}
                        </td>
                        <td>{fmtDate(a.appointment_date)}</td>
                        <td>
                          <span className={`badge ${a.status}`}>{statusLabel(a.status)}</span>
                          {a.status === 'completed' && user?.role === 'patient' && onSelectAppointment && (
                            <button
                              type="button"
                              onClick={() => onSelectAppointment(a)}
                              style={{ marginLeft: '0.5rem', padding: '0.25rem .5rem', fontSize: '0.7rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer' }}
                            >
                              Medical record
                            </button>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{i + 1}</td>
                        <td><strong>{a.patient_first} {a.patient_last}</strong></td>
                        <td>{a.patient_phone || '—'}</td>
                        <td>
                          {a.doctor_first} {a.doctor_last}
                          {a.specialization && <><br /><small style={{ color: 'var(--muted)' }}>{a.specialization}</small></>}
                        </td>
                        <td>{a.room_number || '—'}</td>
                        <td>{fmtDate(a.appointment_date)}</td>
                        <td><span className={`badge ${a.status}`}>{statusLabel(a.status)}</span></td>
                      </>
                    )}
                  </tr>
                ))
              }
            </tbody>
          </table>
        </TableCard>
      )}

      {/* Add appointment modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Цаг захиалах">
        <FormGrid>
          <Field label="Тасаг">
            <Select value={department} onChange={e => { setDepartment(e.target.value); setForm(f => ({ ...f, doctor_id: '' })); }}>
              <option value="">Тасаг сонгох</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </Select>
          </Field>
          <Field label="Эмч">
            <Select className="doctorSelect" value={form.doctor_id} onChange={set('doctor_id')}>
              <option value="">Эмч сонгох</option>
              {doctors.filter(d => !department || d.specialization === department).map(d => (
                <option key={d.id} value={d.id}>{d.first_name} {d.last_name} {d.specialization ? `(${d.specialization})` : ''}</option>
              ))}
            </Select>
          </Field>
          <Field label="Огноо">
            <Input
              type="date"
              value={visitDate}
              min={new Date().toISOString().slice(0,10)}
              onChange={e => {
                const v = e.target.value;
                if (!v) return setVisitDate('');
                const day = new Date(v + 'T00:00:00').getDay();
                if (day === 0 || day === 6) {
                  toast('Амралтын өдөр сонгож болохгүй.', 'error');
                  return;
                }
                setVisitDate(v);
              }}
            />
          </Field>
          <Field label="Цаг (30 минут)">
            <Select value={visitTime} onChange={e => setVisitTime(e.target.value)} disabled={!form.doctor_id || !visitDate}>
              {[
                '08:30','09:00','09:30','10:00','10:30','11:00','11:30',
                '12:00','12:30','13:00','13:30','14:00','14:30','15:00',
                '15:30','16:00','16:30','17:00'
              ].map(t => (
                <option key={t} value={t} disabled={takenTimes.includes(t)}>
                  {t}{takenTimes.includes(t) ? ' (дүүрсэн)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Тэмдэглэл"><Input value={form.notes} onChange={set('notes')} /></Field>
        </FormGrid>
        <ModalFooter>
          <Btn variant="outline" onClick={() => setAddModal(false)}>Болих</Btn>
          <Btn onClick={submitAdd}>Захиалах</Btn>
        </ModalFooter>
      </Modal>
    </div>
  );
}
