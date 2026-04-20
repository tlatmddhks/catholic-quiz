export const ALL_MENUS = [
  { key: 'quiz',     label: '문제 관리',     icon: '❓' },
  { key: 'survival', label: '서바이벌 관리', icon: '❤️' },
  { key: 'members',  label: '회원 관리',     icon: '👥' },
  { key: 'notice',   label: '공지사항',      icon: '📢' },
  { key: 'stats',    label: '통계',          icon: '📈' },
  { key: 'ranking',  label: '랭킹 관리',     icon: '🏆' },
] as const;

export type MenuKey = typeof ALL_MENUS[number]['key'];
