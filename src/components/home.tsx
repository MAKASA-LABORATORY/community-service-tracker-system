import React from "react";
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  BarChart2,
  Users,
  CheckSquare,
  FileText,
  Home,
  Activity,
  ClipboardList,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardOverview from "./dashboard/DashboardOverview";
import StudentTable from "./students/StudentTable";
import MonitoringDashboard from "./monitoring/MonitoringDashboard";
import ReportGenerator from "./reports/ReportGenerator";
import ServiceRequests from "./requests/ServiceRequests";
import SupervisorDashboard from "./supervisor/SupervisorDashboard";

const HomePage = () => {
  const [activeTab, setActiveTab] = React.useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <DashboardOverview />
          </div>
        );
      case "supervisor":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Supervisor Dashboard</h1>
            <SupervisorDashboard />
          </div>
        );
      case "students":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Student Management</h1>
            <StudentTable />
          </div>
        );
      case "requests":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Service Requests</h1>
            <ServiceRequests />
          </div>
        );
      case "monitoring":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Service Monitoring</h1>
            <MonitoringDashboard />
          </div>
        );
      case "reports":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Reports</h1>
            <ReportGenerator />
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <div className="grid gap-6">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-medium mb-4">Service Categories</h2>
                <p className="text-muted-foreground mb-4">
                  Manage service categories for student volunteer hours
                </p>
                <Button>Manage Categories</Button>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-medium mb-4">Hour Requirements</h2>
                <p className="text-muted-foreground mb-4">
                  Configure service hour requirements for students
                </p>
                <Button>Configure Requirements</Button>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-medium mb-4">Admin Users</h2>
                <p className="text-muted-foreground mb-4">
                  Manage administrator accounts and permissions
                </p>
                <Button>Manage Admins</Button>
              </div>
            </div>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <CheckSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Service Tracker</h1>
        </div>

        <nav className="space-y-1 flex-1">
          <Button
            variant={activeTab === "dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("dashboard")}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === "supervisor" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("supervisor")}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Supervisor
          </Button>
          <Button
            variant={activeTab === "students" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("students")}
          >
            <Users className="mr-2 h-4 w-4" />
            Students
          </Button>
          <Button
            variant={activeTab === "requests" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("requests")}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Service Requests
          </Button>
          <Button
            variant={activeTab === "monitoring" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("monitoring")}
          >
            <Activity className="mr-2 h-4 w-4" />
            Monitoring
          </Button>
          <Button
            variant={activeTab === "reports" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("reports")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </Button>
          <Button
            variant={activeTab === "settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>

        <div className="pt-4 border-t mt-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>System Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-end px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
                      alt="Admin"
                    />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">Admin User</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
};

export default HomePage;
