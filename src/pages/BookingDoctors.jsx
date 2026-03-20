import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { PageHeader, TableCard, Btn } from '../components/UI';
import styles from './BookingFlow.module.css';

export default function BookingDoctors({ department, onBack, onSelectDoctor }) {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors');
      setDoctors((data.doctors || []).filter(d => d.specialization === department));
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-up">
      <PageHeader title="Эмч Сонгох" subtitle={department || 'Тасаг сонгоогүй байна'}>
        <Btn variant="outline" onClick={onBack}>Буцах</Btn>
      </PageHeader>

      <TableCard>
        {loading ? (
          <div className={styles.loading}>Ачаалж байна...</div>
        ) : doctors.length === 0 ? (
          <div className={styles.loading}>Энэ тасагт эмч олдсонгүй.</div>
        ) : (
          <div className={styles.grid}>
            {doctors.map(d => (
              <div key={d.id} className={styles.doctorCard}>
                {d.profile_image_url ? (
                  <img src={d.profile_image_url} alt={`${d.first_name} ${d.last_name}`} className={styles.doctorPhoto} />
                ) : (
                  <div className={styles.doctorAvatar}>{(d.first_name?.[0] || 'Э').toUpperCase()}</div>
                )}
                <div className={styles.doctorInfo}>
                  <div className={styles.cardTitle}>{d.first_name} {d.last_name}</div>
                  <div className={styles.cardSub}>{d.specialization}</div>
                  <div className={styles.cardSub}>{d.experience_years ? `${d.experience_years} жил туршлага` : 'Туршлага: —'}</div>
                  <div className={styles.cardSub}>{d.room_number ? `Өрөө: ${d.room_number}` : 'Өрөө: —'}</div>
                </div>
                <Btn className={styles.cardBtn} onClick={() => onSelectDoctor(d)}>Эмч сонгох</Btn>
              </div>
            ))}
          </div>
        )}
      </TableCard>
    </div>
  );
}
