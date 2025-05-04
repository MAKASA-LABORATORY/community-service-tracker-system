import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  BarChart2,
  Activity,
  AlertCircle,
  Search,
  Filter,
  Clock,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MonitoringDashboard = () => {
  const [activeTab, setActiveTab] = React.useState<string>("overview");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedFilter, setSelectedFilter] = React.useState<string>("all");

  // Mock data for monitoring metrics
  const metrics = [
    {
      title: "Active Students",
      value: 248,
      change: "+12%",
      trend: "up",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Total Service Hours",
      value: 1842,
      change: "+8%",
      trend: "up",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: "Completion Rate",
      value: "76%",
      change: "+5%",
      trend: "up",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      title: "At Risk Students",
      value: 32,
      change: "-3%",
      trend: "down",
      icon: <AlertCircle className="h-4 w-4" />,
    },
  ];

  // Mock data for service categories
  const categories = [
    { name: "Community Outreach", hours: 620, students: 85 },
    { name: "Environmental", hours: 425, students: 62 },
    { name: "Tutoring", hours: 380, students: 45 },
    { name: "Healthcare", hours: 290, students: 38 },
    { name: "Arts & Culture", hours: 127, students: 18 },
  ];

  // Mock data for recent activities
  const activities = [
    {
      id: "1",
      student: "Jane Smith",
      action: "Completed service hours",
      category: "Community Outreach",
      hours: 5,
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      student: "John Doe",
      action: "Submitted new hours",
      category: "Environmental",
      hours: 3,
      timestamp: "4 hours ago",
    },
    {
      id: "3",
      student: "Alex Johnson",
      action: "Reached 50% completion",
      category: "Tutoring",
      hours: 2,
      timestamp: "Yesterday",
    },
    {
      id: "4",
      student: "Sarah Williams",
      action: "Completed all requirements",
      category: "Healthcare",
      hours: 4,
      timestamp: "Yesterday",
    },
    {
      id: "5",
      student: "Michael Brown",
      action: "Started new service project",
      category: "Community Outreach",
      hours: 0,
      timestamp: "2 days ago",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Service Monitoring Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="bg-primary/10 p-2 rounded-full">
                  {metric.icon}
                </div>
                <Badge
                  variant="outline"
                  className={`${metric.trend === "up" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {metric.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <h3 className="text-2xl font-bold">{metric.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities or students"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-3 w-full md:w-[500px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="activities">
            <Activity className="h-4 w-4 mr-2" /> Activities
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Filter className="h-4 w-4 mr-2" /> Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 3).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{activity.student}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.action} • {activity.timestamp}
                        </p>
                      </div>
                      <Badge variant="outline">{activity.category}</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4 p-0">
                  View all activities
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.slice(0, 4).map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.students} students
                        </p>
                      </div>
                      <Badge variant="outline">{category.hours} hours</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4 p-0">
                  View all categories
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{activity.student}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{activity.category}</Badge>
                      <p className="text-sm mt-1">
                        {activity.hours > 0 ? `${activity.hours} hours` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.students} active students
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{category.hours} hours</Badge>
                      <p className="text-sm mt-1">
                        {Math.round(category.hours / category.students)} avg per
                        student
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
