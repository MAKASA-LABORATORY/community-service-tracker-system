import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";

type ServiceRequest = {
  id: string;
  created_at: string;
  service_type: string;
  description: string;
  location: string;
  supervisor_name: string;
  supervisor_email: string;
  status: 'pending' | 'approved' | 'rejected';
  total_hours: number;
  remaining_hours: number;
  start_date: string;
  end_date: string;
};

type Student = {
  id: string;
  name: string;
  student_id: string;
  remaining_hours: number;
  status: string;
};

type ServiceAssignment = {
  id: string;
  student_id: string;
  hours: number;
  students: {
    name: string;
  } | null;
};

const ServiceRequests = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [assignHours, setAssignHours] = useState<number>(0);
  const [assignDate, setAssignDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (assignDialogOpen) {
      fetchStudents();
    }
  }, [assignDialogOpen]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch service requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Service request ${newStatus} successfully`,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      // First, check if there are any service assignments for this request
      const { data: assignments, error: checkError } = await supabase
        .from('service_assignments')
        .select('id, student_id, hours, students(name)')
        .eq('service_request_id', requestId);

      if (checkError) throw checkError;

      // If there are assignments, we need to handle them
      if (assignments && assignments.length > 0) {
        let returnedHoursSummary = [];
        
        // For each assignment, return the hours to the student
        for (const assignment of (assignments as unknown as ServiceAssignment[])) {
          // Get the student's current remaining hours
          const { data: studentData, error: studentFetchError } = await supabase
            .from('students')
            .select('remaining_hours')
            .eq('id', assignment.student_id)
            .single();

          if (studentFetchError) throw studentFetchError;

          // Calculate new remaining hours
          const newRemainingHours = (studentData?.remaining_hours || 0) + assignment.hours;

          // Update student's remaining hours
          const { error: studentUpdateError } = await supabase
            .from('students')
            .update({ remaining_hours: newRemainingHours })
            .eq('id', assignment.student_id);

          if (studentUpdateError) throw studentUpdateError;

          // Add to summary
          returnedHoursSummary.push({
            studentName: assignment.students?.name || 'Unknown Student',
            hours: assignment.hours
          });
        }

        // Delete all assignments for this request
        const { error: deleteAssignmentsError } = await supabase
          .from('service_assignments')
          .delete()
          .eq('service_request_id', requestId);

        if (deleteAssignmentsError) throw deleteAssignmentsError;

        // Create a detailed message about returned hours
        const summaryMessage = returnedHoursSummary
          .map(summary => `${summary.studentName}: ${summary.hours} hours`)
          .join(', ');

        toast({
          title: "Success",
          description: `Service request removed. Hours returned to students: ${summaryMessage}`,
        });
      } else {
        // If no assignments, just delete the request
        const { error } = await supabase
          .from('service_requests')
          .delete()
          .eq('id', requestId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Service request removed successfully",
        });
      }

      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to remove service request",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
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

  const filteredRequests = requests.filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.service_type.toLowerCase().includes(searchLower) ||
      request.description.toLowerCase().includes(searchLower) ||
      request.supervisor_name.toLowerCase().includes(searchLower) ||
      request.location.toLowerCase().includes(searchLower)
    );
  });

  const handleAssignStudent = async () => {
    if (!selectedRequest || !selectedStudent || assignHours <= 0) return;

    try {
      const student = students.find(s => s.id === selectedStudent);
      if (!student) throw new Error("Student not found");

      // Validate that assigned hours don't exceed student's remaining hours
      if (assignHours > student.remaining_hours) {
        toast({
          title: "Error",
          description: `Cannot assign ${assignHours} hours. Student only has ${student.remaining_hours} remaining hours available.`,
          variant: "destructive",
        });
        return;
      }

      // Validate that assigned hours don't exceed service request's remaining hours
      if (assignHours > selectedRequest.remaining_hours) {
        toast({
          title: "Error",
          description: `Cannot assign ${assignHours} hours. Service request only has ${selectedRequest.remaining_hours} remaining hours available.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('service_assignments')
        .insert([
          {
            student_id: selectedStudent,
            service_request_id: selectedRequest.id,
            service_type: selectedRequest.service_type,
            description: selectedRequest.description,
            start_date: assignDate,
            end_date: selectedRequest.end_date,
            status: 'pending',
            hours: assignHours,
            location: selectedRequest.location,
            supervisor: selectedRequest.supervisor_name,
            supervisor_email: selectedRequest.supervisor_email,
            verification_status: 'pending'
          }
        ]);

      if (error) throw error;

      // Update student's remaining hours
      const newStudentRemainingHours = student.remaining_hours - assignHours;
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({ remaining_hours: newStudentRemainingHours })
        .eq('id', selectedStudent);

      if (studentUpdateError) throw studentUpdateError;

      // Update service request's remaining hours
      const newRequestRemainingHours = selectedRequest.remaining_hours - assignHours;
      const { error: requestUpdateError } = await supabase
        .from('service_requests')
        .update({ remaining_hours: newRequestRemainingHours })
        .eq('id', selectedRequest.id);

      if (requestUpdateError) throw requestUpdateError;

      toast({
        title: "Success",
        description: `Student assigned to service request successfully with ${assignHours} hours.`,
      });

      setAssignDialogOpen(false);
      setSelectedStudent("");
      setAssignHours(0);
      setAssignDate(new Date().toISOString().split('T')[0]);
      fetchRequests();
    } catch (error) {
      console.error('Error assigning student:', error);
      toast({
        title: "Error",
        description: "Failed to assign student to service request",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Service Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Remaining Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.service_type}
                    </TableCell>
                    <TableCell>{request.location}</TableCell>
                    <TableCell>{request.supervisor_name}</TableCell>
                    <TableCell>{request.supervisor_email}</TableCell>
                    <TableCell>{request.total_hours}</TableCell>
                    <TableCell>{request.remaining_hours}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setViewDialogOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleStatusUpdate(request.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {(request.status === 'rejected' || request.status === 'approved') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedRequest(request);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No service requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

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
                  <h3 className="font-medium">Status</h3>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <h3 className="font-medium">Total Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.total_hours} hours
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Remaining Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.remaining_hours} hours
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.location}
                  </p>
                </div>
                <div className="col-span-2">
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.description}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Supervisor</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.supervisor_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.supervisor_email}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Date Range</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedRequest.start_date).toLocaleDateString()} to{" "}
                    {new Date(selectedRequest.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {selectedRequest?.status === 'approved' && (
              <Button
                onClick={() => {
                  setAssignDialogOpen(true);
                  setViewDialogOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Assign Student
              </Button>
            )}
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Student Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Student to Service</DialogTitle>
            <DialogDescription>
              Select a student and specify hours to assign to this service request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="student">Select Student</Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.student_id}) - {student.remaining_hours} hours remaining
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hours">Hours to Assign</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max={selectedRequest?.remaining_hours}
                step="0.5"
                value={assignHours}
                onChange={(e) => setAssignHours(parseFloat(e.target.value) || 0)}
                placeholder="Enter hours to assign"
              />
              <p className="text-sm text-muted-foreground">
                Maximum hours available: {selectedRequest?.remaining_hours}
                {selectedStudent && ` (Student has ${students.find(s => s.id === selectedStudent)?.remaining_hours} hours remaining)`}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assign-date">Assignment Date</Label>
              <Input
                id="assign-date"
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                max={selectedRequest?.end_date}
              />
              <p className="text-sm text-muted-foreground">
                Service period: {new Date(selectedRequest?.start_date || '').toLocaleDateString()} to {new Date(selectedRequest?.end_date || '').toLocaleDateString()}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssignDialogOpen(false);
              setSelectedStudent("");
              setAssignHours(0);
              setAssignDate(new Date().toISOString().split('T')[0]);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignStudent} 
              disabled={!selectedStudent || assignHours <= 0}
            >
              Assign Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Service Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this {selectedRequest?.status} service request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleDeleteRequest(selectedRequest.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ServiceRequests; 