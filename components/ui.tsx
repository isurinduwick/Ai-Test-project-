import type { LucideIcon } from 'lucide-react';
import { AlertCircle, ArrowDownRight, ArrowUpRight, CalendarCheck, CheckCircle2, CircleDashed, Clock3, Hotel, LogIn, LogOut, Plane, Undo2, XCircle } from 'lucide-react';
import { CHANNELS, ChannelId, Pay, Status } from '@/lib/data';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl bg-white shadow-panel ring-1 ring-black/[0.04] ${className}`}>{children}</section>
);

export const IconChip = ({ children, tone = 'bg-sea-50 text-sea-600' }: { children: React.ReactNode; tone?: string }) => (
  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>{children}</span>
);

export const CardHead = ({ title, sub, right, icon }: { title: string; sub?: string; right?: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
    <div className="flex items-center gap-3">
      {icon && <IconChip>{icon}</IconChip>}
      <div>
        <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-ink-700/60">{sub}</p>}
      </div>
    </div>
    {right}
  </div>
);

/* iOS-style segmented control */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-full bg-black/[0.05] p-1">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} aria-pressed={value === o}
          className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${value === o ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-700/60 hover:text-ink-900'}`}>{o}</button>
      ))}
    </div>
  );
}

/* ---------- channel logos (simplified marks; swap for official partner assets in production) ---------- */
const AGODA = [[12, 5.5, '#ef4444'], [18.2, 10, '#f59e0b'], [15.8, 17.3, '#22c55e'], [8.2, 17.3, '#3b82f6'], [5.8, 10, '#8b5cf6']] as const;

export function ChannelIcon({ id, size = 28 }: { id: ChannelId; size?: number }) {
  const box = { width: size, height: size, borderRadius: Math.round(size * 0.28) };
  const cls = 'inline-flex shrink-0 items-center justify-center overflow-hidden';
  if (id === 'booking')
    return <span className={`${cls} text-white`} style={{ ...box, background: '#003580', fontSize: size * 0.64, fontWeight: 800, lineHeight: 1 }}>B<span style={{ color: '#4cc3ff' }}>.</span></span>;
  if (id === 'airbnb')
    return (
      <span className={cls} style={{ ...box, background: '#ff385c' }}>
        <svg viewBox="0 0 24 24" width={size * 0.66} height={size * 0.66} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.5c-1.2 0-2 .8-2.6 2L6 13c-.7 1.5-1 2.3-1 3.2A3 3 0 0 0 8 19c1.6 0 2.8-1.2 4-3 1.2 1.8 2.4 3 4 3a3 3 0 0 0 3-2.8c0-.9-.3-1.7-1-3.2l-3.4-7.5c-.6-1.2-1.4-2-2.6-2Z" />
          <path d="M12 16c-1-1.2-1.5-2.1-1.5-3a1.5 1.5 0 0 1 3 0c0 .9-.5 1.8-1.5 3Z" />
        </svg>
      </span>
    );
  if (id === 'expedia')
    return <span className={cls} style={{ ...box, background: '#11265c' }}><Plane size={size * 0.58} color="#ffd84d" fill="#ffd84d" strokeWidth={2} /></span>;
  if (id === 'agoda')
    return (
      <span className={cls} style={{ ...box, background: '#fff', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)' }}>
        <svg viewBox="0 0 24 24" width={size * 0.8} height={size * 0.8}>{AGODA.map(([cx, cy, f]) => <circle key={f} cx={cx} cy={cy} r="2.4" fill={f} />)}</svg>
      </span>
    );
  return <span className={cls} style={{ ...box, background: 'linear-gradient(135deg,#2f8f7f,#0a2b27)' }}><Hotel size={size * 0.56} color="#fff" /></span>;
}

export const ChannelBadge = ({ id, size = 22 }: { id: ChannelId; size?: number }) => (
  <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium"><ChannelIcon id={id} size={size} />{CHANNELS[id].name}</span>
);

/* ---------- status + payment badges with icons ---------- */
const pill = 'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none';
const S: Record<Status, [string, LucideIcon]> = {
  Confirmed: ['bg-sea-50 text-sea-700', CalendarCheck],
  Pending: ['bg-amber-50 text-amber-700', Clock3],
  'Checked-in': ['bg-sky-50 text-sky-700', LogIn],
  'Checked-out': ['bg-slate-100 text-slate-600', LogOut],
  Cancelled: ['bg-rose-50 text-rose-600', XCircle],
};
const P: Record<Pay, [string, string, LucideIcon]> = {
  Paid: ['bg-emerald-600 text-white', 'Paid', CheckCircle2],
  Partial: ['bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-300/70', 'Part-paid', CircleDashed],
  Pending: ['bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200', 'Payment pending', AlertCircle],
  Refunded: ['bg-slate-100 text-slate-500', 'Refunded', Undo2],
};
export const StatusBadge = ({ s }: { s: Status }) => { const [c, I] = S[s]; return <span className={`${pill} ${c}`}><I size={12} />{s}</span>; };
export const PayBadge = ({ p }: { p: Pay }) => { const [c, l, I] = P[p]; return <span className={`${pill} ${c}`}><I size={12} />{l}</span>; };

export const Trend = ({ v, dark }: { v: number; dark?: boolean }) => (
  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold ${v >= 0 ? (dark ? 'bg-white/15 text-emerald-200' : 'bg-emerald-50 text-emerald-700') : (dark ? 'bg-white/15 text-rose-200' : 'bg-rose-50 text-rose-600')}`}>
    {v >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(v).toFixed(1)}%
  </span>
);

export const Kpi = ({ label, value, sub, icon, trend, tone }: { label: string; value: string; sub?: string; icon: React.ReactNode; trend?: number; tone?: string }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <IconChip tone={tone}>{icon}</IconChip>
      {trend !== undefined && <Trend v={trend} />}
    </div>
    <div className="mt-4 text-[13px] font-medium text-ink-700/60">{label}</div>
    <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</div>
    {sub && <div className="mt-2 text-xs text-ink-700/55">{sub}</div>}
  </Card>
);

export const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => {
  const hue = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0) % 360;
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 38% 42%)` }}>
      {name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
    </span>
  );
};
