'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { UserProfile } from '@clerk/nextjs';
import { ApiKeysTab } from './tabs/api-keys-tab';
import { BillingTab } from './tabs/billing-tab';
import { DangerZoneTab } from './tabs/danger-zone-tab';

const TABS = [
  { id: 'api-keys', label: 'API Keys' },
  { id: 'billing', label: 'Billing' },
  { id: 'profile', label: 'Profile' },
  { id: 'danger-zone', label: 'Danger Zone' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function SettingsTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <div className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ProfileTab() {
  return <UserProfile routing="hash" />;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const activeTab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'api-keys';

  function handleTabChange(tab: TabId) {
    router.push(`/dashboard/settings?tab=${tab}`);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <SettingsTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      {activeTab === 'api-keys' && <ApiKeysTab />}
      {activeTab === 'billing' && <BillingTab />}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'danger-zone' && <DangerZoneTab />}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <h1 className="mb-6 text-2xl font-bold">Settings</h1>
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
