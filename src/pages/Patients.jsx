import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { PageHeader, SearchBar, SearchInput, TableCard, EmptyRow, LoadingRow } from '../components/UI';
import { useToast } from '../ToastContext';
import styles from './Table.module.css';

export default function Patients() {
  const toast = useToast();
  const [all, setAll] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients');
      setAll(data.patients); setFiltered(data.patients);
    } catch { toast('Мэдээлэл ачаалахад алдаа гарлаа.', 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

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
    setFiltered(all.filter(p => {
      if (!q) return true;
      const first = normalize(p.first_name);
      const last = normalize(p.last_name);
      return first.startsWith(q) || last.startsWith(q);
    }));
  };

  return (
    <div className="fade-up">
      <PageHeader title="Өвчтөнүүд" subtitle="Бүртгэлтэй өвчтөнүүдийн жагсаалт" />
      <SearchBar>
        <SearchInput placeholder="🔍  Хайх..." onChange={filter} />
      </SearchBar>

      <TableCard>
        <table className={`${styles.table} ${styles.patientsTable}`}>
          <thead>
            <tr>
              <th>№</th><th>Нэр</th><th>Имэйл</th><th>Утас</th><th>Цусны бүлэг</th><th>Хүйс</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <LoadingRow cols={6} /> : filtered.length === 0 ? <EmptyRow cols={6} /> :
              filtered.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td><strong>{p.first_name} {p.last_name}</strong></td>
                  <td>{p.email}</td>
                  <td>{p.phone || '—'}</td>
                  <td><span className="badge confirmed">{p.blood_type || '—'}</span></td>
                  <td>{p.gender === 'male' ? 'Эрэгтэй' : p.gender === 'female' ? 'Эмэгтэй' : '—'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </TableCard></div>
  );
}
