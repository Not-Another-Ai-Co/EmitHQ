import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/nav';
import { AppsProvider } from '@/lib/apps-context';
import { Toaster } from 'sonner';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');
  } catch {
    redirect('/sign-in');
  }
  return (
    <div className="min-h-screen">
      <AppsProvider>
        <Sidebar />
        <MobileNav />
        <main className="ml-0 pb-20 md:ml-56 md:pb-0">
          <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
        </main>
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </AppsProvider>
    </div>
  );
}
