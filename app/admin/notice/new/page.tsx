import NoticeForm from '../NoticeForm';

export default function NewNoticePage() {
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>공지사항 등록</h1>
      <NoticeForm />
    </div>
  );
}
