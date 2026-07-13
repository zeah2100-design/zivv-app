export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/40"
      style={{ width: size, height: size }}
      aria-label="zivv logo"
    >
      <span
        className="font-black tracking-tight"
        style={{ fontSize: size * 0.45 }}
      >
        z
      </span>
      <span
        className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900"
        style={{ width: size * 0.18, height: size * 0.18 }}
      />
    </div>
  );
}
