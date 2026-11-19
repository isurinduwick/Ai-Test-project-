'use client';
import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, BedDouble, CalendarCheck, CalendarDays, CalendarRange, CheckCircle2, CircleDashed, LogIn, LogOut, Share2, TrendingUp, Wallet } from 'lucide-react';
import { CHANNELS, CHANNEL_IDS, ROOMS, Store, TOTAL_ROOMS, addDays, fmtShort, key, money, parse, stayAvailability, sumRange } from '@/lib/data';
import { Avatar, Card, CardHead, ChannelBadge, ChannelIcon, Kpi, PayBadge, Segmented, StatusBadge, Trend } from './ui';

type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
const PERIOD_LABEL: Record<Period, string> = { Daily: 'last 30 days', Weekly: 'last 12 weeks', Monthly: 'last 12 months', Yearly: 'by year' };

function Ring({ pct }: { pct: number }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#dcb45e" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><div className="text-3xl font-semibold tabular-nums">{pct}%</div><div className="text-[11px] text-sea-200">occupied</div></div>
      </div>
    </div>
  );
}
const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="flex items-center gap-3">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-brass-400">{icon}</span>
    <div><div className="text-xl font-semibold leading-none tabular-nums">{value}</div><div className="mt-1 text-xs text-sea-200">{label}</div></div>
  </div>
);

