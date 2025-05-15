import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, ClipboardCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  hoursTrend?: "up" | "down" | "neutral";
  studentsTrend?: "up" | "down" | "neutral";
  approvalsTrend?: "up" | "down" | "neutral";
}

const DashboardOverview = ({
  hoursTrend = "up",
  studentsTrend = "up",
  approvalsTrend = "down",
}: DashboardOverviewProps) => {
  const [totalHours, setTotalHours] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch total hours from all students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('total_hours');
        
      if (studentError) throw studentError;
      
      // Calculate total hours
      const totalStudentHours = studentData?.reduce((sum, student) => 
        sum + (student.total_hours || 0), 0) || 0;
        
      setTotalHours(totalStudentHours);
      
      // Fetch active students count
      const { count: activeStudentCount, error: activeError } = await supabase
        .from('students')
        .select('*', { count: 'exact' })
        .eq('status', 'active');
        
      if (activeError) throw activeError;
      
      setActiveStudents(activeStudentCount || 0);
      
      // Fetch pending approvals (service assignments that need verification)
      const { count: pendingCount, error: pendingError } = await supabase
        .from('service_assignments')
        .select('*', { count: 'exact' })
        .eq('verification_status', 'pending');
        
      if (pendingError) throw pendingError;
      
      setPendingApprovals(pendingCount || 0);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full bg-background p-4">
      <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Service Hours"
          value={loading ? "Loading..." : totalHours.toLocaleString()}
          icon={<Clock className="h-6 w-6 text-primary" />}
          change="+8.2% from last month"
          trend={hoursTrend}
        />
        <StatCard
          title="Active Students"
          value={loading ? "Loading..." : activeStudents.toLocaleString()}
          icon={<Users className="h-6 w-6 text-primary" />}
          change="+12.5% from last month"
          trend={studentsTrend}
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? "Loading..." : pendingApprovals.toLocaleString()}
          icon={<ClipboardCheck className="h-6 w-6 text-primary" />}
          change="-5.3% from last month"
          trend={approvalsTrend}
        />
      </div>
    </div>
  );
};

export default DashboardOverview;
