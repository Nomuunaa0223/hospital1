import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { PageHeader, TableCard } from '../components/UI';
import toothImg from '../assets/tooth.jpg';
import arisImg from '../assets/hashil1.jpg';
import gemtelImg from '../assets/gemtel1.jpg';
import nudImg from '../assets/chih.jpg';
import zurhImg from '../assets/zurh1.jpg';
import medrelImg from '../assets/medrel.jpg';
import sergeehImg from '../assets/sergeeh.jpg';
import setgelzuichImg from '../assets/setgelzuich.jpg';
import setgetsImg from '../assets/tarhi.jpg';
import huuhedImg from '../assets/huuhed.jpg';
import ulamjlaltImg from '../assets/ulamjlalt.jpg';
import havdarImg from '../assets/havdar.jpg';
import styles from './BookingFlow.module.css';

const defaultIcon = {
  c: '#3b9eff',
  d: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z'
};

export default function BookingDepartments({ selected, onSelect }) {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.departments || []);
    } catch {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-up">
      <PageHeader title="Цаг Захиалах" subtitle="Эхлээд тасгаа сонгоно уу" />
      <TableCard>
        {loading ? (
          <div className={styles.loading}>Ачаалж байна...</div>
        ) : departments.length === 0 ? (
          <div className={styles.loading}>Тасаг олдсонгүй.</div>
        ) : (
          <div className={styles.grid}>
            {departments.map(dep => (
              <button
                key={dep}
                onClick={() => onSelect(dep)}
                className={`${styles.card} ${selected === dep ? styles.active : ''}`}
              >
                <div className={styles.iconWrap} style={{ background: defaultIcon.c + '18' }}>
                  {dep === 'Шүд' ? (
                    <img src={toothImg} alt="Шүд" className={styles.iconImg} />
                  ) : dep === 'Арьс харшил' ? (
                    <img src={arisImg} alt="Арьс харшил" className={styles.iconImg} />
                  ) : dep === 'Гэмтэл' ? (
                    <img src={gemtelImg} alt="Гэмтэл" className={styles.iconImg} />
                  ) : dep === 'Нүд ам чих хамар хоолой' ? (
                    <img src={nudImg} alt="Нүд ам чих хамар хоолой" className={styles.iconImg} />
                  ) : dep === 'Зүрх судас' ? (
                    <img src={zurhImg} alt="Зүрх судас" className={styles.iconImg} />
                  ) : dep === 'Мэдрэл' ? (
                    <img src={medrelImg} alt="Мэдрэл" className={styles.iconImg} />
                  ) : dep === 'Сэргээн засах' ? (
                    <img src={sergeehImg} alt="Сэргээн засах" className={styles.iconImg} />
                  ) : dep === 'Сэтгэл зүйч' ? (
                    <img src={setgelzuichImg} alt="Сэтгэл зүйч" className={styles.iconImg} />
                  ) : dep === 'Сэтгэц' ? (
                    <img src={setgetsImg} alt="Сэтгэц" className={styles.iconImg} />
                  ) : dep === 'Хүүхэд' ? (
                    <img src={huuhedImg} alt="Хүүхэд" className={styles.iconImg} />
                  ) : dep === 'Уламжлалт' ? (
                    <img src={ulamjlaltImg} alt="Уламжлалт" className={styles.iconImg} />
                  ) : dep === 'Хавдар' ? (
                    <img src={havdarImg} alt="Хавдар" className={styles.iconImg} />
                  ) : (
                    <svg viewBox="0 0 24 24" className={styles.icon} style={{ color: defaultIcon.c }}>
                      <path fill="currentColor" d={defaultIcon.d} />
                    </svg>
                  )}
                </div>
                <div>
                  <div className={styles.cardTitle}>{dep}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </TableCard>
    </div>
  );
}
