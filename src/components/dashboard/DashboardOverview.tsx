import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, ClipboardCheck } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

const StatCard = ({
  title,
  value,
  icon,
  change,
  trend = "neutral",
}: StatCardProps) => {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {change && (
              <p className="text-xs mt-1">
                <span
                  className={`inline-flex items-center ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"}`}
                >
                  {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {change}
                </span>
              </p>
            )}
          </div>
          <div className="p-2 rounded-full bg-primary/10">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DashboardOverviewProps {
  totalHours?: number;
  activeStudents?: number;
  pendingApprovals?: number;
  hoursTrend?: "up" | "down" | "neutral";
  studentsTrend?: "up" | "down" | "neutral";
  approvalsTrend?: "up" | "down" | "neutral";
}

const DashboardOverview = ({
  totalHours = 12450,
  activeStudents = 328,
  pendingApprovals = 42,
  hoursTrend = "up",
  studentsTrend = "up",
  approvalsTrend = "down",
}: DashboardOverviewProps) => {
  return (
    <div className="w-full bg-background p-4">
      <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Service Hours"
          value={totalHours.toLocaleString()}
          icon={<Clock className="h-6 w-6 text-primary" />}
          change="+8.2% from last month"
          trend={hoursTrend}
        />
        <StatCard
          title="Active Students"
          value={activeStudents.toLocaleString()}
          icon={<Users className="h-6 w-6 text-primary" />}
          change="+12.5% from last month"
          trend={studentsTrend}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.toLocaleString()}
          icon={<ClipboardCheck className="h-6 w-6 text-primary" />}
          change="-5.3% from last month"
          trend={approvalsTrend}
        />
      </div>
    </div>
  );
};

export default DashboardOverview;
