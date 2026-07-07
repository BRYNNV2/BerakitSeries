"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import { WelcomeSection } from "./welcome-section";
import { StatsCards } from "./stats-cards";
import { LeadSourcesChart } from "./lead-sources-chart";
import { RevenueFlowChart } from "./revenue-flow-chart";
import { DealsTable } from "./deals-table";
import { ProductsCrud } from "./products-crud";
import { TransactionsList } from "./transactions-list";

export function DashboardContent() {
  const activeTab = useDashboardStore((state) => state.activeTab);

  return (
    <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
      {activeTab === "dashboard" && (
        <>
          <WelcomeSection />
          <StatsCards />
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
            <LeadSourcesChart />
            <RevenueFlowChart />
          </div>
          <DealsTable />
        </>
      )}
      {activeTab === "products" && <ProductsCrud />}
      {activeTab === "transactions" && <TransactionsList />}
      {activeTab === "settings" && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold mb-2">Pengaturan</h2>
          <p className="text-muted-foreground text-sm">
            Halaman pengaturan BUMDes Berakit. Di sini Anda dapat mengonfigurasi profil toko desa, alamat pengiriman default, dan integrasi payment gateway.
          </p>
        </div>
      )}
    </main>
  );
}

