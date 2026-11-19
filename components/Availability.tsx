'use client';
import { useMemo, useState } from 'react';
import { BedDouble, CalendarDays, CheckCircle2, DoorOpen, Moon, SearchX } from 'lucide-react';
import { CHANNELS, ROOMS, Store, UnitInfo, addDays, fmtShort, key, money, parse, rateFor, stayAvailability } from '@/lib/data';
import { Card, CardHead, ChannelIcon } from './ui';

const field = 'w-full rounded-xl bg-black/[0.05] px-4 py-2.5 text-sm font-medium';
const dayFmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const tone = (v: number) => (v === 0 ? 'bg-rose-100 text-rose-700' : v <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800');

function Unit({ u }: { u: UnitInfo }) {
  const first = u.bookings[0];
  const cls = u.state === 'free' ? 'bg-emerald-50 text-emerald-800 ring-emerald-300' : u.state === 'partial' ? 'bg-amber-50 text-amber-800 ring-amber-300' : 'bg-slate-100 text-slate-500 ring-slate-200';
  const label = u.state === 'free' ? 'Free' : u.state === 'partial' ? 'Partial' : 'Booked';
  const tip = u.state === 'free' ? `Room ${u.id} is free for the whole stay`
    : `Room ${u.id}: ` + u.bookings.map((b) => `${b.guest} via ${CHANNELS[b.channel].name} (from ${fmtShort(parse(b.checkIn))}, ${b.nights} nights)`).join('; ');
  return (
    <div title={tip} className={`flex h-[60px] w-[80px] flex-col items-center justify-center rounded-xl ring-1 ring-inset ${cls}`}>
      <span className="text-[17px] font-semibold leading-none tabular-nums">{u.id}</span>
      <span className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold leading-none">
        {u.state === 'free' ? <CheckCircle2 size={11} /> : <ChannelIcon id={first.channel} size={12} />}{label}
      </span>
    </div>
  );
}

export default function Availability({ store, rates }: { store: Store; rates: Record<string, number> }) {
  const { today } = store;
  const [from, setFromRaw] = useState(key(today));
  const [to, setTo] = useState(key(addDays(today, 1)));
  const [type, setType] = useState('all');
  const setFrom = (v: string) => { if (!v) return; setFromRaw(v); if (parse(to) <= parse(v)) setTo(key(addDays(parse(v), 1))); };
  const n = Math.round((parse(to).getTime() - parse(from).getTime()) / 864e5);
  const valid = n >= 1 && n <= 30;
  const fri = addDays(today, (5 - today.getDay() + 7) % 7);
  const presets: [string, Date, Date][] = [['Tonight', today, addDays(today, 1)], ['Tomorrow night', addDays(today, 1), addDays(today, 2)], ['This weekend', fri, addDays(fri, 2)], ['Next 7 nights', today, addDays(today, 7)]];

  const res = useMemo(() => {
    if (!valid) return [];
    const nights = Array.from({ length: n }, (_, i) => addDays(parse(from), i));
    return ROOMS.filter((r) => type === 'all' || r.id === type).map((r) => {
      const prices = nights.map((d) => rateFor(rates, r, key(d)));
      const total = prices.reduce((s, x) => s + x, 0);
      return { room: r, nights, total, avg: total / n, ...stayAvailability(store, r, nights) };
    });
  }, [from, to, type, store, rates, valid, n]);
  const totalFree = res.reduce((s, x) => s + x.free, 0), totalRooms = res.reduce((s, x) => s + x.room.total, 0);
  const nights = res[0]?.nights ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardHead icon={<DoorOpen size={18} />} title="Check availability" sub="Choose the stay dates to see exactly which rooms are free" />
        <div className="grid gap-4 px-5 pb-5 pt-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="space-y-1.5 text-xs font-medium text-ink-700/60"><span>Check-in</span><input type="date" className={field} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="space-y-1.5 text-xs font-medium text-ink-700/60"><span>Check-out</span><input type="date" className={field} min={key(addDays(parse(from), 1))} value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <label className="space-y-1.5 text-xs font-medium text-ink-700/60"><span>Room type</span>
            <select className={field} value={type} onChange={(e) => setType(e.target.value)}><option value="all">All room types</option>{ROOMS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          </label>
          <div className="flex items-end"><span className="inline-flex items-center gap-2 rounded-xl bg-sea-50 px-4 py-2.5 text-sm font-semibold text-sea-700"><Moon size={15} />{valid ? `${n} night${n > 1 ? 's' : ''}` : 'Invalid dates'}</span></div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-black/[0.05] px-5 py-3.5">
          {presets.map(([l, a, b]) => (
            <button key={l} onClick={() => { setFromRaw(key(a)); setTo(key(b)); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${from === key(a) && to === key(b) ? 'bg-ink-900 text-white' : 'bg-black/[0.05] hover:bg-black/10'}`}>{l}</button>
          ))}
        </div>
      </Card>

      {!valid ? (
        <Card className="p-10 text-center">
          <SearchX size={30} className="mx-auto text-ink-700/40" />
          <p className="mt-3 font-semibold">Check-out must be after check-in</p>
          <p className="mt-1 text-sm text-ink-700/60">You can check up to 30 nights at a time.</p>
        </Card>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-ink-900 via-ink-800 to-sea-700 p-6 text-white shadow-lift sm:p-8">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brass-500/25 blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-center">
              <div>
                <p className="text-sm text-sea-200">{dayFmt(parse(from))} to {dayFmt(parse(to))} · {n} night{n > 1 ? 's' : ''}</p>
                <div className="mt-3 flex items-end gap-3">
                  <span className="text-6xl font-semibold leading-none tabular-nums">{totalFree}</span>
                  <span className="pb-1.5 text-lg text-sea-200">of {totalRooms} rooms available</span>
                </div>
                <p className="mt-2 text-sm text-sea-200">{totalFree === 0 ? 'Sold out for these dates.' : `Free on every night of the stay.`}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {res.map((x) => (
                  <div key={x.room.id} className="rounded-2xl bg-white/[0.08] p-3.5 ring-1 ring-white/10">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${x.free === 0 ? 'bg-rose-400' : x.free <= 2 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <span className="text-2xl font-semibold leading-none tabular-nums">{x.free}</span>
                      <span className="text-xs text-sea-200">/ {x.room.total}</span>
                    </div>
                    <div className="mt-2 truncate text-xs text-sea-200">{x.room.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-700/70">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-200 ring-1 ring-emerald-400" />Free for the whole stay</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-400" />Partial: free only some nights</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-200 ring-1 ring-slate-300" />Booked (logo shows the channel)</span>
            <span>Hover a room to see the guest.</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {res.map((x) => {
              const part = x.units.filter((u) => u.state === 'partial').length, full = x.units.filter((u) => u.state === 'booked').length;
              const w = (c: number) => `${(c / x.room.total) * 100}%`;
              return (
                <Card key={x.room.id}>
                  <CardHead icon={<BedDouble size={18} />} title={x.room.name} sub={`${x.room.total} rooms · avg ${money(x.avg)} per night`}
                    right={<span className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${tone(x.free)}`}>{x.free === 0 ? 'Sold out' : `${x.free} available`}</span>} />
                  <div className="space-y-4 px-5 pb-5 pt-2">
                    <div className="flex h-2 overflow-hidden rounded-full bg-black/[0.05]">
                      <span className="bg-emerald-500" style={{ width: w(x.free) }} /><span className="bg-amber-400" style={{ width: w(part) }} /><span className="bg-slate-300" style={{ width: w(full) }} />
                    </div>
                    <div className="flex flex-wrap gap-2">{x.units.map((u) => <Unit key={u.id} u={u} />)}</div>
                    <div className="flex items-center justify-between rounded-xl bg-sea-50 px-4 py-3 text-sm">
                      <span className="text-ink-700/70">{n} night{n > 1 ? 's' : ''} per room</span>
                      <span className="font-semibold tabular-nums">{money(x.total)}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHead icon={<CalendarDays size={18} />} title="Night by night" sub="Rooms left to sell on each night of the stay" />
            <div className="overflow-x-auto pb-2">
              <table className="w-full border-collapse text-center text-sm" style={{ minWidth: 190 + nights.length * 64 }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white px-5 py-2 text-left text-xs font-semibold text-ink-700/60">Room type</th>
                    {nights.map((d) => <th key={key(d)} className="px-1 py-2 text-xs font-semibold text-ink-700/60">{d.toLocaleDateString('en-US', { weekday: 'short' })}<div className="text-[13px] text-ink-900">{fmtShort(d)}</div></th>)}
                  </tr>
                </thead>
                <tbody>
                  {res.map((x) => (
                    <tr key={x.room.id} className="border-t border-black/[0.05]">
                      <td className="sticky left-0 bg-white px-5 py-2.5 text-left font-medium">{x.room.name}</td>
                      {x.nightly.map((v, i) => <td key={i} className="px-1 py-2.5"><span className={`inline-grid h-9 min-w-10 place-items-center rounded-lg px-2 font-semibold tabular-nums ${tone(v)}`}>{v}</span></td>)}
                    </tr>
                  ))}
                  {res.length > 1 && (
                    <tr className="border-t border-black/10">
                      <td className="sticky left-0 bg-white px-5 py-2.5 text-left font-semibold">All rooms</td>
                      {nights.map((_, i) => <td key={i} className="px-1 py-2.5 font-semibold tabular-nums">{res.reduce((s, x) => s + x.nightly[i], 0)}</td>)}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="px-5 pb-4 text-xs text-ink-700/60">A night can show more rooms than the stay total above, because different rooms may be taken on different nights.</p>
          </Card>
        </>
      )}
    </div>
  );
}
