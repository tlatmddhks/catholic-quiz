import RankingClient from './RankingClient';

export default function RankingPage() {
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>랭킹 관리</h1>
      <RankingClient />
    </div>
  );
}
