export type ChannelId = 'booking' | 'airbnb' | 'expedia' | 'agoda' | 'direct';
export type Status = 'Confirmed' | 'Pending' | 'Checked-in' | 'Checked-out' | 'Cancelled';
export type Pay = 'Paid' | 'Partial' | 'Pending' | 'Refunded';

export const CHANNELS: Record<ChannelId, { name: string; short: string; color: string; commission: number }> = {
  booking: { name: 'Booking.com', short: 'BK', color: '#2563eb', commission: 15 },
  airbnb: { name: 'Airbnb', short: 'AB', color: '#e11d48', commission: 3 },
  expedia: { name: 'Expedia', short: 'EX', color: '#d97706', commission: 18 },
  agoda: { name: 'Agoda', short: 'AG', color: '#7c3aed', commission: 17 },
  direct: { name: 'Direct', short: 'DR', color: '#0f766e', commission: 0 },
};
export const CHANNEL_IDS = Object.keys(CHANNELS) as ChannelId[];

const range = (from: number, n: number) => Array.from({ length: n }, (_, i) => String(from + i));
export const ROOMS = [
  { id: 'dbl', name: 'Deluxe Double', total: 12, base: 145, units: range(101, 12) },
  { id: 'twn', name: 'Superior Twin', total: 10, base: 125, units: range(201, 10) },
  { id: 'ovs', name: 'Ocean View Suite', total: 6, base: 260, units: range(301, 6) },
  { id: 'fam', name: 'Family Room', total: 8, base: 190, units: range(401, 8) },
];
export const TOTAL_ROOMS = ROOMS.reduce((s, r) => s + r.total, 0);

export interface Booking {
  id: string; guest: string; room: string; channel: ChannelId; checkIn: string;
  nights: number; rate: number; status: Status; pay: Pay; unit?: string;
}
export interface Store {
  today: Date; bookings: Booking[];
  rev: Record<string, number>; byDate: Record<string, Booking[]>;
}

/* ---------- date + money helpers ---------- */
export const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
export const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const sumRange = (rev: Record<string, number>, from: Date, to: Date) => {
  let s = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) s += rev[key(d)] || 0;
  return s;
};
export const rateFor = (rates: Record<string, number>, room: { id: string; base: number }, k: string) => {
  const o = rates[`${room.id}|${k}`];
  if (o !== undefined) return o;
  const dow = parse(k).getDay();
  return Math.round((room.base * (dow === 5 || dow === 6 ? 1.12 : 1)) / 5) * 5;
};

/* ---------- deterministic demo data ---------- */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const FIRST = ['Amelia','Noah','Sofia','Liam','Mei','Arjun','Hana','Lucas','Isla','Omar','Elena','Kenji','Priya','Oliver','Zara','Mateo','Nadia','Felix','Aisha','Daniel'];
const LAST = ['Perera','Fernando','Smith','Müller','Tanaka','Silva','Khan','Rossi','Brown','Dubois','Nguyen','Patel','Jensen','Garcia','Wong','Ivanov'];

function generate(today: Date): Booking[] {
  const r = mulberry32(11);
  const occ: Record<string, number> = {};
  const busy: Record<string, string> = {}; // room number -> date it becomes free
  const out: Booking[] = [];
  let n = 1000;
  const end = addDays(today, 80);
  const roomPool = ROOMS.flatMap((x) => Array(x.total).fill(x) as typeof ROOMS);
  const chPool: ChannelId[] = ['booking','booking','booking','booking','airbnb','expedia','expedia','agoda','agoda','direct','direct'];
  for (let d = new Date(2024, 0, 1, 12); d <= end; d = addDays(d, 1)) {
    const m = d.getMonth(), dow = d.getDay();
    const season = [0, 1, 2, 11, 6, 7].includes(m) ? 1.2 : 0.85;
    const wk = dow === 5 || dow === 6 ? 1.25 : 1;
    const ahead = Math.max(0, (d.getTime() - today.getTime()) / 864e5);
    const far = Math.max(0.35, 1 - ahead / 110);
    const count = Math.round((5 + r() * 3) * season * wk * far);
    for (let i = 0; i < count; i++) {
      const room = roomPool[Math.floor(r() * roomPool.length)];
      const nights = 1 + Math.floor(r() * r() * 7);
      const ci = d, co = addDays(d, nights);
      const cancelled = r() < (co <= today ? 0.07 : 0.1);
      let unit: string | undefined;
      if (!cancelled) {
        let ok = true;
        for (let k = 0; k < nights; k++) if ((occ[`${room.id}|${key(addDays(ci, k))}`] || 0) >= room.total) ok = false;
        if (!ok) continue;
        unit = room.units.find((u) => (busy[u] || '') <= key(ci));
        if (!unit) continue;
        busy[unit] = key(co);
        for (let k = 0; k < nights; k++) { const kk = `${room.id}|${key(addDays(ci, k))}`; occ[kk] = (occ[kk] || 0) + 1; }
      }
      let status: Status, pay: Pay;
      if (cancelled) { status = 'Cancelled'; pay = 'Refunded'; }
      else if (co <= today) { status = 'Checked-out'; pay = r() < 0.97 ? 'Paid' : 'Partial'; }
      else if (ci <= today) { status = 'Checked-in'; pay = r() < 0.8 ? 'Paid' : 'Partial'; }
      else {
        status = r() < 0.72 ? 'Confirmed' : 'Pending';
        const x = r();
        pay = status === 'Pending' ? 'Pending' : x < 0.35 ? 'Paid' : x < 0.6 ? 'Partial' : 'Pending';
      }
      const rate = Math.round((room.base * (season > 1 ? 1.1 : 0.95) * (0.9 + r() * 0.25)) / 5) * 5;
      out.push({
        id: `EB-${n++}`, guest: `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`,
        room: room.id, channel: chPool[Math.floor(r() * chPool.length)], checkIn: key(ci), nights, rate, status, pay, unit,
      });
    }
  }
  return out;
}

export function buildStore(today: Date): Store {
  const bookings = generate(today);
  const rev: Record<string, number> = {};
  const byDate: Record<string, Booking[]> = {};
  for (const b of bookings) {
    if (b.status === 'Cancelled') continue;
    const ci = parse(b.checkIn);
    for (let i = 0; i < b.nights; i++) {
      const k = key(addDays(ci, i));
      rev[k] = (rev[k] || 0) + b.rate;
      if (!byDate[k]) byDate[k] = [];
      byDate[k].push(b);
    }
  }
  return { today, bookings, rev, byDate };
}

/* ---------- availability for a stay (rooms free on EVERY night) ---------- */
export type UnitState = 'free' | 'partial' | 'booked';
export interface UnitInfo { id: string; state: UnitState; freeNights: number; bookings: Booking[] }

export function stayAvailability(store: Store, room: { id: string; total: number; units: string[] }, nights: Date[]) {
  const per = nights.map((d) => store.byDate[key(d)] || []);
  const units: UnitInfo[] = room.units.map((id) => {
    const hit: Booking[] = [];
    let busyNights = 0;
    per.forEach((list) => {
      const b = list.find((x) => x.room === room.id && x.unit === id);
      if (b) { busyNights++; if (!hit.includes(b)) hit.push(b); }
    });
    const state: UnitState = busyNights === 0 ? 'free' : busyNights === nights.length ? 'booked' : 'partial';
    return { id, state, freeNights: nights.length - busyNights, bookings: hit };
  });
  const nightly = per.map((list) => room.total - list.filter((x) => x.room === room.id).length);
  return { units, nightly, free: units.filter((u) => u.state === 'free').length };
}
