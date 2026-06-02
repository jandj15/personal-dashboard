import Dashboard from "@/components/Dashboard";
import { loadDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { data } = await loadDashboardData();
  // Pass the server's clock so SSR and first client render agree (no hydration
  // mismatch); the client clock takes over after mount.
  return <Dashboard initial={data} serverNow={Date.now()} />;
}
