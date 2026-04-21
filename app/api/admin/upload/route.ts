import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!allowed.includes(ext)) return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });

    const filename = `quiz_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const dir = path.join(process.cwd(), 'public', 'images', 'quiz');
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({ url: `/images/quiz/${filename}` });
  } catch (e: any) {
    console.error('[upload POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