export default function Dashboard({ store }: { store: Store }) {
  const { today, rev, byDate, bookings } = store;
  const [period, setPeriod] = useState<Period>('Daily');
  const y = today.getFullYear(), mo = today.getMonth();
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';

  const k = useMemo(() => {
    const tk = key(today);
    const wkStart = addDays(today, -((today.getDay() + 6) % 7));
    const ms = new Date(y, mo, 1, 12), me = new Date(y, mo + 1, 0, 12);
    const live = bookings.filter((b) => b.status !== 'Cancelled');
    const inMonth = live.filter((b) => b.checkIn >= key(ms) && b.checkIn <= key(me));
    const pend = live.filter((b) => b.checkIn >= tk && b.pay === 'Pending');
    const booked = (byDate[tk] || []).length;
    return {
      day: rev[tk] || 0, yday: rev[key(addDays(today, -1))] || 0,
      week: sumRange(rev, wkStart, addDays(wkStart, 6)), month: sumRange(rev, ms, me),
      year: sumRange(rev, new Date(y, 0, 1, 12), new Date(y, 11, 31, 12)),
      prevMonth: sumRange(rev, new Date(y, mo - 1, 1, 12), new Date(y, mo, 0, 12)),
      booked, avail: TOTAL_ROOMS - booked,
      arrivals: live.filter((b) => b.checkIn === tk).length,
      departures: live.filter((b) => key(addDays(parse(b.checkIn), b.nights)) === tk).length,
      monthCount: inMonth.length, monthLeft: inMonth.filter((b) => b.checkIn > tk).length,
      yearCount: live.filter((b) => b.checkIn.startsWith(String(y))).length,
      pendN: pend.length, pendAmt: pend.reduce((s, b) => s + b.rate * b.nights, 0), inMonth,
    };
  }, [store]); // eslint-disable-line

  const series = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    if (period === 'Daily') for (let i = 29; i >= 0; i--) { const d = addDays(today, -i); out.push({ label: fmtShort(d), value: rev[key(d)] || 0 }); }
    if (period === 'Weekly') for (let w = 11; w >= 0; w--) { const e = addDays(today, -w * 7), s = addDays(e, -6); out.push({ label: fmtShort(s), value: sumRange(rev, s, e) }); }
    if (period === 'Monthly') for (let m = 11; m >= 0; m--) {
      const f = new Date(y, mo - m, 1, 12), l = new Date(y, mo - m + 1, 0, 12);
      out.push({ label: f.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), value: sumRange(rev, f, l) });
    }
    if (period === 'Yearly') for (let yr = 2024; yr <= y; yr++) out.push({ label: String(yr), value: sumRange(rev, new Date(yr, 0, 1, 12), new Date(yr, 11, 31, 12)) });
    return out;
  }, [period, store]); // eslint-disable-line
  const total = series.reduce((s, x) => s + x.value, 0);
  const spark = Array.from({ length: 14 }, (_, i) => ({ value: rev[key(addDays(today, i - 13))] || 0 }));

  const chans = CHANNEL_IDS.map((id) => {
    const l = k.inMonth.filter((b) => b.channel === id);
    return { id, name: CHANNELS[id].name, color: CHANNELS[id].color, count: l.length, value: l.reduce((s, b) => s + b.rate * b.nights, 0) };
  });
  const chanTotal = chans.reduce((s, c) => s + c.count, 0) || 1;
  const pays = (['Paid', 'Partial', 'Pending'] as const).map((p) => {
    const l = k.inMonth.filter((b) => b.pay === p);
    return { p, n: l.length, amt: l.reduce((s, b) => s + b.rate * b.nights, 0) };
  });
  const payMax = pays.reduce((s, x) => s + x.amt, 0) || 1;
  const payUi = [
    { label: 'Paid', icon: <CheckCircle2 size={16} />, bar: 'bg-emerald-500', tone: 'text-emerald-600' },
    { label: 'Part-paid', icon: <CircleDashed size={16} />, bar: 'bg-amber-400', tone: 'text-amber-600' },
    { label: 'Payment pending', icon: <AlertCircle size={16} />, bar: 'bg-rose-400', tone: 'text-rose-600' },
  ];
  const arrivals = bookings.filter((b) => b.checkIn >= key(today) && b.status !== 'Cancelled').sort((a, b) => a.checkIn.localeCompare(b.checkIn)).slice(0, 7);
  const occ = Math.round((k.booked / TOTAL_ROOMS) * 100);
  const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
  const tip = { contentStyle: { borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(6,32,29,.18)', fontSize: 12 }, formatter: (v: any) => [money(Number(v)), 'Revenue'] as [string, string] };

  return (
    <div className="space-y-5">
      {/* hero */}
      <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-ink-900 via-ink-800 to-sea-700 p-6 text-white shadow-lift sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brass-500/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <p className="text-sm text-sea-200">{greet}. Here is Emerald Bay today.</p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="text-5xl font-semibold leading-none tracking-tight tabular-nums sm:text-6xl">{money(k.day)}</span>
              <Trend dark v={pct(k.day, k.yday)} />
            </div>
            <p className="mt-2 text-sm text-sea-200">Today&apos;s revenue · {money(k.yday)} yesterday</p>
            <div className="-mx-1 mt-5 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark}>
                  <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dcb45e" stopOpacity={0.45} /><stop offset="1" stopColor="#dcb45e" stopOpacity={0} /></linearGradient></defs>
                  <Area dataKey="value" stroke="#dcb45e" strokeWidth={2.5} fill="url(#hg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid items-center gap-6 rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/10 backdrop-blur sm:grid-cols-[auto_1fr]">
            <div className="mx-auto"><Ring pct={occ} /></div>
            <div className="space-y-4">
              <Stat icon={<BedDouble size={17} />} label="Rooms available today" value={k.avail} />
              <Stat icon={<LogIn size={17} />} label="Arriving today" value={k.arrivals} />
              <Stat icon={<LogOut size={17} />} label="Departing today" value={k.departures} />
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Revenue this week" value={money(k.week)} sub="Monday to Sunday" icon={<CalendarRange size={18} />} />
        <Kpi label="Revenue this month" value={money(k.month)} trend={pct(k.month, k.prevMonth)} sub={`${money(k.prevMonth)} last month`} icon={<TrendingUp size={18} />} />
        <Kpi label="Revenue this year" value={money(k.year)} sub="Includes future bookings" icon={<Wallet size={18} />} />
        <Kpi label="Bookings this month" value={String(k.monthCount)} sub={`${k.monthLeft} still to arrive`} icon={<CalendarCheck size={18} />} />
        <Kpi label="Bookings this year" value={String(k.yearCount)} sub={`${y} check-ins, excluding cancelled`} icon={<CalendarDays size={18} />} />
        <Kpi label="Payments pending" value={money(k.pendAmt)} sub={`${k.pendN} upcoming bookings unpaid`} icon={<AlertCircle size={18} />} tone="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHead icon={<TrendingUp size={18} />} title="Revenue" sub={`${money(total)} · ${PERIOD_LABEL[period]}`}
              right={<Segmented value={period} options={['Daily', 'Weekly', 'Monthly', 'Yearly'] as Period[]} onChange={setPeriod} />} />
            <div className="h-72 px-2 pb-4 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {period === 'Daily' ? (
                  <AreaChart data={series} margin={{ left: 8, right: 12 }}>
                    <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f7a6b" stopOpacity={0.35} /><stop offset="1" stopColor="#1f7a6b" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#e8f0ee" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b8782' }} interval={3} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b8782' }} tickFormatter={(v: number) => `$${v / 1000}k`} axisLine={false} tickLine={false} width={44} />
                    <Tooltip {...tip} />
                    <Area dataKey="value" stroke="#1f7a6b" strokeWidth={2.5} fill="url(#rg)" />
                  </AreaChart>
                ) : (
                  <BarChart data={series} margin={{ left: 8, right: 12 }}>
                    <defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f8f7f" /><stop offset="1" stopColor="#176054" /></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#e8f0ee" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b8782' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b8782' }} tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} width={48} />
                    <Tooltip {...tip} cursor={{ fill: '#f0f7f5' }} />
                    <Bar dataKey="value" fill="url(#rb)" radius={[8, 8, 0, 0]} maxBarSize={44} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHead icon={<CalendarCheck size={18} />} title="Next arrivals" sub="Upcoming check-ins with channel and payment" />
            <div className="overflow-x-auto pb-2">
              <table className="w-full min-w-[700px] text-left text-sm">
                <tbody>
                  {arrivals.map((b) => (
                    <tr key={b.id} className="border-t border-black/[0.05]">
                      <td className="px-5 py-3"><span className="flex items-center gap-3"><Avatar name={b.guest} /><span><span className="block font-medium">{b.guest}</span><span className="text-xs text-ink-700/60">{ROOMS.find((r) => r.id === b.room)?.name}{b.unit ? ` · Room ${b.unit}` : ''}</span></span></span></td>
                      <td className="py-3"><ChannelBadge id={b.channel} /></td>
                      <td className="py-3 text-ink-700/70">{fmtShort(parse(b.checkIn))} · {b.nights}n</td>
                      <td className="py-3"><StatusBadge s={b.status} /></td>
                      <td className="px-5 py-3 text-right"><PayBadge p={b.pay} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHead icon={<Share2 size={18} />} title="Where bookings come from" sub="This month's check-ins by channel" />
            <div className="space-y-4 p-5 pt-2">
              <div className="relative mx-auto h-40 w-40">
                <ResponsiveContainer><PieChart><Pie data={chans} dataKey="count" innerRadius={50} outerRadius={72} paddingAngle={3} cornerRadius={4} stroke="none">
                  {chans.map((c) => <Cell key={c.id} fill={c.color} />)}</Pie></PieChart></ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-2xl font-semibold tabular-nums">{chanTotal}</div><div className="text-[11px] text-ink-700/60">bookings</div></div></div>
              </div>
              <ul className="space-y-3">
                {chans.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <ChannelIcon id={c.id} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-[13px]"><span className="font-medium">{c.name}</span><span className="font-semibold tabular-nums">{c.count}</span></div>
                      <div className="mt-1 flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-black/[0.05]"><div className="h-1.5 rounded-full" style={{ width: `${(c.count / chanTotal) * 100}%`, background: c.color }} /></div><span className="w-16 text-right text-[11px] tabular-nums text-ink-700/60">{money(c.value)}</span></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHead icon={<Wallet size={18} />} title="Payment status" sub="Value of this month's bookings" />
            <div className="space-y-4 p-5 pt-2">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-black/[0.05]">
                {pays.map((x, i) => <span key={x.p} className={payUi[i].bar} style={{ width: `${(x.amt / payMax) * 100}%` }} />)}
              </div>
              {pays.map((x, i) => (
                <div key={x.p} className="flex items-center justify-between text-sm">
                  <span className={`flex items-center gap-2 font-medium ${payUi[i].tone}`}>{payUi[i].icon}<span className="text-ink-900">{payUi[i].label}</span></span>
                  <span className="font-semibold tabular-nums">{money(x.amt)} <span className="text-xs font-normal text-ink-700/60">({x.n})</span></span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead icon={<BedDouble size={18} />} title="Rooms available today" sub={`${k.avail} of ${TOTAL_ROOMS} rooms are free tonight`} />
            <ul className="space-y-5 p-5 pt-2">
              {ROOMS.map((r) => {
                const a = stayAvailability(store, r, [today]);
                return (
                  <li key={r.id}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="text-sm font-medium">{r.name}</span>
                      <span><b className={`text-xl font-semibold tabular-nums ${a.free === 0 ? 'text-rose-600' : ''}`}>{a.free}</b> <span className="text-xs text-ink-700/60">of {r.total} free</span></span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {a.units.map((u) => (
                        <span key={u.id} title={u.state === 'free' ? `Room ${u.id} is free` : `Room ${u.id} · ${u.bookings[0].guest} via ${CHANNELS[u.bookings[0].channel].name}`}
                          className={`grid h-6 w-[34px] place-items-center rounded-md text-[11px] font-semibold tabular-nums ${u.state === 'free' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 line-through'}`}>{u.id}</span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-4 border-t border-black/[0.05] px-5 py-3 text-[11px] text-ink-700/60">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-200" />Free</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-slate-200" />Occupied</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
