'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal, Tag } from 'lucide-react';
import { CHANNELS, CHANNEL_IDS, ChannelId, ROOMS, Store, addDays, key, money, parse, rateFor } from '@/lib/data';
import { Card, CardHead, ChannelIcon } from './ui';

interface Props { store: Store; rates: Record<string, number>; setRates: (r: Record<string, number>) => void; notify: (m: string) => void }

export default function Rates({ store, rates, setRates, notify }: Props) {
  const { today, byDate } = store;
  const [start, setStart] = useState(today);
  const [targets, setTargets] = useState<ChannelId[]>(CHANNEL_IDS);
  const [bulk, setBulk] = useState({ room: ROOMS[0].id, from: key(today), to: key(addDays(today, 6)), mode: 'set', value: 150 });
  const cols = Array.from({ length: 14 }, (_, i) => addDays(start, i));
  const toggle = (id: ChannelId) => setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const push = (n: number) => notify(`${n} rate${n > 1 ? 's' : ''} sent to ${targets.length ? targets.map((t) => CHANNELS[t].name).join(', ') : 'no channels'}`);

  const setOne = (roomId: string, k: string, v: number) => {
    const room = ROOMS.find((r) => r.id === roomId)!;
    if (!v || v < 1 || v === rateFor(rates, room, k)) return;
    setRates({ ...rates, [`${roomId}|${k}`]: Math.round(v) });
    push(1);
  };
  const apply = () => {
    const room = ROOMS.find((r) => r.id === bulk.room)!;
    const next = { ...rates };
    let n = 0;
    for (let d = parse(bulk.from); d <= parse(bulk.to); d = addDays(d, 1)) {
      const k = key(d), cur = rateFor(rates, room, k);
      next[`${room.id}|${k}`] = Math.max(1, Math.round(bulk.mode === 'set' ? bulk.value : cur * (1 + bulk.value / 100)));
      n++;
    }
    setRates(next); push(n);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHead icon={<Tag size={18} />} title="Rates and availability" sub="Edit any rate. Changes go to the selected channels."
          right={<div className="flex gap-2">
            <button aria-label="Previous 2 weeks" onClick={() => setStart(addDays(start, -14))} className="rounded-full bg-black/[0.05] p-2 hover:bg-black/10"><ChevronLeft size={18} /></button>
            <button aria-label="Next 2 weeks" onClick={() => setStart(addDays(start, 14))} className="rounded-full bg-black/[0.05] p-2 hover:bg-black/10"><ChevronRight size={18} /></button>
          </div>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white px-5 py-3 text-left text-xs font-semibold text-ink-700/60">Room type</th>
                {cols.map((d) => (
                  <th key={key(d)} className={`px-1 py-3 text-center text-xs font-semibold ${[0, 6].includes(d.getDay()) ? 'text-brass-600' : 'text-ink-700/60'}`}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}<div className="text-sm text-ink-900">{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROOMS.map((r) => (
                <tr key={r.id} className="border-t border-sea-100">
                  <td className="sticky left-0 bg-white px-5 py-3"><div className="font-semibold">{r.name}</div><div className="text-xs text-ink-700/60">{r.total} rooms · base {money(r.base)}</div></td>
                  {cols.map((d) => {
                    const k = key(d), left = r.total - (byDate[k] || []).filter((b) => b.room === r.id).length;
                    const edited = rates[`${r.id}|${k}`] !== undefined;
                    return (
                      <td key={k} className="px-1 py-2 text-center">
                        <input key={rateFor(rates, r, k)} defaultValue={rateFor(rates, r, k)} inputMode="numeric" aria-label={`${r.name} rate ${k}`}
                          onBlur={(e) => setOne(r.id, k, Number(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                          className={`w-[60px] rounded-lg border px-1 py-1.5 text-center text-sm font-semibold tabular-nums ${edited ? 'border-brass-400 bg-amber-50' : 'border-black/10 bg-sea-50/60'}`} />
                        <div className={`mt-1 text-[11px] font-medium ${left === 0 ? 'text-rose-600' : left <= 2 ? 'text-amber-600' : 'text-ink-700/60'}`}>{left === 0 ? 'sold out' : `${left} left`}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead icon={<SlidersHorizontal size={18} />} title="Bulk update" sub="Change a date range in one go" />
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
          {[
            ['Room type', <select key="r" value={bulk.room} onChange={(e) => setBulk({ ...bulk, room: e.target.value })} className="w-full rounded-lg border border-sea-200 px-3 py-2 text-sm">{ROOMS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>],
            ['From', <input key="f" type="date" value={bulk.from} onChange={(e) => setBulk({ ...bulk, from: e.target.value })} className="w-full rounded-lg border border-sea-200 px-3 py-2 text-sm" />],
            ['To', <input key="t" type="date" value={bulk.to} onChange={(e) => setBulk({ ...bulk, to: e.target.value })} className="w-full rounded-lg border border-sea-200 px-3 py-2 text-sm" />],
            ['Change type', <select key="m" value={bulk.mode} onChange={(e) => setBulk({ ...bulk, mode: e.target.value })} className="w-full rounded-lg border border-sea-200 px-3 py-2 text-sm"><option value="set">Set rate ($)</option><option value="pct">Adjust by %</option></select>],
            [bulk.mode === 'set' ? 'New rate' : 'Percent (+/−)', <input key="v" type="number" value={bulk.value} onChange={(e) => setBulk({ ...bulk, value: Number(e.target.value) })} className="w-full rounded-lg border border-sea-200 px-3 py-2 text-sm" />],
          ].map(([l, el]) => <label key={l as string} className="space-y-1 text-xs font-medium text-ink-700/70"><span>{l}</span>{el}</label>)}
          <div className="flex items-end"><button onClick={apply} className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"><RefreshCw size={15} />Update rates</button></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-sea-100 px-5 py-4 text-xs">
          <span className="mr-1 font-medium text-ink-700/70">Send to</span>
          {CHANNEL_IDS.map((id) => (
            <button key={id} onClick={() => toggle(id)} aria-pressed={targets.includes(id)}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 font-semibold transition ${targets.includes(id) ? 'bg-ink-900 text-white' : 'bg-black/[0.05] text-ink-700/60 hover:bg-black/10'}`}>
              <ChannelIcon id={id} size={22} />{CHANNELS[id].name}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}
