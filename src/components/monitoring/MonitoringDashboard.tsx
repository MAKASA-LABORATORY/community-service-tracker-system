import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  BarChart2,
  Activity,
  Search,
  Filter,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

type ServiceCategory = {
  name: string;
  hours: number;
  students: number;
};

// Database types
type ActivityData = {
  id: string;
  start_date: string;
  hours: number;
  service_type: string;
  supervisor: string;
  student_id: string;
  status?: string;
  students: {
    name: string;
  } | null;
};

// UI types
type Activity = {
  id: string;
  student: string;
  action: string;
  category: string;
  hours: number;
  timestamp: string;
  supervisor: string;
  status: string;
  student_id: string;
};

const MonitoringDashboard = () => {
  const [activeTab, setActiveTab] = React.useState<string>("activities");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activityView, setActivityView] = React.useState<string>("ongoing");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeStudents: 0,
    totalHours: 0,
    completionRate: "0%",
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'cancel' | 'complete' | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      
      // Fetch active students count
      const { count: activeStudentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Fetch total service hours
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_assignments')
        .select('hours, status');

      if (serviceError) throw serviceError;

      const totalHours = serviceData?.reduce((sum, record) => sum + (record.hours || 0), 0) || 0;
      
      // Calculate completed hours (where status is 'completed')
      const completedHours = serviceData?.reduce((sum, record) => 
        record.status === 'completed' ? sum + (record.hours || 0) : sum, 0) || 0;
      
      // Calculate completion rate
      const completionRate = totalHours > 0 
        ? Math.round((completedHours / totalHours) * 100) 
        : 0;

      // Fetch service categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('service_assignments')
        .select('service_type, hours, student_id');

      if (categoryError) throw categoryError;

      // Process categories data
      const categoryMap = new Map<string, { hours: number; students: Set<string> }>();
      categoryData?.forEach(record => {
        const existing = categoryMap.get(record.service_type) || { hours: 0, students: new Set() };
        categoryMap.set(record.service_type, {
          hours: existing.hours + (record.hours || 0),
          students: existing.students.add(record.student_id)
        });
      });

      const processedCategories = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        hours: data.hours,
        students: data.students.size
      }));

      // Fetch recent activities
      const { data: activityData, error: activityError } = await supabase
        .from('service_assignments')
        .select(`
          id,
          start_date,
          hours,
          service_type,
          supervisor,
          status,
          student_id,
          students (
            name
          )
        `)
        .order('start_date', { ascending: false })
        .limit(20);

      if (activityError) throw activityError;

      const processedActivities: Activity[] = ((activityData || []) as unknown as ActivityData[]).map(record => ({
        id: record.id,
        student: record.students?.name || 'Unknown',
        student_id: record.student_id,
        action: 'Assigned service hours',
        category: record.service_type,
        hours: record.hours || 0,
        timestamp: new Date(record.start_date).toLocaleDateString(),
        supervisor: record.supervisor || 'Not assigned',
        status: record.status || 'pending'
      }));

      // Update state
      setMetrics({
        activeStudents: activeStudentsCount || 0,
        totalHours,
        completionRate: `${completionRate}%`,
      });
      setCategories(processedCategories);
      setActivities(processedActivities);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActivityStatus = (activity: Activity, action: 'cancel' | 'complete') => {
    setSelectedActivity(activity);
    setActionType(action);
    setConfirmDialogOpen(true);
  };
  
  const confirmUpdateStatus = async () => {
    if (!selectedActivity || !actionType) return;
    
    try {
      const newStatus = actionType === 'cancel' ? 'cancelled' : 'completed';
      
      // If cancelling, first get the student's current remaining hours and service request details
      if (actionType === 'cancel') {
        // Get student's current remaining hours
        const { data: studentData, error: studentFetchError } = await supabase
          .from('students')
          .select('remaining_hours')
          .eq('id', selectedActivity.student_id)
          .single();

        if (studentFetchError) throw studentFetchError;

        // Calculate new remaining hours by adding back the cancelled hours
        const newRemainingHours = (studentData?.remaining_hours || 0) + selectedActivity.hours;

        // Update student's remaining hours
        const { error: studentUpdateError } = await supabase
          .from('students')
          .update({ remaining_hours: newRemainingHours })
          .eq('id', selectedActivity.student_id);

        if (studentUpdateError) throw studentUpdateError;

        // Get the service request ID and current remaining hours
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('service_assignments')
          .select('service_request_id')
          .eq('id', selectedActivity.id)
          .single();

        if (assignmentError) throw assignmentError;

        if (assignmentData?.service_request_id) {
          // Get the service request's current remaining hours
          const { data: requestData, error: requestFetchError } = await supabase
            .from('service_requests')
            .select('remaining_hours')
            .eq('id', assignmentData.service_request_id)
            .single();

          if (requestFetchError) throw requestFetchError;

          // Calculate new remaining hours for the service request
          const newRequestRemainingHours = (requestData?.remaining_hours || 0) + selectedActivity.hours;

          // Update service request's remaining hours
          const { error: requestUpdateError } = await supabase
            .from('service_requests')
            .update({ remaining_hours: newRequestRemainingHours })
            .eq('id', assignmentData.service_request_id);

          if (requestUpdateError) throw requestUpdateError;
        }
      }
      
      // Update the service assignment status
      const { error } = await supabase
        .from('service_assignments')
        .update({ 
          status: newStatus,
          ...(actionType === 'complete' ? { end_date: new Date().toISOString().split('T')[0] } : {})
        })
        .eq('id', selectedActivity.id);
        
      if (error) throw error;
      
      // If completed, update student's status if needed
      if (actionType === 'complete') {
        // Check if student has any other pending assignments
        const { data, error: checkError } = await supabase
          .from('service_assignments')
          .select('id')
          .eq('student_id', selectedActivity.student_id)
          .eq('status', 'pending');
          
        if (checkError) throw checkError;
        
        if (!data || data.length === 0) {
          // No more pending assignments, update student status to active
          const { error: studentError } = await supabase
            .from('students')
            .update({ status: 'active' })
            .eq('id', selectedActivity.student_id);
            
          if (studentError) throw studentError;
        }
      }
      
      // Update local state
      setActivities(prevActivities => 
        prevActivities.map(activity => 
          activity.id === selectedActivity.id 
            ? { ...activity, status: newStatus } 
            : activity
        )
      );
      
      toast({
        title: "Success",
        description: actionType === 'cancel' 
          ? `Service activity cancelled and ${selectedActivity.hours} hours returned to student and service request successfully`
          : "Service activity completed successfully",
      });

      // Refresh the monitoring data to update metrics
      fetchMonitoringData();
    } catch (error) {
      console.error(`Error ${actionType}ing activity:`, error);
      toast({
        title: "Error",
        description: `Failed to ${actionType} service activity`,
        variant: "destructive",
      });
    } finally {
      setConfirmDialogOpen(false);
      setSelectedActivity(null);
      setActionType(null);
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "pending":
      default:
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
    }
  };

  // Filter activities based on the current view (ongoing or completed)
  const getFilteredActivities = () => {
    const ongoingStatuses = ['pending', 'in_progress'];
    const completedStatuses = ['completed', 'cancelled'];
    
    return activities.filter(activity => {
      // Filter by search query first
      const matchesSearch = 
        activity.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.supervisor.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Then filter by status based on the selected view
      const matchesStatus = activityView === 'ongoing' 
        ? ongoingStatuses.includes(activity.status)
        : completedStatuses.includes(activity.status);
        
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="bg-primary/10 p-2 rounded-full">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Active Students</p>
              <h3 className="text-2xl font-bold">{metrics.activeStudents}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="bg-primary/10 p-2 rounded-full">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Total Service Hours</p>
              <h3 className="text-2xl font-bold">{metrics.totalHours}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="bg-primary/10 p-2 rounded-full">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <h3 className="text-2xl font-bold">{metrics.completionRate}</h3>
            </div>
          </CardContent>
        </Card>
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
      </div>

      <Tabs
        defaultValue="activities"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="activities">
            <Activity className="h-4 w-4 mr-2" /> Activities
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Filter className="h-4 w-4 mr-2" /> Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Activities</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-2">View:</span>
                <Tabs
                  value={activityView}
                  onValueChange={setActivityView}
                  className="w-[300px]"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredActivities().map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col border-b pb-4 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{activity.student}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.action} • {activity.timestamp}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supervisor: {activity.supervisor}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{activity.category}</Badge>
                          {getStatusBadge(activity.status)}
                        </div>
                        <p className="text-sm font-medium mt-1">{activity.hours} hours</p>
                      </div>
                    </div>
                    
                    {activity.status === 'pending' && activityView === 'ongoing' && (
                      <div className="flex justify-end gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 border-red-500 hover:bg-red-50"
                          onClick={() => handleUpdateActivityStatus(activity, 'cancel')}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-500 border-green-500 hover:bg-green-50"
                          onClick={() => handleUpdateActivityStatus(activity, 'complete')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Complete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {getFilteredActivities().length === 0 && (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                  <AlertTriangle className="h-8 w-8 mb-2 text-amber-500" />
                  No activities found matching your criteria.
                </div>
              )}
              
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Categories</CardTitle>
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
                        {Math.round(category.hours / category.students)} avg per student
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Confirm Action Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'cancel' ? 'Cancel Service Activity' : 'Complete Service Activity'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'cancel' 
                ? 'Are you sure you want to cancel this service activity? This action cannot be undone.'
                : 'Are you sure this service activity has been completed? This will mark it as completed and update the record.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpdateStatus}
              className={actionType === 'cancel' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
            >
              {actionType === 'cancel' ? 'Yes, Cancel Activity' : 'Yes, Mark as Completed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MonitoringDashboard;
