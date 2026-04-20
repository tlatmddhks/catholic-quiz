'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question {
  id: number; area: number; lv: number; pt: number; type: number;
  question: string; right_word: string; wrong_words: string[]; explain_word: string | null;
  ox?: string; shuffle?: string;
}

const MODE_LABELS: Record<string, string> = {
  ox: 'OX 퀴즈', chosung: '셔플 퀴즈', normal: '일반 퀴즈', survival: '서바이벌', random: '랜덤 퀴즈', test: '🧪 테스트',
};
const LV_LABELS: Record<number, string> = { 1:'입문',2:'초급',3:'중급',4:'고급',5:'전문',6:'마스터',7:'레전드' };
const QUESTIONS_PER_GAME = 10;
const SURVIVAL_LIVES = 3;

type GameState = 'loading' | 'playing' | 'result';
type AnswerState = 'idle' | 'correct' | 'wrong';

export default function QuizGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'random';
  const lv = searchParams.get('lv') || '';

  const [gameState, setGameState] = useState<GameState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(SURVIVAL_LIVES);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<{char: string; id: number}[]>([]);
  const [usedTileIds, setUsedTileIds] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(20);
  const [totalTime, setTotalTime] = useState(0);
  const [history, setHistory] = useState<{q: Question; chosen: string; correct: boolean}[]>([]);
  const [floatScore, setFloatScore] = useState<{val: number; key: number} | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQ = questions[currentIdx];
  const isSurvival = mode === 'survival';
  const isShuffle = mode === 'chosung' || currentQ?.shuffle === 'Y';
  const isOX = !isShuffle && (mode === 'ox' || currentQ?.ox === 'Y' || (currentQ?.right_word === 'O' || currentQ?.right_word === 'X'));

  // 문제 로드
  useEffect(() => {
    const url = `/api/quiz?mode=${mode}${lv ? `&lv=${lv}` : ''}&count=${QUESTIONS_PER_GAME}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.questions?.length > 0) {
          setQuestions(data.questions);
          setGameState('playing');
        } else {
          alert('문제를 불러오지 못했습니다.');
          router.push('/');
        }
      })
      .catch(() => { alert('문제 로드 실패'); router.push('/'); });
  }, [mode, lv, router]);

  // 전체 시간 타이머
  useEffect(() => {
    if (gameState !== 'playing') return;
    totalTimerRef.current = setInterval(() => setTotalTime(t => t + 1), 1000);
    return () => { if (totalTimerRef.current) clearInterval(totalTimerRef.current); };
  }, [gameState]);

  // 문제별 타이머 (20초)
  useEffect(() => {
    if (gameState !== 'playing' || answerState !== 'idle') return;
    setTimeLeft(20);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer('__timeout__');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx, gameState, answerState]);


  const handleAnswer = useCallback((chosen: string) => {
    if (answerState !== 'idle' || !currentQ) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isTimeout = chosen === '__timeout__';
    const isCorrect = !isTimeout && chosen.trim().toLowerCase() === currentQ.right_word.trim().toLowerCase();

    setSelectedAnswer(isTimeout ? null : chosen);
    setAnswerState(isCorrect ? 'correct' : 'wrong');
    setHistory(h => [...h, { q: currentQ, chosen: isTimeout ? '(시간초과)' : chosen, correct: isCorrect }]);

    if (isCorrect) {
      const gained = currentQ.pt;
      setScore(s => s + gained);
      setCorrectCount(c => c + 1);
      setFloatScore({ val: gained, key: Date.now() });
    } else if (isSurvival) {
      setLives(l => l - 1);
    }

    // 1.8초 후 다음 문제 or 종료
    setTimeout(() => {
      const nextIdx = currentIdx + 1;
      const isGameOver = isSurvival && (isCorrect ? false : lives - 1 <= 0);

      if (nextIdx >= questions.length || isGameOver) {
        setGameState('result');
        if (totalTimerRef.current) clearInterval(totalTimerRef.current);
        saveResult(score + (isCorrect ? currentQ.pt : 0), correctCount + (isCorrect ? 1 : 0), totalTime);
      } else {
        setCurrentIdx(nextIdx);
        setAnswerState('idle');
        setSelectedAnswer(null);
        setSelectedTiles([]);
        setUsedTileIds(new Set());
      }
    }, 1800);
  }, [answerState, currentQ, currentIdx, questions, lives, isSurvival, score, correctCount, totalTime]);

  function restartGame() {
    setGameState('loading');
    setQuestions([]);
    setCurrentIdx(0);
    setScore(0);
    setCorrectCount(0);
    setLives(SURVIVAL_LIVES);
    setAnswerState('idle');
    setSelectedAnswer(null);
    setSelectedTiles([]);
    setUsedTileIds(new Set());
    setTimeLeft(20);
    setTotalTime(0);
    setHistory([]);
    setFloatScore(null);
    const url = `/api/quiz?mode=${mode}${lv ? `&lv=${lv}` : ''}&count=${QUESTIONS_PER_GAME}`;
    fetch(url).then(r => r.json()).then(data => {
      if (data.questions?.length > 0) {
        setQuestions(data.questions);
        setGameState('playing');
      } else {
        alert('문제를 불러오지 못했습니다.');
        router.push('/');
      }
    }).catch(() => { alert('문제 로드 실패'); router.push('/'); });
  }

  async function saveResult(finalScore: number, finalCorrect: number, finalTime: number) {
    await fetch('/api/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode, lv: lv ? parseInt(lv) : null,
        score: finalScore, total_questions: questions.length,
        correct_count: finalCorrect, time_sec: finalTime,
      }),
    }).catch(() => {});
  }

  // 4지선다 보기
  const choices = useMemo(() => {
    const q = questions[currentIdx];
    if (!q || q.right_word === 'O' || q.right_word === 'X') return ['O', 'X'];
    const wrong = q.wrong_words.slice(0, 3);
    return [q.right_word, ...wrong].sort(() => Math.random() - 0.5);
  }, [currentIdx, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  // 셔플 퀴즈 글자 타일 (right_word 각 글자 + wrong_words 각 글자)
  const shuffleTiles = useMemo(() => {
    const q = questions[currentIdx];
    if (!q) return [];
    const rightChars = q.right_word.split('');
    const wrongChars = q.wrong_words.flatMap(w => w.split(''));
    return [...rightChars, ...wrongChars]
      .map((char, i) => ({ char, id: i }))
      .sort(() => Math.random() - 0.5);
  }, [currentIdx, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  if (gameState === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>문제 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    return <ResultScreen history={history} score={score} mode={mode} lv={lv} totalTime={totalTime} questions={questions} onRetry={restartGame} />;
  }

  if (!currentQ) return null;

  const progress = ((currentIdx) / questions.length) * 100;
  const isOXQuestion = currentQ.right_word === 'O' || currentQ.right_word === 'X';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`lv-badge lv-${currentQ.lv}`}>Lv.{currentQ.lv}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {MODE_LABELS[mode] || mode}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* 서바이벌 하트 */}
          {isSurvival && (
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: SURVIVAL_LIVES }).map((_, i) => (
                <span key={i} className={`heart ${i >= lives ? 'lost' : ''}`}>❤️</span>
              ))}
            </div>
          )}
          {/* 점수 */}
          <div className="score-badge" style={{ position: 'relative' }}>
            {score.toLocaleString()}점
            {floatScore && (
              <span
                key={floatScore.key}
                className="anim-float"
                style={{
                  position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                  color: '#22c55e', fontWeight: 900, fontSize: '1.1rem', whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                +{floatScore.val}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 진행바 */}
      <div className="progress-bar" style={{ marginBottom: '0.5rem' }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>{currentIdx + 1} / {questions.length}</span>
        <span style={{ color: timeLeft <= 5 ? '#e94560' : 'var(--text-muted)', fontWeight: timeLeft <= 5 ? 700 : 400 }}>
          ⏱ {timeLeft}초
        </span>
      </div>

      {/* 문제 카드 */}
      <div key={currentIdx} className="game-card anim-fade-up" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
          {currentQ.question}
        </p>
      </div>

      {/* OX 버튼 */}
      {isOXQuestion ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {['O', 'X'].map((btn) => {
            let cls = `ox-btn ${btn === 'O' ? 'o-btn' : 'x-btn'}`;
            if (answerState !== 'idle') {
              if (btn === currentQ.right_word) cls += ' correct';
              else if (btn === selectedAnswer) cls += ' wrong';
            }
            return (
              <button key={btn} className={cls} disabled={answerState !== 'idle'} onClick={() => handleAnswer(btn)}>
                {btn}
              </button>
            );
          })}
        </div>
      ) : isShuffle ? (
        /* 셔플 퀴즈 - 빈칸 채우기 */
        <div style={{ marginBottom: '1.5rem' }}>
          {/* 정답 빈칸 박스 */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 16,
            padding: '1.25rem 1rem', marginBottom: '1.25rem',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              정답 입력 ({currentQ.right_word.length}글자)
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {Array.from({ length: currentQ.right_word.length }).map((_, i) => {
                const filled = selectedTiles[i];
                const isAnswered = answerState !== 'idle';
                const correctChar = currentQ.right_word[i];
                let boxBg = filled ? 'var(--accent)' : 'rgba(255,255,255,0.06)';
                let boxBorder = filled ? 'var(--accent)' : 'rgba(255,255,255,0.25)';
                let boxColor = filled ? '#000' : 'rgba(255,255,255,0.15)';
                let boxShadow = filled ? '0 0 12px rgba(0,212,255,0.4)' : 'none';
                if (isAnswered) {
                  const ok = filled?.char === correctChar;
                  boxBg = ok ? 'rgba(34,197,94,0.25)' : 'rgba(233,69,96,0.25)';
                  boxBorder = ok ? '#22c55e' : '#e94560';
                  boxColor = 'var(--text)';
                  boxShadow = ok ? '0 0 12px rgba(34,197,94,0.4)' : '0 0 12px rgba(233,69,96,0.4)';
                }
                return (
                  <div key={i} style={{
                    width: 58, height: 58, borderRadius: 12,
                    border: `2px solid ${boxBorder}`,
                    background: boxBg,
                    boxShadow,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '1.5rem', color: boxColor,
                    transition: 'all 0.2s',
                  }}>
                    {filled?.char || ''}
                  </div>
                );
              })}
            </div>
          </div>
          {/* 글자 타일 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem', justifyContent: 'center' }}>
            {shuffleTiles.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  if (usedTileIds.has(t.id) || answerState !== 'idle' || selectedTiles.length >= currentQ.right_word.length) return;
                  setSelectedTiles(prev => [...prev, t]);
                  setUsedTileIds(prev => { const s = new Set(prev); s.add(t.id); return s; });
                }}
                disabled={usedTileIds.has(t.id) || answerState !== 'idle'}
                style={{
                  width: 50, height: 50, borderRadius: 10, fontWeight: 800, fontSize: '1.2rem',
                  border: `2px solid ${usedTileIds.has(t.id) ? 'transparent' : 'var(--border)'}`,
                  background: usedTileIds.has(t.id) ? 'rgba(255,255,255,0.02)' : 'var(--card2)',
                  color: usedTileIds.has(t.id) ? 'transparent' : 'var(--text)',
                  cursor: usedTileIds.has(t.id) ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t.char}
              </button>
            ))}
          </div>
          {/* 지우기 / 제출 */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                if (selectedTiles.length === 0) return;
                const last = selectedTiles[selectedTiles.length - 1];
                setSelectedTiles(prev => prev.slice(0, -1));
                setUsedTileIds(prev => { const s = new Set(prev); s.delete(last.id); return s; });
              }}
              disabled={answerState !== 'idle' || selectedTiles.length === 0}
            >
              ← 지우기
            </button>
            <button
              className="btn-primary"
              style={{ flex: 2, padding: '0.875rem' }}
              onClick={() => handleAnswer(selectedTiles.map(t => t.char).join(''))}
              disabled={answerState !== 'idle' || selectedTiles.length !== currentQ.right_word.length}
            >
              제출
            </button>
          </div>
        </div>
      ) : (
        /* 4지선다 */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {choices.map((choice, i) => {
            let bg = 'rgba(255,255,255,0.04)';
            let border = 'var(--border)';
            let color = 'var(--text)';
            if (answerState !== 'idle') {
              if (choice === currentQ.right_word) { bg = 'rgba(34,197,94,0.2)'; border = '#22c55e'; color = '#22c55e'; }
              else if (choice === selectedAnswer) { bg = 'rgba(233,69,96,0.2)'; border = '#e94560'; color = '#e94560'; }
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(choice)}
                disabled={answerState !== 'idle'}
                style={{
                  background: bg, border: `2px solid ${border}`, borderRadius: 14,
                  color, fontWeight: 600, fontSize: '0.95rem', padding: '1rem',
                  cursor: answerState === 'idle' ? 'pointer' : 'default',
                  transition: 'all 0.2s', textAlign: 'left', lineHeight: 1.5,
                }}
              >
                <span style={{ color: 'var(--text-muted)', marginRight: 8, fontSize: '0.8rem' }}>
                  {['①','②','③','④'][i]}
                </span>
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {/* 정답/오답 피드백 */}
      {answerState !== 'idle' && (
        <div
          className="anim-bounce game-card"
          style={{
            padding: '1.25rem',
            borderColor: answerState === 'correct' ? '#22c55e' : '#e94560',
            background: answerState === 'correct' ? 'rgba(34,197,94,0.08)' : 'rgba(233,69,96,0.08)',
          }}
        >
          <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem', color: answerState === 'correct' ? '#22c55e' : '#e94560' }}>
            {answerState === 'correct' ? `✅ 정답! +${currentQ.pt}점` : `❌ 오답! 정답: ${currentQ.right_word}`}
          </p>
          {currentQ.explain_word && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{currentQ.explain_word}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ResultScreen({ history, score, mode, lv, totalTime, questions, onRetry }: {
  history: {q: Question; chosen: string; correct: boolean}[];
  score: number; mode: string; lv: string; totalTime: number; questions: Question[];
  onRetry: () => void;
}) {
  const correct = history.filter(h => h.correct).length;
  const accuracy = Math.round((correct / (history.length || 1)) * 100);
  const grade = accuracy >= 90 ? '🏆 완벽!' : accuracy >= 70 ? '🎖️ 훌륭해요!' : accuracy >= 50 ? '👍 좋아요!' : '💪 더 노력해요!';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="anim-bounce" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>{grade.split(' ')[0]}</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{grade.split(' ').slice(1).join(' ')}</h2>
        <div className="score-badge" style={{ fontSize: '2rem', padding: '0.6rem 2rem', display: 'inline-block', margin: '0.75rem 0' }}>
          {score.toLocaleString()}점
        </div>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22c55e' }}>{accuracy}%</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>정답률</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)' }}>{correct}/{history.length}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>맞힌 문제</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--secondary)' }}>
              {Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, '0')}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>소요 시간</p>
          </div>
        </div>
      </div>

      {/* 문제 리뷰 */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontWeight: 800, marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          📋 문제 리뷰
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {history.map((h, i) => (
            <div key={i} className="game-card" style={{
              padding: '1rem 1.25rem',
              borderColor: h.correct ? 'rgba(34,197,94,0.3)' : 'rgba(233,69,96,0.3)',
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{h.correct ? '✅' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.3rem', lineHeight: 1.6 }}>{h.q.question}</p>
                  {!h.correct && (
                    <p style={{ fontSize: '0.8rem', color: '#e94560' }}>내 답: {h.chosen} → 정답: <strong>{h.q.right_word}</strong></p>
                  )}
                  {h.q.explain_word && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{h.q.explain_word}</p>
                  )}
                </div>
                <span className={`lv-badge lv-${h.q.lv}`} style={{ flexShrink: 0 }}>Lv.{h.q.lv}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={onRetry}>🔄 다시 도전</button>
        <Link href="/ranking" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary">🏆 랭킹 보기</button>
        </Link>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary">🏠 홈으로</button>
        </Link>
      </div>
    </div>
  );
}
