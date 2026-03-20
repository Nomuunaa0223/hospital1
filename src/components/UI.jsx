import styles from './UI.module.css';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className={styles.pageHeader}>
      <div style={{ flex: 1 }}>
        <h2 className={styles.pageTitle}>{title}</h2>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function SearchBar({ children }) {
  return <div className={styles.searchBar}>{children}</div>;
}

export function SearchInput(props) {
  return <input className={styles.searchInput} type="text" {...props} />;
}

export function Btn({ variant = 'primary', size = 'md', className = '', ...props }) {
  const v = variant === 'outline' ? styles.btnOutline : variant === 'danger' ? styles.btnDanger : styles.btn;
  const s = size === 'sm' ? styles.btnSm : '';
  return <button className={`${styles.btnBase} ${v} ${s} ${className}`} {...props} />;
}

export function TableCard({ children }) {
  return <div className={styles.tableCard}>{children}</div>;
}

export function TableHeader({ title, right }) {
  return (
    <div className={styles.tableHeader}>
      <h3>{title}</h3>
      {right}
    </div>
  );
}

export function EmptyRow({ cols, msg = 'No data' }) {
  return (
    <tr>
      <td colSpan={cols} className={styles.emptyRow}>{msg}</td>
    </tr>
  );
}

export function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className={styles.loadingRow}>
        <span className="spinner" />
      </td>
    </tr>
  );
}

export function Field({ label, children }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      {children}
    </div>
  );
}

export function Input(props) {
  return <input className={styles.input} {...props} />;
}

export function Select({ className = '', ...props }) {
  return <select className={`${styles.select} ${className}`} {...props} />;
}

export function FormGrid({ children, style }) {
  return <div className={styles.formGrid} style={style}>{children}</div>;
}

export function ModalFooter({ children }) {
  return <div className={styles.modalFooter}>{children}</div>;
}

