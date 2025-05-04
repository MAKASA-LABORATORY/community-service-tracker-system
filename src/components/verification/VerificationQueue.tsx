import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Clock,
} from "lucide-react";

interface VerificationSubmission {
  id: string;
  studentName: string;
  studentId: string;
  serviceCategory: string;
  hoursClaimed: number;
  date: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "info-requested";
  evidence?: string;
}

const VerificationQueue = () => {
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [commentText, setCommentText] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<VerificationSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(true);

  // Mock data for demonstration
  const mockSubmissions: VerificationSubmission[] = [
    {
      id: "1",
      studentName: "Jane Smith",
      studentId: "S12345",
      serviceCategory: "Community Outreach",
      hoursClaimed: 5,
      date: "2023-06-15",
      description: "Volunteered at local food bank distributing meals",
      status: "pending",
      evidence:
        "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80",
    },
    {
      id: "2",
      studentName: "John Doe",
      studentId: "S12346",
      serviceCategory: "Environmental",
      hoursClaimed: 3,
      date: "2023-06-14",
      description: "Participated in campus cleanup event",
      status: "pending",
    },
    {
      id: "3",
      studentName: "Alex Johnson",
      studentId: "S12347",
      serviceCategory: "Tutoring",
      hoursClaimed: 2,
      date: "2023-06-13",
      description: "Tutored middle school students in mathematics",
      status: "approved",
    },
    {
      id: "4",
      studentName: "Sarah Williams",
      studentId: "S12348",
      serviceCategory: "Healthcare",
      hoursClaimed: 4,
      date: "2023-06-12",
      description: "Assisted at campus blood drive",
      status: "rejected",
    },
    {
      id: "5",
      studentName: "Michael Brown",
      studentId: "S12349",
      serviceCategory: "Community Outreach",
      hoursClaimed: 6,
      date: "2023-06-11",
      description: "Helped organize community food drive",
      status: "info-requested",
    },
  ];

  const filteredSubmissions = mockSubmissions.filter((submission) => {
    const matchesTab = activeTab === "all" || submission.status === activeTab;
    const matchesSearch =
      submission.studentName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      submission.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "" ||
      submission.serviceCategory === selectedCategory;

    return matchesTab && matchesSearch && matchesCategory;
  });

  const serviceCategories = Array.from(
    new Set(mockSubmissions.map((s) => s.serviceCategory)),
  );

  const handleApprove = (submission: VerificationSubmission) => {
    // In a real app, this would update the database
    console.log(`Approved submission ${submission.id}`);
    // Update UI state
  };

  const handleReject = (submission: VerificationSubmission) => {
    setSelectedSubmission(submission);
    setDialogOpen(true);
    // Dialog will handle the actual rejection
  };

  const handleRequestInfo = (submission: VerificationSubmission) => {
    setSelectedSubmission(submission);
    setDialogOpen(true);
    // Dialog will handle the info request
  };

  const handleViewDetails = (submission: VerificationSubmission) => {
    setSelectedSubmission(submission);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      case "info-requested":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Info Requested
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Service Verification Queue</h1>

      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {serviceCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
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
        defaultValue="pending"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-4 w-full md:w-[600px]">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Pending
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="h-4 w-4 mr-2" /> Approved
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="h-4 w-4 mr-2" /> Rejected
          </TabsTrigger>
          <TabsTrigger value="all">All Submissions</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Verification Submissions</span>
            <span className="text-sm font-normal text-muted-foreground">
              {filteredSubmissions.length}{" "}
              {filteredSubmissions.length === 1 ? "submission" : "submissions"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {submission.studentName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {submission.studentId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{submission.serviceCategory}</TableCell>
                    <TableCell>{submission.hoursClaimed}</TableCell>
                    <TableCell>{submission.date}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(submission)}
                        >
                          View
                        </Button>

                        {submission.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                              onClick={() => handleApprove(submission)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                              onClick={() => handleReject(submission)}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                              onClick={() => handleRequestInfo(submission)}
                            >
                              Request Info
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mb-2 opacity-20" />
                      <p>No submissions found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Submission Detail Dialog */}
      {selectedSubmission && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
              <DialogDescription>
                Review the service submission details below.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm">Student</h3>
                  <p>
                    {selectedSubmission.studentName} (
                    {selectedSubmission.studentId})
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Category</h3>
                  <p>{selectedSubmission.serviceCategory}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Hours Claimed</h3>
                  <p>{selectedSubmission.hoursClaimed}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Date</h3>
                  <p>{selectedSubmission.date}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm">Description</h3>
                <p className="text-sm">{selectedSubmission.description}</p>
              </div>

              {selectedSubmission.evidence && (
                <div>
                  <h3 className="font-medium text-sm">Evidence</h3>
                  <div className="mt-2">
                    <img
                      src={selectedSubmission.evidence}
                      alt="Service evidence"
                      className="max-h-48 rounded-md object-cover"
                    />
                  </div>
                </div>
              )}

              {selectedSubmission.status === "pending" && (
                <div>
                  <h3 className="font-medium text-sm mb-2">Admin Response</h3>
                  <Textarea
                    placeholder="Add comments or feedback about this submission"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              {selectedSubmission.status === "pending" && (
                <div className="flex justify-end gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    onClick={() => {
                      console.log("Requesting more info", commentText);
                      setDialogOpen(false);
                    }}
                  >
                    Request Info
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                    onClick={() => {
                      console.log("Rejecting submission", commentText);
                      setDialogOpen(false);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      console.log("Approving submission", commentText);
                      setDialogOpen(false);
                    }}
                  >
                    Approve
                  </Button>
                </div>
              )}
              {selectedSubmission.status !== "pending" && (
                <Button onClick={() => setDialogOpen(false)}>Close</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VerificationQueue;
