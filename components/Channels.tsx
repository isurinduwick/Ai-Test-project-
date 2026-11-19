'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { CHANNELS, CHANNEL_IDS, ChannelId, Store, key, money } from '@/lib/data';
import { Card, ChannelIcon } from './ui';

const KIND: Record<ChannelId, string> = { booking: 'Online travel agency', airbnb: 'Home & stay marketplace', expedia: 'Online travel agency', agoda: 'Online travel agency', direct: 'Hotel website booking engine' };

export default function Channels({ store, notify }: { store: Store; notify: (m: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [last, setLast] = useState<Record<string, string>>({});
  const t = store.today;
  const ms = key(new Date(t.getFullYear(), t.getMonth(), 1, 12)), me = key(new Date(t.getFullYear(), t.getMonth() + 1, 0, 12));
  const rows = CHANNEL_IDS.map((id) => {
    const l = store.bookings.filter((b) => b.channel === id && b.status !== 'Cancelled' && b.checkIn >= ms && b.checkIn <= me);
    return { id, n: l.length, gross: l.reduce((s, b) => s + b.rate * b.nights, 0) };
  });
  const all = rows.reduce((s, r) => s + r.n, 0) || 1;
  const sync = (id: string, name: string) => {
    setBusy(id);
    setTimeout(() => { setBusy(null); setLast((l) => ({ ...l, [id]: 'just now' })); notify(`${name} is up to date`); }, 1200);
  };
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((r, i) => {
        const c = CHANNELS[r.id];
        return (
          <Card key={r.id} className="p-5">
            <div className="flex items-center gap-4">
              <ChannelIcon id={r.id} size={52} />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold leading-tight">{c.name}</h3>
                <p className="text-xs text-ink-700/60">{KIND[r.id]}</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>Live
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[['Bookings', String(r.n)], ['Gross', money(r.gross)], ['Commission', `${c.commission}%`]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-sea-50 py-3"><dd className="text-lg font-semibold tabular-nums">{v}</dd><dt className="text-[11px] text-ink-700/60">{l}</dt></div>
              ))}
            </dl>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-ink-700/60"><span>Share of this month&apos;s bookings</span><span className="font-semibold tabular-nums">{Math.round((r.n / all) * 100)}%</span></div>
              <div className="h-1.5 rounded-full bg-black/[0.05]"><div className="h-1.5 rounded-full" style={{ width: `${(r.n / all) * 100}%`, background: c.color }} /></div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-black/[0.05] pt-4 text-xs text-ink-700/60">
              <span>Last sync {last[r.id] ?? `${i * 3 + 2} min ago`} · 4 rooms mapped</span>
              <button onClick={() => sync(r.id, c.name)} disabled={busy === r.id} className="flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-1.5 font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60">
                <RefreshCw size={13} className={busy === r.id ? 'animate-spin' : ''} />{busy === r.id ? 'Syncing' : 'Sync now'}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
