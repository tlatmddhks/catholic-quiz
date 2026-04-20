'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CsvUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setStatus('');
    const text = await file.text();
    const res = await fetch('/api/admin/quiz/bulk', { method: 'POST', body: text });
    const data = await res.json();
    if (data.errors?.length) {
      setStatus(`완료: ${data.inserted}개 등록 / 오류 ${data.errors.length}개\n${data.errors.slice(0,5).join('\n')}`);
    } else {
      setStatus(`${data.inserted}개 등록 완료!`);
    }
    setLoading(false);
    router.refresh();
    if (inputRef.current) inputRef.current.value = '';
  }

  function downloadTemplate() {
    const csv = 'type,area,lv,pt,question,right_word,wrong_word,explain_word,survival_yn\nox,신앙,1,10,예수님은 하느님의 아들이다,O,,,N\nshuffle,성경,2,20,단어 맞추기 문제,정답단어,,,N\nnormal,전례,3,30,다음 중 성사가 아닌 것은?,기도,세례/혼인/성체/고해,,N\n';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'quiz_template.csv';
    a.click();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <label className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
        {loading ? '업로드 중...' : 'CSV 일괄 등록'}
        <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleFile} disabled={loading} />
      </label>
      <button className="btn-secondary" onClick={downloadTemplate}
        style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        템플릿 다운로드
      </button>
      {status && (
        <span style={{ fontSize: '0.8rem', color: status.includes('오류') ? '#e94560' : '#22c55e', whiteSpace: 'pre-wrap' }}>
          {status}
        </span>
      )}
    </div>
  );
}
