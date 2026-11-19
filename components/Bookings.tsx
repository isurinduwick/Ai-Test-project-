'use client';
import { useMemo, useState } from 'react';
import { BedDouble, Search } from 'lucide-react';
import { CHANNELS, CHANNEL_IDS, ROOMS, Store, addDays, fmtShort, key, money, parse } from '@/lib/data';
import { Avatar, Card, CardHead, ChannelBadge, PayBadge, StatusBadge } from './ui';

export default function Bookings({ store }: { store: Store }) {
  const [q, setQ] = useState(''), [ch, setCh] = useState('all'), [pay, setPay] = useState('all'), [limit, setLimit] = useState(25);
  const rows = useMemo(() => {
    const from = key(addDays(store.today, -45));
    return store.bookings
      .filter((b) => b.checkIn >= from)
      .filter((b) => (ch === 'all' || b.channel === ch) && (pay === 'all' || b.pay === pay))
      .filter((b) => !q || (b.guest + b.id).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  }, [q, ch, pay, store]);
  const sel = 'rounded-full bg-black/[0.05] px-4 py-2 text-sm font-medium';
  return (
    <Card>
      <CardHead icon={<BedDouble size={18} />} title="All reservations" sub={`${rows.length} bookings from the last 45 days onward`}
        right={<div className="flex flex-wrap gap-2">
          <label className="relative"><Search size={15} className="absolute left-3 top-2.5 text-ink-700/50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guest or ID" className={`${sel} pl-9`} /></label>
          <select value={ch} onChange={(e) => setCh(e.target.value)} className={sel}><option value="all">All channels</option>{CHANNEL_IDS.map((id) => <option key={id} value={id}>{CHANNELS[id].name}</option>)}</select>
          <select value={pay} onChange={(e) => setPay(e.target.value)} className={sel}><option value="all">All payments</option><option>Paid</option><option>Partial</option><option>Pending</option><option>Refunded</option></select>
        </div>} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs text-ink-700/60"><tr>{['Booking', 'Guest', 'Room', 'Channel', 'Check-in', 'Nights', 'Total', 'Status', 'Payment'].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.slice(0, limit).map((b) => (
              <tr key={b.id} className="border-t border-black/[0.05] hover:bg-sea-50/60">
                <td className="px-4 py-3 font-mono text-xs">{b.id}</td>
                <td className="px-4 py-3"><span className="flex items-center gap-2.5 font-medium"><Avatar name={b.guest} size={28} />{b.guest}</span></td>
                <td className="px-4 py-3"><span className="font-medium">{ROOMS.find((r) => r.id === b.room)?.name}</span><span className="block text-xs text-ink-700/60">{b.unit ? `Room ${b.unit}` : 'No room held'}</span></td>
                <td className="px-4 py-3"><ChannelBadge id={b.channel} /></td>
                <td className="px-4 py-3">{fmtShort(parse(b.checkIn))}</td>
                <td className="px-4 py-3">{b.nights}</td>
                <td className="px-4 py-3 font-semibold">{money(b.rate * b.nights)}</td>
                <td className="px-4 py-3"><StatusBadge s={b.status} /></td>
                <td className="px-4 py-3"><PayBadge p={b.pay} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limit < rows.length && <div className="border-t border-sea-100 p-4 text-center"><button onClick={() => setLimit(limit + 25)} className="rounded-lg border border-sea-200 px-4 py-2 text-sm font-semibold hover:bg-sea-50">Show 25 more</button></div>}
    </Card>
  );
}
