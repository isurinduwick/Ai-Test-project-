'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Bell, BedDouble, CalendarDays, Check, DoorOpen, Gem, LayoutDashboard, Network, RefreshCw, Tag } from 'lucide-react';
import { CHANNEL_IDS, buildStore } from '@/lib/data';
import Dashboard from '@/components/Dashboard';
import CalendarView from '@/components/CalendarView';
import Availability from '@/components/Availability';
import Bookings from '@/components/Bookings';
import Rates from '@/components/Rates';
import Channels from '@/components/Channels';
import { ChannelIcon } from '@/components/ui';

const NAV = [
  { id: 'dash', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cal', label: 'Calendar', icon: CalendarDays },
  { id: 'avail', label: 'Availability', icon: DoorOpen },
  { id: 'book', label: 'Reservations', icon: BedDouble },
  { id: 'rates', label: 'Rates & availability', icon: Tag },
  { id: 'chan', label: 'Channels', icon: Network },
] as const;

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<(typeof NAV)[number]['id']>('dash');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => setMounted(true), []);
  const store = useMemo(() => (mounted ? buildStore(new Date(new Date().setHours(12, 0, 0, 0))) : null), [mounted]);
  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3200); };
  const syncAll = () => { setSyncing(true); setTimeout(() => { setSyncing(false); notify('All 5 channels are up to date'); }, 1400); };
  if (!store) return <div className="grid min-h-screen place-items-center"><Gem className="animate-pulse text-sea-600" size={32} /></div>;
  const current = NAV.find((n) => n.id === tab)!;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col self-start bg-gradient-to-b from-ink-900 to-ink-950 text-white lg:flex">
        <div className="flex items-center gap-3 px-6 pb-7 pt-8">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white shadow-lg shadow-black/30">
            <Image src="/icon-512.png" alt="Emerald Bay logo" width={40} height={40} className="h-full w-full scale-125 object-contain" priority />
          </span>
          <div><div className="text-[17px] font-semibold leading-tight tracking-tight">Emerald Bay</div><div className="text-xs text-sea-200/80">Channel Manager</div></div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition ${tab === id ? 'bg-white/[0.12] text-white' : 'text-sea-200/80 hover:bg-white/[0.06] hover:text-white'}`}>
              <Icon size={18} className={tab === id ? 'text-brass-400' : ''} />{label}
            </button>
          ))}
        </nav>
        <div className="m-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>All channels live
          </div>
          <div className="mt-3 flex -space-x-1.5">{CHANNEL_IDS.map((id) => <span key={id} className="rounded-lg ring-2 ring-ink-900"><ChannelIcon id={id} size={28} /></span>)}</div>
          <p className="mt-3 text-xs text-sea-200/80">Rates and availability are in sync.</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="flex gap-1 overflow-x-auto bg-ink-900 p-2 lg:hidden">
          {NAV.map(({ id, label }) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${tab === id ? 'bg-white text-ink-900' : 'text-sea-200'}`}>{label}</button>)}
        </div>
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/[0.05] bg-white/70 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div>
            <h1 className="text-[26px] font-semibold leading-none tracking-tight">{current.label}</h1>
            <p className="mt-1.5 text-sm text-ink-700/60">{store.today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={syncAll} disabled={syncing} className="flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-70">
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /><span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync all channels'}</span>
            </button>
            <button aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full bg-black/[0.05] hover:bg-black/10"><Bell size={17} /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /></button>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right text-xs leading-tight"><div className="font-semibold">Emerald Bay Resort</div><div className="text-ink-700/60">36 rooms · Negombo</div></div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brass-400 to-brass-600 text-sm font-semibold text-white">EB</div>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8">
          {tab === 'dash' && <Dashboard store={store} />}
          {tab === 'cal' && <CalendarView store={store} />}
          {tab === 'avail' && <Availability store={store} rates={rates} />}
          {tab === 'book' && <Bookings store={store} />}
          {tab === 'rates' && <Rates store={store} rates={rates} setRates={setRates} notify={notify} />}
          {tab === 'chan' && <Channels store={store} notify={notify} />}
        </div>
      </main>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink-900/95 py-2.5 pl-3 pr-5 text-sm font-medium text-white shadow-lift backdrop-blur">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500"><Check size={14} /></span>{toast}
        </div>
      )}
    </div>
  );
}
