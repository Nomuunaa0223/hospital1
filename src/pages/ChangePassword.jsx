import { useState } from 'react';
import api from '../api';
import { PageHeader, Field, Input, Btn, FormGrid, TableCard } from '../components/UI';
import { useToast } from '../ToastContext';
import { useAuth } from '../AuthContext';

export default function ChangePassword() {
  const toast = useToast();
  const { user, login, logout } = useAuth();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pw1 || pw1.length < 6) return toast('Нууц үг 6+ тэмдэгт байна.', 'error');
    if (pw1 !== pw2) return toast('Нууц үг таарахгүй байна.', 'error');
    setLoading(true);
    try {
      await api.put('/auth/change-password', { new_password: pw1 });
      const token = localStorage.getItem('hms_token');
      login({ ...user, must_change_password: false }, token);
      toast('Нууц үг шинэчлэгдлээ!');
    } catch (e) {
      toast(e.response?.data?.error || 'Алдаа гарлаа.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Нууц үг солих" subtitle="Анхны нэвтрэлт дээр нууц үгээ шинэчилнэ үү." />
      <TableCard>
        <FormGrid>
          <Field label="Шинэ нууц үг">
            <Input type="password" value={pw1} onChange={e => setPw1(e.target.value)} placeholder="Doc1234!" />
          </Field>
          <Field label="Дахин бичих">
            <Input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Doc1234!" />
          </Field>
        </FormGrid>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1.25rem' }}>
          <Btn variant="outline" onClick={logout}>Гарах</Btn>
          <Btn onClick={submit} disabled={loading}>{loading ? 'Түр хүлээнэ үү' : 'Шинэчлэх'}</Btn>
        </div>
      </TableCard>
    </div>
  );
}
