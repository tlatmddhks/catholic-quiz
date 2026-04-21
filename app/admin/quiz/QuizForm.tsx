'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type QuizMode = 'ox' | 'chosung' | 'normal' | 'image';

interface QuizData {
  id?: number; area?: string; lv?: number; pt?: number; type?: number;
  question?: string; right_word?: string; wrong_word?: string; explain_word?: string;
  ox?: string; shuffle?: string; survival_yn?: string; normal?: string;
  is_visible?: string; is_test?: string; image_url?: string; _imageMode?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem',
};

export default function QuizForm({ initial }: { initial?: QuizData }) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const detectMode = (): QuizMode => {
    if (initial?._imageMode || initial?.image_url) return 'image';
    if (initial?.shuffle === 'Y') return 'chosung';
    if (initial?.ox === 'Y') return 'ox';
    return 'normal';
  };

  const [mode, setMode] = useState<QuizMode>(initial ? detectMode() : 'ox');
  const [form, setForm] = useState({
    area: initial?.area ? String(initial.area) : '1',
    lv: initial?.lv || 1,
    pt: initial?.pt || 50,
    question: initial?.question || '',
    right_word: initial?.right_word || '',
    wrong1: initial?.wrong_word?.split('/')[0] || '',
    wrong2: initial?.wrong_word?.split('/')[1] || '',
    wrong3: initial?.wrong_word?.split('/')[2] || '',
    explain_word: initial?.explain_word || '',
    survival_yn: initial?.survival_yn === 'Y',
    is_visible: initial?.is_visible !== undefined ? initial.is_visible === 'Y' : true,
    is_test: initial?.is_test === 'Y',
    image_url: initial?.image_url || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [areas, setAreas] = useState<number[]>([]);

  useEffect(() => {
    fetch('/api/admin/quiz/areas')
      .then(r => r.json())
      .then(d => setAreas(d.areas || []))
      .catch(() => {});
  }, []);

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok) set('image_url', data.url);
    else setError(data.error || '업로드 실패');
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.question.trim() || !form.right_word.trim()) {
      setError('문제와 정답은 필수입니다.'); return;
    }
    setLoading(true); setError('');

    const wrong_word = mode === 'normal' || mode === 'image'
      ? [form.wrong1, form.wrong2, form.wrong3].filter(Boolean).join('/')
      : mode === 'chosung' ? form.wrong1.replace(/\//g, '').split('').filter(Boolean).join('/') : '';

    const payload = {
      area: form.area, lv: form.lv, pt: form.pt,
      question: form.question, right_word: form.right_word,
      wrong_word: wrong_word || null,
      explain_word: form.explain_word || null,
      type: mode === 'chosung' ? 3 : 1,
      ox: mode === 'ox' ? 'Y' : 'N',
      shuffle: mode === 'chosung' ? 'Y' : 'N',
      survival_yn: form.survival_yn ? 'Y' : 'N',
      normal: mode === 'normal' ? 'Y' : 'N',
      is_visible: form.is_visible ? 'Y' : 'N',
      is_test: form.is_test ? 'Y' : 'N',
      image_url: mode === 'image' ? (form.image_url || null) : null,
    };

    const url = isEdit ? `/api/admin/quiz/${initial!.id}` : '/api/admin/quiz';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      router.push('/admin/quiz');
      router.refresh();
    } catch (e: any) {
      setError(e.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
      {/* 퀴즈 유형 탭 */}
      {!isEdit && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {([['ox','OX 퀴즈'],['chosung','셔플 퀴즈'],['normal','일반 퀴즈'],['image','이미지 퀴즈']] as [QuizMode,string][]).map(([v,l]) => (
            <button key={v} type="button" onClick={() => setMode(v)}
              className={mode === v ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 1.2rem', fontSize: '0.875rem' }}>
              {l}
            </button>
          ))}
        </div>
      )}

      {error && <div style={{ color: '#e94560', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ width: 100 }}>
          <label style={labelStyle}>영역코드</label>
          <select style={inputStyle} value={form.area} onChange={e => set('area', e.target.value)}>
            <option value="0">-</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ width: 100 }}>
          <label style={labelStyle}>난이도</label>
          <select style={inputStyle} value={form.lv} onChange={e => set('lv', parseInt(e.target.value))}>
            {[1,2,3,4,5,6,7].map(v => <option key={v} value={v}>Lv.{v}</option>)}
          </select>
        </div>
        <div style={{ width: 100 }}>
          <label style={labelStyle}>점수</label>
          <select style={inputStyle} value={form.pt} onChange={e => set('pt', parseInt(e.target.value))}>
            {[50,100,150,200,250,300,350].map(v => <option key={v} value={v}>{v}점</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>문제</label>
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={form.question} onChange={e => set('question', e.target.value)}
          placeholder={mode === 'chosung' ? '셔플 힌트' : '문제를 입력하세요'} />
      </div>

      {mode === 'ox' ? (
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>정답</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[['O','O (맞다)'],['X','X (틀리다)']].map(([v,l]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text)' }}>
                <input type="radio" name="right_word" value={v} checked={form.right_word === v} onChange={() => set('right_word', v)} />
                {l}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>정답</label>
          <input style={inputStyle} value={form.right_word} onChange={e => set('right_word', e.target.value)} placeholder="정답" />
        </div>
      )}

      {(mode === 'normal' || mode === 'image') && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>오답 (최대 3개)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {(['wrong1','wrong2','wrong3'] as const).map((k,i) => (
              <input key={k} style={inputStyle} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={`오답 ${i+1}`} />
            ))}
          </div>
        </div>
      )}

      {mode === 'image' && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>이미지 업로드</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading}
            style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontSize: '0.875rem' }} />
          {uploading && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>업로드 중...</span>}
          {form.image_url && (
            <div style={{ marginTop: '0.5rem' }}>
              <img src={form.image_url} alt="preview" style={{ maxWidth: 240, maxHeight: 160, borderRadius: 8, border: '1px solid var(--border)' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{form.image_url}</div>
            </div>
          )}
        </div>
      )}

      {mode === 'chosung' && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>오답 (선택, / 구분)</label>
          <input style={inputStyle} value={form.wrong1} onChange={e => set('wrong1', e.target.value)} placeholder="오답1/오답2/오답3" />
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>해설 (선택)</label>
        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          value={form.explain_word} onChange={e => set('explain_word', e.target.value)} placeholder="정답 해설" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.survival_yn} onChange={e => set('survival_yn', e.target.checked)} />
          서바이벌 모드에 포함
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.is_visible} onChange={e => set('is_visible', e.target.checked)} />
          노출 여부 <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(체크 해제 시 플레이어에게 노출 안 됨)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.is_test} onChange={e => set('is_test', e.target.checked)} />
          테스트 문제 <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(관리자 테스트 모드에서만 출제)</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.7rem 1.5rem' }}>
          {loading ? '저장 중...' : isEdit ? '수정 저장' : '등록'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ padding: '0.7rem 1.2rem' }}>
          취소
        </button>
      </div>
    </form>
  );
}
