import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (filename.includes('..') || filename.includes('/')) {
    return new NextResponse('Bad Request', { status: 400 });
  }
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mime = MIME[ext];
  if (!mime) return new NextResponse('Not Found', { status: 404 });

  try {
    const filePath = path.join(process.cwd(), 'public', 'images', 'quiz', filename);
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000' },
    });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}
