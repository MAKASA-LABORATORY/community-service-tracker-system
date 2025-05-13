import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Eye,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase, type Student, type ServiceHours } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
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

// Add new type for service assignments
type ServiceAssignment = {
  id: string;
  created_at: string;
  student_id: string;
  service_type: string;
  description: string;
  start_date: string;
  end_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  hours: number;
  location: string;
  supervisor: string;
  verification_status: 'pending' | 'verified' | 'rejected';
};

const StudentTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Student>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [addHoursDialogOpen, setAddHoursDialogOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [serviceTypes] = useState([
    'Community Outreach',
    'Environmental Service',
    'Educational Support',
    'Healthcare Assistance',
    'Youth Mentoring',
    'Elderly Care',
    'Food Bank Support',
    'Animal Shelter',
    'Cultural Events',
    'Other'
  ]);
  const [viewServiceDialogOpen, setViewServiceDialogOpen] = useState(false);
  const [studentAssignments, setStudentAssignments] = useState<ServiceAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'cancel' | 'complete' | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<ServiceAssignment | null>(null);

  // Fetch students from Supabase
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order(sortColumn, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      
      // Initialize remaining_hours for students that don't have it set
      const studentsWithRemainingHours = data?.map(student => {
        if (student.remaining_hours === undefined || student.remaining_hours === null) {
          return { ...student, remaining_hours: student.total_hours };
        }
        return student;
      }) || [];
      
      // Check each student for completed status criteria
      for (const student of studentsWithRemainingHours) {
        // Skip if already completed
        if (student.status === 'completed') continue;
        
        // Check if remaining hours are effectively 0 (handle floating point)
        const hasNoRemainingHours = student.remaining_hours < 0.001;
        
        if (hasNoRemainingHours) {
          // Check if the student has any pending assignments
          const { data: pendingAssignments, error: pendingError } = await supabase
            .from('service_assignments')
            .select('id')
            .eq('student_id', student.id)
            .in('status', ['pending', 'in_progress']);
            
          if (pendingError) {
            console.error('Error checking pending assignments:', pendingError);
            continue;
          }
          
          // If no pending assignments and zero hours remaining, update status to completed
          if (!pendingAssignments || pendingAssignments.length === 0) {
            // Update student status in the database
            const { error: updateError } = await supabase
              .from('students')
              .update({ status: 'completed' })
              .eq('id', student.id);
              
            if (updateError) {
              console.error('Error updating student status:', updateError);
              continue;
            }
            
            // Update the local student object
            student.status = 'completed';
            
            console.log(`Updated student ${student.name} status to completed - no hours remaining and no pending assignments`);
          }
        }
      }
      
      setStudents(studentsWithRemainingHours);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProgram =
        selectedProgram === "all" || student.program === selectedProgram;
      const matchesStatus =
        selectedStatus === "all" || student.status === selectedStatus;

      return matchesSearch && matchesProgram && matchesStatus;
    });

  // Get unique programs for filter
  const programs = [
    "all",
    ...new Set(students.map((student) => student.program)),
  ];

  const handleSort = (column: keyof Student) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: keyof Student) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Pending
          </Badge>
        );
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleAddHours = async (student: Student) => {
    setSelectedStudent(student);
    setAddHoursDialogOpen(true);
  };

  const handleViewServiceHours = async (student: Student) => {
    setSelectedStudent(student);
    setViewServiceDialogOpen(true);
    setLoadingAssignments(true);
    
    try {
      const { data, error } = await supabase
        .from('service_assignments')
        .select('*')
        .eq('student_id', student.id)
        .order('start_date', { ascending: false });
        
      if (error) throw error;
      setStudentAssignments(data || []);
    } catch (error) {
      console.error('Error fetching service assignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch service assignments",
        variant: "destructive",
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleAddStudent = async (formData: any) => {
    try {
      // First check if student ID already exists
      const { data: existingStudentId, error: idCheckError } = await supabase
        .from('students')
        .select('id')
        .eq('student_id', formData.studentId)
        .maybeSingle();
        
      if (idCheckError) throw idCheckError;
      
      if (existingStudentId) {
        toast({
          title: "Error",
          description: "Student ID already exists. Please use a different ID.",
          variant: "destructive",
        });
        return;
      }
      
      // Then check if email already exists
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('students')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();
        
      if (emailCheckError) throw emailCheckError;
      
      if (existingEmail) {
        toast({
          title: "Error",
          description: "Email already exists. Please use a different email address.",
          variant: "destructive",
        });
        return;
      }

      const totalHours = parseFloat(formData.total_hours) || 0;
      
      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            name: formData.name,
            student_id: formData.studentId,
            email: formData.email,
            program: formData.program,
            year: parseInt(formData.year),
            status: 'active',
            total_hours: totalHours,
            remaining_hours: totalHours,
          },
        ])
        .select();

      if (error) {
        // Check for specific constraint violations
        if (error.code === '23505') { // Postgres unique violation code
          if (error.message?.includes('student_id')) {
            throw new Error('Student ID already exists');
          } else if (error.message?.includes('email')) {
            throw new Error('Email already exists');
          }
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Student added successfully",
      });
      setAddStudentDialogOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      
      // Provide specific error messages
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Student ID already exists')) {
        toast({
          title: "Invalid Student ID",
          description: "This Student ID is already taken. Please use a different ID.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('Email already exists')) {
        toast({
          title: "Invalid Email",
          description: "This email is already associated with another student.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to add student: ${(error as any)?.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    }
  };

  // Add this helper function before handleAddService
  const checkAndUpdateStudentStatus = async (studentId: string, currentStatus: string, remainingHours: number) => {
    try {
      // Skip if already completed
      if (currentStatus === 'completed') return currentStatus;
      
      // Check if remaining hours are effectively 0 (handle floating point)
      const hasNoRemainingHours = remainingHours < 0.001;
      
      if (hasNoRemainingHours) {
        // Check if the student has any pending assignments
        const { data: pendingAssignments, error: pendingError } = await supabase
          .from('service_assignments')
          .select('id')
          .eq('student_id', studentId)
          .in('status', ['pending', 'in_progress']);
          
        if (pendingError) {
          console.error('Error checking pending assignments:', pendingError);
          return currentStatus;
        }
        
        // If no pending assignments and zero hours remaining, update status to completed
        if (!pendingAssignments || pendingAssignments.length === 0) {
          // Update student status in the database
          const { error: updateError } = await supabase
            .from('students')
            .update({ status: 'completed' })
            .eq('id', studentId);
            
          if (updateError) {
            console.error('Error updating student status:', updateError);
            return currentStatus;
          }
          
          console.log(`Updated student status to completed - no hours remaining and no pending assignments`);
          return 'completed';
        }
      }
      
      return currentStatus;
    } catch (error) {
      console.error('Error in checkAndUpdateStudentStatus:', error);
      return currentStatus;
    }
  };

  const handleAddService = async (formData: any) => {
    if (!selectedStudent) return;
    
    const hoursToAssign = parseFloat(formData.hours);
    
    // Log values for debugging
    console.log("Adding service with details:", {
      hoursToAssign,
      studentRemainingHours: selectedStudent.remaining_hours,
      difference: selectedStudent.remaining_hours - hoursToAssign
    });
    
    // Validate that assigned hours don't exceed the student's remaining hours
    if (hoursToAssign > selectedStudent.remaining_hours) {
      toast({
        title: "Error",
        description: `Cannot assign ${hoursToAssign} hours. Student only has ${selectedStudent.remaining_hours} remaining hours available.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Add service assignment
      const { data: assignmentData, error: serviceError } = await supabase
        .from('service_assignments')
        .insert([
          {
            student_id: selectedStudent.id,
            service_type: formData.serviceType,
            description: formData.description,
            start_date: formData.date,
            end_date: null,
            status: 'pending',
            hours: hoursToAssign,
            location: formData.location,
            supervisor: formData.supervisor,
            verification_status: 'pending'
          },
        ])
        .select();

      if (serviceError) {
        console.error("Error inserting assignment:", serviceError);
        throw serviceError;
      }
      
      console.log("Successfully added assignment:", assignmentData);

      // Calculate remaining hours after this assignment
      const newRemainingHours = Math.max(0, selectedStudent.remaining_hours - hoursToAssign);
      
      // Determine status based on remaining hours and pending assignments
      const newStatus = await checkAndUpdateStudentStatus(
        selectedStudent.id,
        selectedStudent.status,
        newRemainingHours
      );
      
      console.log("Updating student with:", {
        newRemainingHours,
        newStatus
      });

      // Update student's remaining hours and set status appropriately
      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update({
          remaining_hours: newRemainingHours,
          status: newStatus
        })
        .eq('id', selectedStudent.id)
        .select();

      if (updateError) {
        console.error("Error updating student:", updateError);
        throw updateError;
      }
      
      console.log("Successfully updated student:", updatedStudent);

      toast({
        title: "Success",
        description: `Service assignment added successfully. ${newStatus === 'completed' ? 'Student has completed all service hours!' : ''}`,
      });
      setAddHoursDialogOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Error adding service assignment:', error);
      toast({
        title: "Error",
        description: `Failed to add service assignment: ${(error as any)?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      setDeleteDialogOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  const handleEditProfile = async (formData: any) => {
    if (!selectedStudent) return;

    try {
      // Check if student ID already exists (for a different student)
      if (formData.studentId !== selectedStudent.student_id) {
        const { data: existingStudentId, error: idCheckError } = await supabase
          .from('students')
          .select('id')
          .eq('student_id', formData.studentId)
          .maybeSingle();
          
        if (idCheckError) throw idCheckError;
        
        if (existingStudentId) {
          toast({
            title: "Invalid Student ID",
            description: "This Student ID is already taken. Please use a different ID.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Check if email already exists (for a different student)
      if (formData.email !== selectedStudent.email) {
        const { data: existingEmail, error: emailCheckError } = await supabase
          .from('students')
          .select('id')
          .eq('email', formData.email)
          .maybeSingle();
          
        if (emailCheckError) throw emailCheckError;
        
        if (existingEmail) {
          toast({
            title: "Invalid Email",
            description: "This email is already associated with another student.",
            variant: "destructive",
          });
          return;
        }
      }
      
      const newRemainingHours = parseFloat(formData.remaining_hours) || 0;
      
      // Check if status should be updated based on remaining hours and pending assignments
      const updatedStatus = await checkAndUpdateStudentStatus(
        selectedStudent.id, 
        formData.status, 
        newRemainingHours
      );

      const { error } = await supabase
        .from('students')
        .update({
          name: formData.name,
          student_id: formData.studentId,
          email: formData.email,
          program: formData.program,
          year: parseInt(formData.year),
          status: updatedStatus,
          total_hours: parseFloat(formData.total_hours) || 0,
          remaining_hours: newRemainingHours,
        })
        .eq('id', selectedStudent.id);

      if (error) {
        // Check for specific constraint violations
        if (error.code === '23505') { // Postgres unique violation code
          if (error.message?.includes('student_id')) {
            throw new Error('Student ID already exists');
          } else if (error.message?.includes('email')) {
            throw new Error('Email already exists');
          }
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Student profile updated successfully",
      });
      setEditProfileDialogOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      
      // Provide specific error messages
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Student ID already exists')) {
        toast({
          title: "Invalid Student ID",
          description: "This Student ID is already taken. Please use a different ID.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('Email already exists')) {
        toast({
          title: "Invalid Email",
          description: "This email is already associated with another student.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update student profile",
          variant: "destructive",
        });
      }
    }
  };

  // Function to render status badge for service assignments
  const getAssignmentStatusBadge = (status: string, verification_status: string) => {
    if (verification_status === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-slate-500 border-slate-500">Cancelled</Badge>;
      case "pending":
      default:
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
    }
  };

  const handleUpdateAssignmentStatus = async (assignment: ServiceAssignment, action: 'cancel' | 'complete') => {
    setSelectedAssignment(assignment);
    setActionType(action);
    setConfirmDialogOpen(true);
  };
  
  const confirmUpdateStatus = async () => {
    if (!selectedAssignment || !actionType || !selectedStudent) return;
    
    try {
      const newStatus = actionType === 'cancel' ? 'cancelled' : 'completed';
      
      const { error } = await supabase
        .from('service_assignments')
        .update({ 
          status: newStatus,
          ...(actionType === 'complete' ? { 
            end_date: new Date().toISOString().split('T')[0],
            verification_status: 'verified'
          } : {})
        })
        .eq('id', selectedAssignment.id);
          
      if (error) throw error;
      
      let updatedRemainingHours = selectedStudent.remaining_hours;
      
      // If cancelling an assignment, return the hours to the student's remaining hours
      if (actionType === 'cancel') {
        updatedRemainingHours = selectedStudent.remaining_hours + selectedAssignment.hours;
        
        const { error: updateError } = await supabase
          .from('students')
          .update({
            remaining_hours: updatedRemainingHours
          })
          .eq('id', selectedStudent.id);
          
        if (updateError) throw updateError;
      }
      
      // Determine the new student status using the helper function
      const newStudentStatus = await checkAndUpdateStudentStatus(
        selectedStudent.id,
        selectedStudent.status,
        updatedRemainingHours
      );
      
      // Update student's status if it has changed
      if (newStudentStatus !== selectedStudent.status) {
        const { error: studentError } = await supabase
          .from('students')
          .update({ status: newStudentStatus })
          .eq('id', selectedStudent.id);
          
        if (studentError) throw studentError;
      }
      
      // Update local state by refetching assignments
      const { data: updatedAssignments, error: fetchError } = await supabase
        .from('service_assignments')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .order('start_date', { ascending: false });
        
      if (fetchError) throw fetchError;
      setStudentAssignments(updatedAssignments || []);
      
      toast({
        title: "Success",
        description: `Service assignment ${actionType === 'cancel' ? 'cancelled' : 'completed'} successfully. ${
          newStudentStatus !== selectedStudent.status ? `Student status updated to ${newStudentStatus}.` : ''
        }`,
      });
    } catch (error) {
      console.error(`Error ${actionType}ing assignment:`, error);
      toast({
        title: "Error",
        description: `Failed to ${actionType} service assignment: ${(error as any)?.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setConfirmDialogOpen(false);
      setSelectedAssignment(null);
      setActionType(null);
      
      // Refresh the student list to update the UI
      fetchStudents();
    }
  };

  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader>
        <div className="flex justify-end">
          <Button onClick={() => setAddStudentDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Student
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program === "all" ? "All Programs" : program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Name {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("student_id")}
                >
                  <div className="flex items-center">
                    Student ID {getSortIcon("student_id")}
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("total_hours")}
                >
                  <div className="flex items-center justify-end">
                    Total Hours {getSortIcon("total_hours")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("remaining_hours")}
                >
                  <div className="flex items-center justify-end">
                    Remaining Hours {getSortIcon("remaining_hours")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status {getSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("program")}
                >
                  <div className="flex items-center">
                    Program {getSortIcon("program")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("year")}
                >
                  <div className="flex items-center justify-end">
                    Year {getSortIcon("year")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{student.student_id}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell className="text-right">
                      {student.total_hours}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={student.remaining_hours < 5 ? "text-red-500 font-medium" : ""}>
                        {student.remaining_hours}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell>{student.program}</TableCell>
                    <TableCell className="text-right">{student.year}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewServiceHours(student)}
                          className={student.status === 'completed' ? "text-blue-500" : ""}
                          title={student.status === 'completed' ? "View completed service history" : "View service history"}
                        >
                          {student.status === 'completed' ? (
                            <div className="flex flex-col items-center">
                              <Eye className="h-4 w-4 text-blue-500" />
                              <span className="text-[10px] text-blue-500 font-medium">Completed</span>
                            </div>
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedStudent(student);
                              setEditProfileDialogOpen(true);
                            }}>
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAddHours(student)}
                            >
                              Assign Service
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              View Service History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedStudent(student);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
                    No students found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground mt-4">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </CardContent>

      {/* Service Assignment Dialog */}
      <Dialog open={addHoursDialogOpen} onOpenChange={setAddHoursDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Service</DialogTitle>
            <DialogDescription>
              Assign a new service activity for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddService({
              serviceType: formData.get('serviceType'),
              description: formData.get('description'),
              date: formData.get('date'),
              hours: formData.get('hours'),
              location: formData.get('location'),
              supervisor: formData.get('supervisor'),
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">
                  Service Type
                </label>
                <Select name="serviceType" defaultValue={serviceTypes[0]}>
                  <SelectTrigger className="col-span-3">
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

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Hours</label>
                <div className="col-span-3">
                  <Input
                    name="hours"
                    type="number"
                    min="0"
                    max={selectedStudent?.remaining_hours.toString()}
                    step="0.5"
                    defaultValue="1"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Hours for this service assignment (Remaining: {selectedStudent?.remaining_hours || 0})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Date</label>
                <Input
                  name="date"
                  type="date"
                  className="col-span-3"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Location</label>
                <Input
                  name="location"
                  className="col-span-3"
                  placeholder="Service location"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Supervisor</label>
                <Input
                  name="supervisor"
                  className="col-span-3"
                  placeholder="Supervisor name"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">
                  Description
                </label>
                <Input
                  name="description"
                  className="col-span-3"
                  placeholder="Brief description of service activity"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddHoursDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Assign Service</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog
        open={addStudentDialogOpen}
        onOpenChange={setAddStudentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Enter the details of the new student to add them to the system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddStudent({
              name: formData.get('name'),
              studentId: formData.get('studentId'),
              email: formData.get('email'),
              program: formData.get('program'),
              year: formData.get('year'),
              total_hours: formData.get('total_hours'),
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Name</label>
                <Input 
                  name="name"
                  className="col-span-3" 
                  placeholder="Full name" 
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">
                  Student ID
                </label>
                <Input 
                  name="studentId"
                  className="col-span-3" 
                  placeholder="e.g. S12345" 
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  className="col-span-3"
                  placeholder="student@university.edu"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Program</label>
                <Select name="program" defaultValue="Computer Science">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">
                      Computer Science
                    </SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Psychology">Psychology</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Year</label>
                <Select name="year" defaultValue="1">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Total Hours</label>
                <div className="col-span-3">
                  <Input
                    name="total_hours"
                    type="number"
                    min="0"
                    step="0.5"
                    defaultValue="0"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Total hours allocated to this student
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddStudentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Student</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStudent?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedStudent && handleDeleteStudent(selectedStudent.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student Profile</DialogTitle>
            <DialogDescription>
              Update the student's information below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleEditProfile({
              name: formData.get('name'),
              studentId: formData.get('studentId'),
              email: formData.get('email'),
              program: formData.get('program'),
              year: formData.get('year'),
              status: formData.get('status'),
              total_hours: formData.get('total_hours'),
              remaining_hours: formData.get('remaining_hours'),
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Name</label>
                <Input 
                  name="name"
                  className="col-span-3" 
                  placeholder="Full name" 
                  defaultValue={selectedStudent?.name}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">
                  Student ID
                </label>
                <Input 
                  name="studentId"
                  className="col-span-3" 
                  placeholder="e.g. S12345" 
                  defaultValue={selectedStudent?.student_id}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  className="col-span-3"
                  placeholder="student@university.edu"
                  defaultValue={selectedStudent?.email}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Program</label>
                <Select name="program" defaultValue={selectedStudent?.program}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">
                      Computer Science
                    </SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Psychology">Psychology</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Year</label>
                <Select name="year" defaultValue={selectedStudent?.year.toString()}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Status</label>
                <Select name="status" defaultValue={selectedStudent?.status}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Total Hours</label>
                <div className="col-span-3">
                  <Input
                    name="total_hours"
                    type="number"
                    min="0"
                    step="0.5"
                    defaultValue={selectedStudent?.total_hours}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Total hours allocated to this student
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Remaining Hours</label>
                <div className="col-span-3">
                  <Input
                    name="remaining_hours"
                    type="number"
                    min="0"
                    step="0.5"
                    defaultValue={selectedStudent?.remaining_hours}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Remaining hours allocated to this student
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditProfileDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Service Assignments Dialog */}
      <Dialog open={viewServiceDialogOpen} onOpenChange={setViewServiceDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Service Assignments - {selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              View all service assignments for this student.
            </DialogDescription>
          </DialogHeader>

          {loadingAssignments ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : studentAssignments.length > 0 ? (
            <div className="space-y-4">
              {/* Completion Status Banner */}
              {selectedStudent?.status === 'completed' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center mb-4">
                  <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <p className="font-medium text-blue-700">Service Completed</p>
                    <p className="text-sm text-blue-600">
                      This student has completed all their service assignments.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Pending Assignments Section */}
              {studentAssignments.filter(a => a.status === 'pending').length > 0 && (
                <>
                  <h3 className="font-semibold text-lg border-b pb-2">Pending Assignments</h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-4 mb-6">
                    {studentAssignments
                      .filter(assignment => assignment.status === 'pending')
                      .map((assignment) => (
                        <Card key={assignment.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{assignment.service_type}</h3>
                                <p className="text-sm text-muted-foreground">{assignment.description}</p>
                              </div>
                              {getAssignmentStatusBadge(assignment.status, assignment.verification_status)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  Start: {new Date(assignment.start_date).toLocaleDateString()}
                                  {assignment.end_date && ` to ${new Date(assignment.end_date).toLocaleDateString()}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{assignment.hours} hours</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{assignment.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <span>{assignment.supervisor}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </>
              )}
              
              {/* Completed Assignments Section */}
              {studentAssignments.filter(a => a.status === 'completed').length > 0 && (
                <>
                  <h3 className="font-semibold text-lg border-b pb-2 text-blue-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                    Completed Assignments
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-4 mb-6">
                    {studentAssignments
                      .filter(assignment => assignment.status === 'completed')
                      .map((assignment) => (
                        <Card key={assignment.id} className="overflow-hidden border-blue-100">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{assignment.service_type}</h3>
                                <p className="text-sm text-muted-foreground">{assignment.description}</p>
                              </div>
                              {getAssignmentStatusBadge(assignment.status, assignment.verification_status)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {new Date(assignment.start_date).toLocaleDateString()}
                                  {assignment.end_date && ` to ${new Date(assignment.end_date).toLocaleDateString()}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{assignment.hours} hours</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{assignment.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <span>{assignment.supervisor}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </>
              )}
              
              {/* Cancelled Assignments Section */}
              {studentAssignments.filter(a => a.status === 'cancelled').length > 0 && (
                <>
                  <h3 className="font-semibold text-lg border-b pb-2">Cancelled Assignments</h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-4">
                    {studentAssignments
                      .filter(assignment => assignment.status === 'cancelled')
                      .map((assignment) => (
                        <Card key={assignment.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{assignment.service_type}</h3>
                                <p className="text-sm text-muted-foreground">{assignment.description}</p>
                              </div>
                              {getAssignmentStatusBadge(assignment.status, assignment.verification_status)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {new Date(assignment.start_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{assignment.hours} hours</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{assignment.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <span>{assignment.supervisor}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No service assignments found for this student.
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewServiceDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Action Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'cancel' ? 'Cancel Service Assignment' : 'Complete Service Assignment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'cancel' 
                ? 'Are you sure you want to cancel this service assignment? This action cannot be undone.'
                : 'Are you sure this service assignment has been completed? This will mark it as completed and update the service record.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpdateStatus}
              className={actionType === 'cancel' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
            >
              {actionType === 'cancel' ? 'Yes, Cancel Assignment' : 'Yes, Mark as Completed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default StudentTable;
