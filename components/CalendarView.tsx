'use client';
import { useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { CHANNELS, CHANNEL_IDS, ROOMS, Store, TOTAL_ROOMS, key, money, parse, stayAvailability } from '@/lib/data';
import { Card, CardHead, ChannelIcon, PayBadge, StatusBadge } from './ui';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const nav = 'rounded-full bg-black/[0.05] p-2 text-ink-900 transition hover:bg-black/10';

export default function CalendarView({ store }: { store: Store }) {
  const { today, byDate } = store;
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1, 12));
  const [room, setRoom] = useState('all');
  const [sel, setSel] = useState(key(today));
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const pad = (cursor.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const total = room === 'all' ? TOTAL_ROOMS : ROOMS.find((r) => r.id === room)!.total;
  const pick = (k: string) => (byDate[k] || []).filter((b) => room === 'all' || b.room === room);

  const stats = useMemo(() => {
    let sold = 0;
    for (let d = 1; d <= days; d++) sold += pick(key(new Date(y, m, d, 12))).length;
    return { sold, occ: Math.round((sold / (total * days)) * 100) };
  }, [y, m, room, store]); // eslint-disable-line
  const selList = pick(sel);
  const move = (n: number) => setCursor(new Date(y, m + n, 1, 12));

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
      <Card>
        <CardHead icon={<CalendarDays size={18} />} title={cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          sub={`${stats.sold} room-nights sold · ${stats.occ}% occupancy`}
          right={<div className="flex items-center gap-2">
            <select value={room} onChange={(e) => setRoom(e.target.value)} aria-label="Room type" className="rounded-full bg-black/[0.05] px-4 py-2 text-sm font-medium">
              <option value="all">All room types</option>
              {ROOMS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button aria-label="Previous month" onClick={() => move(-1)} className={nav}><ChevronLeft size={16} /></button>
            <button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1, 12))} className="rounded-full bg-black/[0.05] px-3.5 py-2 text-xs font-semibold hover:bg-black/10">Today</button>
            <button aria-label="Next month" onClick={() => move(1)} className={nav}><ChevronRight size={16} /></button>
          </div>} />
        <div className="overflow-x-auto p-4 pt-2">
          <div className="grid min-w-[680px] grid-cols-7 gap-1.5">
            {DOW.map((d) => <div key={d} className="pb-1 text-center text-xs font-semibold text-ink-700/50">{d}</div>)}
            {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const k = key(new Date(y, m, i + 1, 12)), list = pick(k);
              const avail = total - list.length, occ = list.length / total, full = avail <= 0;
              const dark = full || occ > 0.55, isToday = k === key(today);
              const pending = list.filter((b) => b.pay === 'Pending').length;
              const counts = CHANNEL_IDS.map((id) => ({ id, n: list.filter((b) => b.channel === id).length })).filter((x) => x.n);
              return (
                <button key={k} onClick={() => setSel(k)} aria-label={`${k}: ${avail} rooms free`}
                  style={{ background: full ? '#0a2b27' : list.length ? `rgba(31,122,107,${0.08 + occ * 0.52})` : '#fff' }}
                  className={`flex min-h-[104px] flex-col rounded-xl p-2 text-left ring-1 transition hover:-translate-y-px hover:shadow-md ${dark ? 'text-white' : ''} ${sel === k ? 'ring-2 ring-brass-500' : 'ring-black/[0.06]'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-[13px] font-semibold ${isToday ? 'bg-brass-500 text-white' : ''}`}>{i + 1}</span>
                    {pending > 0 && <span title="Payments pending" className="inline-flex items-center gap-0.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white"><AlertCircle size={10} />{pending}</span>}
                  </div>
                  <div className={`mt-1 text-[11px] font-medium ${full ? 'text-brass-400' : dark ? 'text-white/85' : 'text-ink-700/70'}`}>{full ? 'Sold out' : `${avail} free`}</div>
                  <div className="mt-auto flex flex-wrap gap-0.5 pt-1.5">
                    {counts.map((x) => (
                      <span key={x.id} title={`${CHANNELS[x.id].name}: ${x.n}`} className="inline-flex items-center gap-0.5 rounded-md bg-white py-0.5 pl-0.5 pr-1 text-[10px] font-bold text-ink-900 shadow-sm">
                        <ChannelIcon id={x.id} size={13} />{x.n}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-700/70">
            {CHANNEL_IDS.map((id) => <span key={id} className="flex items-center gap-1.5"><ChannelIcon id={id} size={16} />{CHANNELS[id].name}</span>)}
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-16 rounded-full" style={{ background: 'linear-gradient(90deg,rgba(31,122,107,.1),rgba(31,122,107,.6))' }} />Fewer to more booked</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-ink-900" />Sold out</span>
            <span className="flex items-center gap-1.5"><span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white"><AlertCircle size={10} />2</span>Payments pending</span>
          </div>
        </div>
      </Card>

      <Card className="self-start xl:sticky xl:top-24">
        <div className="p-5 pb-4">
          <div className="text-xs font-medium text-ink-700/60">{parse(sel).toLocaleDateString('en-US', { weekday: 'long' })}</div>
          <div className="text-2xl font-semibold tracking-tight">{parse(sel).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {([['Rooms sold', selList.length], ['Available', total - selList.length], ['Revenue', money(selList.reduce((s, b) => s + b.rate, 0))]] as [string, string | number][]).map(([l, v]) => (
              <div key={l} className="rounded-xl bg-sea-50 py-2.5"><div className="text-base font-semibold tabular-nums">{v}</div><div className="text-[11px] text-ink-700/60">{l}</div></div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="text-xs font-semibold text-ink-700/60">Rooms available</div>
            {ROOMS.filter((r) => room === 'all' || r.id === room).map((r) => {
              const a = stayAvailability(store, r, [parse(sel)]);
              return (
                <div key={r.id} className="flex items-start gap-2 text-xs">
                  <span className="w-[108px] shrink-0 pt-0.5 text-ink-700/70">{r.name}</span>
                  <div className="flex flex-wrap gap-1">
                    {a.units.filter((u) => u.state === 'free').map((u) => <span key={u.id} className="rounded-md bg-emerald-100 px-1.5 py-0.5 font-semibold tabular-nums text-emerald-800">{u.id}</span>)}
                    {a.free === 0 && <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600">Sold out</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <ul className="max-h-[560px] divide-y divide-black/[0.05] overflow-y-auto border-t border-black/[0.05]">
          {selList.length === 0 && <li className="p-6 text-sm text-ink-700/60">No bookings on this night. Rooms are open to sell.</li>}
          {selList.map((b) => (
            <li key={b.id + sel} className="flex gap-3 px-5 py-3.5">
              <ChannelIcon id={b.channel} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{b.guest}</span><span className="text-sm font-semibold tabular-nums">{money(b.rate)}</span></div>
                <div className="mt-0.5 text-xs text-ink-700/60">1 × {ROOMS.find((r) => r.id === b.room)?.name}{b.unit ? ` (Room ${b.unit})` : ''} · from {CHANNELS[b.channel].name}</div>
                <div className="mt-2 flex flex-wrap gap-1.5"><StatusBadge s={b.status} /><PayBadge p={b.pay} /></div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
