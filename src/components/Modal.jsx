import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  const modal = (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,.75)',
        backdropFilter:'blur(5px)', zIndex:1000,
        display:'flex', alignItems:'center', justifyContent:'center'
      }}
    >
      <div className="fade-up" style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:18, padding:'2rem', width:500, maxWidth:'95vw',
        maxHeight:'90vh', overflowY:'auto'
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:'1rem', cursor:'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
