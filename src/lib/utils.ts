export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `قبل ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${days} ي`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `قبل ${weeks} أ`;
  const months = Math.floor(days / 30);
  return `قبل ${months} ش`;
}

export function getInitials(firstName: string, lastName: string): string {
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

export function pickAvatarColor(seed: string): string {
  const colors = [
    "from-violet-500 to-fuchsia-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-emerald-500 to-teal-500",
    "from-sky-500 to-cyan-500",
    "from-indigo-500 to-purple-500",
    "from-lime-500 to-green-500",
    "from-red-500 to-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const AVATAR_PALETTE = [
  "from-violet-500 to-fuchsia-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-cyan-500",
  "from-indigo-500 to-purple-500",
  "from-lime-500 to-green-500",
  "from-red-500 to-rose-500",
];
