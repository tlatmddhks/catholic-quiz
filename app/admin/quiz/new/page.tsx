import QuizForm from '../QuizForm';

interface Props { searchParams: Promise<{ mode?: string }> }

const TITLE: Record<string, string> = {
  ox: 'OX 퀴즈 등록', chosung: '셔플 퀴즈 등록', normal: '일반 퀴즈 등록', image: '이미지 퀴즈 등록',
};

export default async function NewQuizPage({ searchParams }: Props) {
  const { mode = 'ox' } = await searchParams;
  const modeMap: Record<string, object> = {
    ox:      { ox: 'Y', shuffle: 'N', normal: 'N', type: 1 },
    chosung: { ox: 'N', shuffle: 'Y', normal: 'Y', type: 3 },
    normal:  { ox: 'N', shuffle: 'N', normal: 'Y', type: 1 },
    image:   { ox: 'N', shuffle: 'N', normal: 'N', type: 1, _imageMode: true },
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>
        {TITLE[mode] || '문제 등록'}
      </h1>
      <QuizForm initial={modeMap[mode] as any} />
    </div>
  );
}
