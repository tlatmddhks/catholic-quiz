import SurvivalClient from './SurvivalClient';

export default function SurvivalPage() {
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>서바이벌 모드 관리</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        서바이벌 모드에 포함할 문제를 관리합니다. 체크된 문제만 서바이벌에서 출제됩니다.
      </p>
      <SurvivalClient />
    </div>
  );
}
