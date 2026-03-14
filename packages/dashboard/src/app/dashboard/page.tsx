import { auth } from '@clerk/nextjs/server';
import { StatCard } from '@/components/stat-card';
import { apiGet } from '@/lib/api';

interface Stats {
  data: {
    eventsToday: number;
    successRate: number;
    activeEndpoints: number;
    pendingRetries: number;
  };
}

export default async function OverviewPage() {
  const { getToken } = await auth();
  const appId = 'default'; // TODO: app selector once app CRUD exists

  let stats: Stats['data'] | null = null;
  try {
    const token = await getToken();
    const res = await apiGet<Stats>(`/api/v1/app/${appId}/stats`, { token: token ?? undefined });
    stats = res.data;
  } catch {
    // API unavailable — show placeholder
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Events Today"
          value={stats?.eventsToday ?? '—'}
          detail="Messages received today"
        />
        <StatCard
          label="Success Rate"
          value={stats ? `${stats.successRate}%` : '—'}
          detail="Last 24 hours"
        />
        <StatCard
          label="Active Endpoints"
          value={stats?.activeEndpoints ?? '—'}
          detail="Currently enabled"
        />
        <StatCard
          label="Pending Retries"
          value={stats?.pendingRetries ?? '—'}
          detail="Awaiting delivery"
        />
      </div>
    </div>
  );
}
