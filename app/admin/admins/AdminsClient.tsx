'use client';
import { useState, useEffect, useCallback } from 'react';
import { ALL_MENUS, type MenuKey } from '@/lib/permissions';

interface Admin {
  username: string;
  name: string | null;
  nickname: string | null;
  added_by: string;
  created_at: string;
  permissions: string | null;
}

interface Member {
  user_id: number;
  username: string;
  name: string | null;
  nickname: string | null;
}

function parsePerms(raw: string | null): MenuKey[] | null {
  if (!raw) return null;
  return raw.split(',').map(p => p.trim()).filter(Boolean) as MenuKey[];
}

function PermEditor({ admin, onSaved }: { admin: Admin; onSaved: () => void }) {
  const currentPerms = parsePerms(admin.permissions);
  const [selected, setSelected] = useState<Set<MenuKey>>(
    currentPerms ? new Set(currentPerms) : new Set(ALL_MENUS.map(m => m.key))
  );
  const [allGrant, setAllGrant] = useState(currentPerms === null);
  const [saving, setSaving] = useState(false);

  function toggleMenu(key: MenuKey) {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  }

  async function handleSave() {
    setSaving(true);
    const permissions = allGrant ? null : Array.from(selected);
    await fetch(`/api/admin/admins/${encodeURIComponent(admin.username)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>메뉴 권한 설정</p>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f5a623', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }}>
        <input type="checkbox" checked={allGrant} onChange={e => setAllGrant(e.target.checked)} />
        전체 메뉴 허용
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem' }}>
          (해제하면 메뉴별로 선택 가능)
        </span>
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {ALL_MENUS.map(m => {
          const isOn = allGrant || selected.has(m.key);
          return (
            <label key={m.key} onClick={() => !allGrant && toggleMenu(m.key)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.75rem', borderRadius: 20,
              border: `1px solid ${isOn ? 'var(--accent)' : 'var(--border)'}`,
              background: isOn ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
              color: isOn ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              cursor: allGrant ? 'default' : 'pointer',
              fontWeight: isOn ? 700 : 400,
              opacity: allGrant ? 0.6 : 1,
              transition: 'all 0.15s',
            }}>
              {m.icon} {m.label}
            </label>
          );
        })}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary"
        style={{ padding: '0.35rem 1rem', fontSize: '0.82rem' }}>
        {saving ? '저장 중...' : '권한 저장'}
      </button>
    </div>
  );
}

export default function AdminsClient() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [openPerm, setOpenPerm] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    const res = await fetch('/api/admin/admins');
    const data = await res.json();
    setAdmins(data.admins || []);
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  async function handleSearch() {
    if (!search.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/admin/members?q=${encodeURIComponent(search)}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.members || []);
    }
    setSearching(false);
  }

  async function handleAdd(username: string) {
    setAdding(true); setMessage('');
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('관리자로 추가되었습니다.');
      setSearchResults([]);
      setSearch('');
      fetchAdmins();
    } else {
      setMessage(data.error || '추가 실패');
    }
    setAdding(false);
  }

  async function handleRemove(username: string) {
    if (!confirm('이 관리자를 제거하시겠습니까?')) return;
    await fetch(`/api/admin/admins/${encodeURIComponent(username)}`, { method: 'DELETE' });
    fetchAdmins();
  }

  function permSummary(raw: string | null) {
    if (!raw) return <span style={{ color: '#f5a623', fontSize: '0.78rem', fontWeight: 700 }}>전체 허용</span>;
    const keys = raw.split(',').map(p => p.trim()).filter(Boolean);
    if (keys.length === 0) return <span style={{ color: '#e94560', fontSize: '0.78rem' }}>권한 없음</span>;
    return (
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        {keys.map(k => ALL_MENUS.find(m => m.key === k)?.label ?? k).join(', ')}
      </span>
    );
  }

  return (
    <div>
      {/* 관리자 추가 */}
      <div className="game-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>서브 관리자 추가</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="회원 이름 또는 닉네임으로 검색..."
            style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem' }}
          />
          <button onClick={handleSearch} disabled={searching} className="btn-secondary"
            style={{ padding: '0.6rem 1rem', fontSize: '0.875rem' }}>
            {searching ? '검색 중...' : '검색'}
          </button>
        </div>

        {message && (
          <div style={{ fontSize: '0.875rem', color: message.includes('추가') ? '#22c55e' : '#e94560', marginBottom: '0.75rem' }}>
            {message}
          </div>
        )}

        {searchResults.length > 0 && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {searchResults.map(m => {
              const alreadyAdmin = admins.some(a => a.username === m.username);
              return (
                <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{m.name || m.nickname || '-'}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>{m.username}</span>
                  </div>
                  {alreadyAdmin ? (
                    <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 700 }}>이미 관리자</span>
                  ) : (
                    <button onClick={() => handleAdd(m.username)} disabled={adding} className="btn-primary"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>추가</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 현재 관리자 목록 */}
      <div className="game-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
          현재 서브 관리자 ({admins.length}명)
        </div>

        {admins.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>서브 관리자가 없습니다</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {admins.map(a => (
              <div key={a.username} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--text)', fontWeight: 600, marginRight: '0.5rem' }}>{a.name || a.nickname || '-'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{a.username}</span>
                    <div style={{ marginTop: '0.3rem' }}>{permSummary(a.permissions)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setOpenPerm(openPerm === a.username ? null : a.username)}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.7rem', fontSize: '0.8rem', color: 'var(--accent)' }}>
                      {openPerm === a.username ? '닫기' : '권한 설정'}
                    </button>
                    <button onClick={() => handleRemove(a.username)} className="btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', color: '#e94560' }}>제거</button>
                  </div>
                </div>

                {openPerm === a.username && (
                  <PermEditor admin={a} onSaved={() => { fetchAdmins(); setOpenPerm(null); }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
