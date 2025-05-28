import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, CheckCircle, AlertCircle, Plus, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
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

type StudentProgress = {
  id: string;
  name: string;
  student_id: string;
  total_hours: number;
  completed_hours: number;
  progress_percentage: number;
  assignments: {
    id: string;
    hours: number;
    start_date: string;
    status: string;
    student_id: string;
  }[];
};

type ServiceRequest = {
  id: string;
  service_type: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  supervisor_name: string;
  supervisor_email: string;
  total_hours: number;
  location: string;
};

type Student = {
  id: string;
  name: string;
  student_id: string;
  remaining_hours: number;
};

type ServiceAssignmentResponse = {
  id: string;
  student_id: string;
  hours: number;
  status: string;
  start_date: string;
  students: {
    id: string;
    name: string;
    student_id: string;
    remaining_hours: number;
  } | null;
};

const SupervisorDashboard = () => {
  const [open, setOpen] = React.useState(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<ServiceRequest | null>(null);
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [recentRequests, setRecentRequests] = useState<ServiceRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    hoursCompleted: 0,
    approvedRequests: 0,
    pendingReviews: 0
  });
  const { toast } = useToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'cancel' | 'complete' | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

  const serviceTypes = [
    'Campus Clean-up',
    'Library Assistance',
    'Student Tutoring',
    'Event Support',
    'Campus Tour Guide',
    'Administrative Support',
    'IT Help Desk',
    'Campus Media Support',
    'Student Organization Support',
    'Campus Sustainability'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch students who have service assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('service_assignments')
        .select('id, student_id, hours, status, start_date, students (id, name, student_id, remaining_hours)');

      if (assignmentsError) throw assignmentsError;

      // Get unique students from assignments
      const uniqueStudents = new Map<string, Student>();
      const typedAssignments = (assignments || []) as unknown as ServiceAssignmentResponse[];
      typedAssignments.forEach(assignment => {
        if (assignment.students && !uniqueStudents.has(assignment.students.id)) {
          uniqueStudents.set(assignment.students.id, assignment.students);
        }
      });

      // Calculate student progress
      const progress = Array.from(uniqueStudents.values()).map(student => {
        const studentAssignments = typedAssignments.filter(a => a.student_id === student.id);
        const completedHours = studentAssignments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + a.hours, 0);
        const totalAssignedHours = studentAssignments
          .reduce((sum, a) => sum + a.hours, 0);
        const progressPercentage = totalAssignedHours > 0 
          ? (completedHours / totalAssignedHours) * 100 
          : 0;

        return {
          id: student.id,
          name: student.name,
          student_id: student.student_id,
          total_hours: totalAssignedHours,
          completed_hours: completedHours,
          progress_percentage: progressPercentage,
          assignments: studentAssignments.map(a => ({
            id: a.id,
            hours: a.hours,
            start_date: a.start_date,
            status: a.status,
            student_id: a.student_id
          }))
        };
      });

      setStudentProgress(progress);

      // Fetch recent service requests
      const { data: requests, error: requestsError } = await supabase
        .from('service_requests')
        .select('id, service_type, description, status, created_at, supervisor_name, supervisor_email, total_hours, location')
        .order('created_at', { ascending: false })
        .limit(5);

      if (requestsError) throw requestsError;
      setRecentRequests(requests || []);

      // Calculate stats
      const stats = {
        totalStudents: uniqueStudents.size,
        hoursCompleted: assignments
          ?.filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + a.hours, 0) || 0,
        approvedRequests: requests.filter(r => r.status === 'approved').length,
        pendingReviews: requests.filter(r => r.status === 'pending').length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const serviceType = formData.get('service-type') as string;
      const hours = parseInt(formData.get('hours') as string);
      const location = formData.get('location') as string;
      const supervisorEmail = formData.get('supervisor-email') as string;
      const supervisorName = formData.get('supervisor-name') as string;

      const { error } = await supabase
        .from('service_requests')
        .insert([
          {
            service_type: serviceType,
            description: description,
            location: location,
            supervisor_email: supervisorEmail,
            supervisor_name: supervisorName,
            total_hours: hours,
            remaining_hours: hours,
            status: 'pending',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          }
        ]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Service request submitted successfully",
      });

      // Reset form and close dialog
      setDescription("");
      setOpen(false);
      
      // Reset form fields
      const form = e.currentTarget;
      if (form) {
        form.reset();
      }

      // Refresh dashboard data
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error submitting service request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit service request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleUpdateAssignmentStatus = (assignment: StudentProgress['assignments'][0], action: 'cancel' | 'complete') => {
    setSelectedAssignment(assignment);
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  const confirmUpdateStatus = async () => {
    if (!selectedAssignment || !actionType) return;
    
    try {
      const newStatus = actionType === 'cancel' ? 'cancelled' : 'completed';
      
      // If cancelling, handle returning hours to both student and service request
      if (actionType === 'cancel') {
        // Get student's current remaining hours
        const { data: studentData, error: studentFetchError } = await supabase
          .from('students')
          .select('remaining_hours')
          .eq('id', selectedAssignment.student_id)
          .single();

        if (studentFetchError) throw studentFetchError;

        // Calculate new remaining hours by adding back the cancelled hours
        const newRemainingHours = (studentData?.remaining_hours || 0) + selectedAssignment.hours;

        // Update student's remaining hours
        const { error: studentUpdateError } = await supabase
          .from('students')
          .update({ remaining_hours: newRemainingHours })
          .eq('id', selectedAssignment.student_id);

        if (studentUpdateError) throw studentUpdateError;

        // Get the service request ID and current remaining hours
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('service_assignments')
          .select('service_request_id')
          .eq('id', selectedAssignment.id)
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
          const newRequestRemainingHours = (requestData?.remaining_hours || 0) + selectedAssignment.hours;

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
        .eq('id', selectedAssignment.id);
        
      if (error) throw error;
      
      // Refresh the dashboard data
      fetchDashboardData();
      
      toast({
        title: "Success",
        description: actionType === 'cancel' 
          ? `Service activity cancelled and ${selectedAssignment.hours} hours returned to student and service request successfully`
          : "Service activity completed successfully",
      });
    } catch (error) {
      console.error(`Error ${actionType}ing activity:`, error);
      toast({
        title: "Error",
        description: `Failed to ${actionType} service activity`,
        variant: "destructive",
      });
    } finally {
      setConfirmDialogOpen(false);
      setSelectedAssignment(null);
      setActionType(null);
    }
  };

  const getFilteredStudents = () => {
    if (!searchQuery.trim()) return studentProgress;
    
    const query = searchQuery.toLowerCase().trim();
    return studentProgress.filter(student => 
      student.name.toLowerCase().includes(query) ||
      student.student_id.toLowerCase().includes(query)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Overview</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Submit Service Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Submit Service Request</DialogTitle>
              <DialogDescription>
                Fill out the form below to submit a new service request. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="service-type">Service Type</Label>
                  <Select name="service-type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="space-y-2">
                    <Textarea
                      id="description"
                      placeholder="Enter service description"
                      maxLength={100}
                      className="min-h-[100px] resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Maximum 100 characters
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {description.length}/100 characters
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    name="hours"
                    type="number"
                    min="1"
                    placeholder="Enter number of hours"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Enter service location"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supervisor-name">Supervisor Name</Label>
                  <Input
                    id="supervisor-name"
                    name="supervisor-name"
                    placeholder="Enter supervisor name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supervisor-email">Supervisor Email</Label>
                  <Input
                    id="supervisor-email"
                    name="supervisor-email"
                    type="email"
                    placeholder="Enter supervisor email"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Students under supervision
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoursCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Total service hours completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedRequests}</div>
            <p className="text-xs text-muted-foreground">
              Service requests approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Requests awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{request.supervisor_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.service_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
              {recentRequests.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent service requests</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Student Progress</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getFilteredStudents().map((student) => (
                <div key={student.id} className="flex flex-col gap-2 border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.completed_hours}/{student.total_hours} hours completed
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {student.progress_percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    {student.assignments.map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {new Date(assignment.start_date).toLocaleDateString()}
                          </span>
                          <Badge variant={assignment.status === 'completed' ? 'default' : 'outline'}>
                            {assignment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{assignment.hours} hours</span>
                          {assignment.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-500 border-red-500 hover:bg-red-50"
                                onClick={() => handleUpdateAssignmentStatus(assignment, 'cancel')}
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Cancel
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-500 border-green-500 hover:bg-green-50"
                                onClick={() => handleUpdateAssignmentStatus(assignment, 'complete')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Complete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {getFilteredStudents().length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {studentProgress.length === 0 
                    ? "No student progress data available" 
                    : "No students found matching your search"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Request Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service Request Details</DialogTitle>
            <DialogDescription>
              View the complete details of this service request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Service Type</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.service_type}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Total Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.total_hours} hours
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.location}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Submitted Date</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedRequest.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Supervisor Email</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.supervisor_email}
                  </p>
                </div>
                <div className="col-span-2">
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default SupervisorDashboard; 