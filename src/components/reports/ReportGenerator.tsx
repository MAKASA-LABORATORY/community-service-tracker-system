import React, { useState } from "react";
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
import { format } from "date-fns";
import {
  CalendarIcon,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportGeneratorProps {
  className?: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  className = "",
}) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedGroup, setSelectedGroup] = useState<string>();
  const [reportType, setReportType] = useState("summary");

  // Mock data for demonstration
  const serviceCategories = [
    { id: "1", name: "Community Outreach" },
    { id: "2", name: "Environmental" },
    { id: "3", name: "Educational" },
    { id: "4", name: "Healthcare" },
    { id: "5", name: "Animal Welfare" },
  ];

  const studentGroups = [
    { id: "1", name: "Freshmen" },
    { id: "2", name: "Sophomores" },
    { id: "3", name: "Juniors" },
    { id: "4", name: "Seniors" },
    { id: "5", name: "Honor Society" },
  ];

  const handleGenerateReport = () => {
    // This would connect to actual report generation logic
    console.log("Generating report with:", {
      startDate,
      endDate,
      selectedCategory,
      selectedGroup,
      reportType,
    });
  };

  const handleExport = (format: "pdf" | "csv") => {
    // This would handle the export functionality
    console.log(`Exporting report as ${format}`);
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
                            format(startDate, "PPP")
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
                            format(endDate, "PPP")
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

            <Button className="w-full mt-6" onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-4">
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

            <div className="border rounded-md p-4 min-h-[300px] flex flex-col items-center justify-center">
              <div className="flex gap-4 mb-6">
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Bar Chart
                </Button>
                <Button variant="outline" size="sm">
                  <PieChart className="mr-2 h-4 w-4" />
                  Pie Chart
                </Button>
                <Button variant="outline" size="sm">
                  <LineChart className="mr-2 h-4 w-4" />
                  Line Chart
                </Button>
              </div>

              <div className="text-center text-muted-foreground">
                <p>Select filters and generate a report to see preview</p>
                <div className="mt-4 w-full max-w-md h-40 bg-muted rounded-md flex items-center justify-center">
                  <span className="text-sm">
                    Chart visualization will appear here
                  </span>
                </div>
              </div>
            </div>
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
