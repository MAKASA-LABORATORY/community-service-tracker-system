import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format as formatDate } from "date-fns";
import {
  CalendarIcon,
  Download,
  BarChart3,
  LineChart,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
} from "recharts";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportGeneratorProps {
  className?: string;
}

type ReportData = {
  totalHours: number;
  completedHours: number;
  pendingHours: number;
  categoryBreakdown: {
    name: string;
    hours: number;
    students: number;
  }[];
  studentBreakdown: {
    name: string;
    hours: number;
    status: string;
  }[];
  timeSeriesData: {
    date: string;
    hours: number;
  }[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  className = "",
}) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [reportType, setReportType] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const { toast } = useToast();

  // Fetch service categories from the database
  const [serviceCategories, setServiceCategories] = useState<{ id: string; name: string }[]>([]);
  const [studentGroups, setStudentGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCategoriesAndGroups();
  }, []);

  const fetchCategoriesAndGroups = async () => {
    try {
      // Fetch unique service categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('service_assignments')
        .select('service_type')
        .order('service_type');

      if (categoryError) throw categoryError;

      // Get unique categories
      const uniqueCategories = Array.from(new Set(categoryData?.map(cat => cat.service_type) || []));
      const categories = uniqueCategories.map((cat, index) => ({
        id: (index + 1).toString(),
        name: cat,
      }));
      setServiceCategories(categories);

      // Fetch student groups (based on program/year)
      const { data: groupData, error: groupError } = await supabase
        .from('students')
        .select('program, year')
        .order('program, year');

      if (groupError) throw groupError;

      // Get unique groups
      const uniqueGroups = Array.from(
        new Set(
          groupData?.map(group => `${group.program} Year ${group.year}`) || []
        )
      );
      const groups = uniqueGroups.map((group, index) => ({
        id: (index + 1).toString(),
        name: group,
      }));
      setStudentGroups(groups);
    } catch (error) {
      console.error('Error fetching categories and groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories and groups",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('service_assignments')
        .select(`
          *,
          students!inner (
            name,
            program,
            year
          )
        `)
        .gte('start_date', startDate.toISOString().split('T')[0])
        .lte('start_date', endDate.toISOString().split('T')[0]);

      if (selectedCategory !== 'all') {
        query = query.eq('service_type', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process the data
      const processedData: ReportData = {
        totalHours: 0,
        completedHours: 0,
        pendingHours: 0,
        categoryBreakdown: [],
        studentBreakdown: [],
        timeSeriesData: [],
      };

      // Calculate totals and breakdowns
      const categoryMap = new Map<string, { hours: number; students: Set<string> }>();
      const studentMap = new Map<string, { hours: number; status: string; name: string }>();
      const dateMap = new Map<string, number>();

      data?.forEach((record) => {
        // Update totals
        processedData.totalHours += record.hours;
        if (record.status === 'completed') {
          processedData.completedHours += record.hours;
        } else {
          processedData.pendingHours += record.hours;
        }

        // Update category breakdown
        const category = categoryMap.get(record.service_type) || { hours: 0, students: new Set() };
        category.hours += record.hours;
        category.students.add(record.student_id);
        categoryMap.set(record.service_type, category);

        // Update student breakdown
        const student = studentMap.get(record.student_id) || { 
          hours: 0, 
          status: record.status,
          name: record.students?.name || record.student_id
        };
        student.hours += record.hours;
        studentMap.set(record.student_id, student);

        // Update time series data
        const date = record.start_date.split('T')[0];
        dateMap.set(date, (dateMap.get(date) || 0) + record.hours);
      });

      // Convert maps to arrays
      processedData.categoryBreakdown = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        hours: data.hours,
        students: data.students.size,
      }));

      processedData.studentBreakdown = Array.from(studentMap.entries()).map(([id, data]) => ({
        name: data.name,
        hours: data.hours,
        status: data.status,
      }));

      processedData.timeSeriesData = Array.from(dateMap.entries())
        .map(([date, hours]) => ({ date, hours }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setReportData(processedData);

      // Add success message
      toast({
        title: "Report Generated",
        description: `Successfully generated report with ${processedData.totalHours} total hours across ${processedData.categoryBreakdown.length} categories`,
        variant: "default",
      });

      // Switch to preview tab
      const previewTab = document.querySelector('[data-value="preview"]') as HTMLElement;
      if (previewTab) {
        previewTab.click();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "pdf" | "csv") => {
    if (!reportData) {
      toast({
        title: "Error",
        description: "Please generate a report first",
        variant: "destructive",
      });
      return;
    }

    try {
      if (format === "pdf") {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Add title
        doc.setFontSize(20);
        doc.text("Community Service Report", pageWidth / 2, 20, { align: "center" });
        
        // Add date range
        doc.setFontSize(12);
        const dateRange = `${formatDate(startDate!, "MMM dd, yyyy")} - ${formatDate(endDate!, "MMM dd, yyyy")}`;
        doc.text(`Date Range: ${dateRange}`, pageWidth / 2, 30, { align: "center" });
        
        // Add summary statistics
        doc.setFontSize(14);
        doc.text("Summary Statistics", 14, 45);
        doc.setFontSize(12);
        
        const summaryData = [
          ["Total Hours", reportData.totalHours.toString()],
          ["Completed Hours", reportData.completedHours.toString()],
          ["Pending Hours", reportData.pendingHours.toString()],
        ];
        
        let lastY = 50;
        
        autoTable(doc, {
          startY: lastY,
          head: [["Metric", "Value"]],
          body: summaryData,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 11 },
        });

        lastY = (doc as any).lastAutoTable.finalY + 15;

        // Add category breakdown
        doc.setFontSize(14);
        doc.text("Category Breakdown", 14, lastY);
        
        const categoryData = reportData.categoryBreakdown.map(cat => [
          cat.name,
          cat.hours.toString(),
          cat.students.toString(),
        ]);
        
        autoTable(doc, {
          startY: lastY + 5,
          head: [["Category", "Hours", "Students"]],
          body: categoryData,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 11 },
        });

        lastY = (doc as any).lastAutoTable.finalY + 15;

        // Add student breakdown
        doc.setFontSize(14);
        doc.text("Student Breakdown", 14, lastY);
        
        const studentData = reportData.studentBreakdown.map(student => [
          student.name,
          student.hours.toString(),
          student.status,
        ]);
        
        autoTable(doc, {
          startY: lastY + 5,
          head: [["Student", "Hours", "Status"]],
          body: studentData,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 11 },
        });

        lastY = (doc as any).lastAutoTable.finalY + 15;

        // Add time series data
        doc.setFontSize(14);
        doc.text("Time Series Data", 14, lastY);
        
        const timeSeriesData = reportData.timeSeriesData.map(entry => [
          formatDate(new Date(entry.date), "MMM dd, yyyy"),
          entry.hours.toString(),
        ]);
        
        autoTable(doc, {
          startY: lastY + 5,
          head: [["Date", "Hours"]],
          body: timeSeriesData,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 11 },
        });

        // Add footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          );
          doc.text(
            `Generated on ${formatDate(new Date(), "MMM dd, yyyy 'at' hh:mm a")}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 5,
            { align: "center" }
          );
        }

        // Save the PDF
        doc.save(`service-report-${formatDate(new Date(), "yyyy-MM-dd")}.pdf`);

        toast({
          title: "Success",
          description: "Report exported as PDF successfully",
          variant: "default",
        });
      } else {
        // Existing CSV export code...
        const headers = ["Category", "Hours", "Students"];
        const rows = reportData.categoryBreakdown.map(cat => [
          cat.name,
          cat.hours.toString(),
          cat.students.toString(),
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `service-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Report exported as CSV successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  const renderChart = () => {
    if (!reportData) return null;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#8884d8" name="Hours" />
              <Bar dataKey="students" fill="#82ca9d" name="Students" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={reportData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hours" stroke="#8884d8" name="Hours" />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full bg-white", className)}>
      <CardHeader>
        <CardTitle>Report Generator</CardTitle>
        <CardDescription>
          Generate and export service hour reports with custom filters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters">Report Filters</TabsTrigger>
            <TabsTrigger value="preview">Report Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Date Range Selection */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Date Range</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            formatDate(startDate, "PPP")
                          ) : (
                            <span>Start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            formatDate(endDate, "PPP")
                          ) : (
                            <span>End date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Service Category Selection */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Service Category</h3>
                <Select onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {serviceCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Group Selection */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Student Group</h3>
                <Select onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {studentGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Report Type Selection */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Report Type</h3>
                <Select defaultValue="summary" onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary Report</SelectItem>
                    <SelectItem value="detailed">Detailed Report</SelectItem>
                    <SelectItem value="student">
                      Student-specific Report
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full mt-6" 
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button
                  variant={chartType === "bar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("bar")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Bar Chart
                </Button>
                <Button
                  variant={chartType === "line" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("line")}
                >
                  <LineChart className="mr-2 h-4 w-4" />
                  Line Chart
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("pdf")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("csv")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : reportData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reportData.totalHours}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Completed Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reportData.completedHours}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Pending Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reportData.pendingHours}</div>
                    </CardContent>
                  </Card>
              </div>

                <div className="border rounded-md p-4">
                  {renderChart()}
                </div>
              </div>
            ) : (
              <div className="border rounded-md p-4 min-h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                <p>Select filters and generate a report to see preview</p>
            </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Reports are generated based on verified service hours only
        </p>
      </CardFooter>
    </Card>
  );
};

export default ReportGenerator;
