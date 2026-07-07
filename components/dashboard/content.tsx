"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import { WelcomeSection } from "./welcome-section";
import { StatsCards } from "./stats-cards";
import { LeadSourcesChart } from "./lead-sources-chart";
import { RevenueFlowChart } from "./revenue-flow-chart";
import { DealsTable } from "./deals-table";
import { RecentSales } from "./recent-sales";
import { ProductsCrud } from "./products-crud";
import { TransactionsList } from "./transactions-list";
import { SettingsPanel } from "./settings-panel";
import { ActivityLogs } from "./activity-logs";

export function DashboardContent() {
  const activeTab = useDashboardStore((state) => state.activeTab);

  return (
    <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-background w-full">
      <div className={activeTab === "dashboard" ? "space-y-4 sm:space-y-6" : "hidden"}>
        <WelcomeSection />
        <StatsCards />
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
          <LeadSourcesChart />
          <RevenueFlowChart />
        </div>
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
          <div className="flex-1 xl:max-w-[65%] min-w-0">
            <DealsTable />
          </div>
          <div className="w-full xl:max-w-[35%] shrink-0 min-w-0">
            <RecentSales />
          </div>
        </div>
      </div>
      
      <div className={activeTab === "products" ? "" : "hidden"}>
        <ProductsCrud />
      </div>
      
      <div className={activeTab === "transactions" ? "" : "hidden"}>
        <TransactionsList />
      </div>

      <div className={activeTab === "logs" ? "" : "hidden"}>
        <ActivityLogs />
      </div>
      
      <div className={activeTab === "settings" ? "" : "hidden"}>
        <SettingsPanel />
      </div>
    </main>
  );
}

