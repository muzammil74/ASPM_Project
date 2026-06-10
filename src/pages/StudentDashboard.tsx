import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, User, BookOpen, CheckCircle2, ClipboardList, LogOut,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi, type CompletedCourse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "info" | "completed" | "registered" | "available";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "info", label: "Student Information", icon: User },
  { key: "completed", label: "Completed Courses", icon: CheckCircle2 },
  { key: "registered", label: "Registered Courses", icon: ClipboardList },
  { key: "available", label: "Available Courses", icon: BookOpen },
];

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, name } = useAuth();
  const queryClient = useQueryClient();

  const { data: student, isLoading: loadingProfile } = useQuery({
    queryKey: ["student-profile"],
    queryFn: studentApi.profile,
  });

  const { data: completedCourses = [], isLoading: loadingCompleted } = useQuery<CompletedCourse[]>({
    queryKey: ["completed-courses"],
    queryFn: studentApi.completedCourses,
  });

  const { data: registeredCourses = [], isLoading: loadingRegistered } = useQuery({
    queryKey: ["registered-courses"],
    queryFn: studentApi.registeredCourses,
  });

  const { data: availableCourses = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ["available-courses"],
    queryFn: studentApi.availableCourses,
  });

  const dropMutation = useMutation({
    mutationFn: studentApi.dropCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registered-courses"] });
      queryClient.invalidateQueries({ queryKey: ["available-courses"] });
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      toast({ title: "Course Dropped", description: "Course removed from your registration." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (ids: string[]) => studentApi.register(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registered-courses"] });
      queryClient.invalidateQueries({ queryKey: ["available-courses"] });
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      setSelectedCourses([]);
      toast({ title: "Registered!", description: `Successfully registered for ${selectedCourses.length} course(s).` });
    },
    onError: (err: Error) => {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleDrop = (courseId: string) => dropMutation.mutate(courseId);

  const SEMESTER_LIMIT = 15;

  const handleRegister = () => {
    if (selectedCourses.length === 0) {
      toast({ title: "No courses selected", description: "Please select at least one course.", variant: "destructive" });
      return;
    }
    const newCredits = availableCourses
      .filter((c) => selectedCourses.includes(c.id))
      .reduce((sum, c) => sum + c.credit_hours, 0);
    if (totalRegisteredCredits + newCredits > SEMESTER_LIMIT) {
      toast({
        title: "Semester Limit Exceeded",
        description: `Semester limit is ${SEMESTER_LIMIT} credit hours. You have ${totalRegisteredCredits} CH registered and are trying to add ${newCredits} CH.`,
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(selectedCourses);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const totalRegisteredCredits = registeredCourses.reduce((sum, c) => sum + c.credit_hours, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-lg">Course Registration</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {student ? `${student.name} (${student.student_id})` : name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            {/* Student Info */}
            {activeTab === "info" && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold">Student Information</h2>
                {loadingProfile ? (
                  <p className="text-muted-foreground text-sm">Loading…</p>
                ) : student ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Student Name" value={student.name} />
                    <InfoRow label="Student ID" value={student.student_id} />
                    <InfoRow label="Credits Attempted" value={`${student.credits_attempted} / ${student.total_credits}`} />
                    <InfoRow label="Credits Earned" value={`${student.credits_earned} / ${student.total_credits}`} />
                    <InfoRow label="CGPA" value={student.cgpa.toFixed(2)} />
                    <InfoRow label="Currently Registered" value={`${totalRegisteredCredits} credit hours`} />
                  </div>
                ) : null}
              </div>
            )}

            {/* Completed Courses */}
            {activeTab === "completed" && (
              <div className="space-y-4">
                <h2 className="text-xl font-heading font-bold">Completed Courses</h2>
                {loadingCompleted ? (
                  <p className="text-muted-foreground text-sm">Loading…</p>
                ) : completedCourses.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">No completed courses.</p>
                ) : (
                  <div className="space-y-2">
                    {completedCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{course.course_name}</p>
                          <p className="text-xs text-muted-foreground">{course.course_code} · {course.credit_hours} CH</p>
                        </div>
                        <Badge className={`${gradeStyle(course.grade)} min-w-[2.5rem] justify-center`}>
                          {course.grade}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Registered Courses */}
            {activeTab === "registered" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-heading font-bold">Registered Courses</h2>
                  <Badge variant="outline">{totalRegisteredCredits} Credit Hours</Badge>
                </div>
                {loadingRegistered ? (
                  <p className="text-muted-foreground text-sm">Loading…</p>
                ) : registeredCourses.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">No courses registered yet.</p>
                ) : (
                  <div className="space-y-2">
                    {registeredCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20"
                      >
                        <div>
                          <p className="font-medium text-sm">{course.course_name}</p>
                          <p className="text-xs text-muted-foreground">{course.course_code} · {course.credit_hours} CH</p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDrop(course.id)}
                          disabled={dropMutation.isPending}
                        >
                          Drop
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Available Courses */}
            {activeTab === "available" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-heading font-bold">Available Courses</h2>
                  <Button
                    size="sm"
                    onClick={handleRegister}
                    disabled={selectedCourses.length === 0 || registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Registering…" : `Register (${selectedCourses.length})`}
                  </Button>
                </div>
                {loadingAvailable ? (
                  <p className="text-muted-foreground text-sm">Loading…</p>
                ) : availableCourses.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">No available courses.</p>
                ) : (
                  <div className="space-y-2">
                    {availableCourses.map((course) => {
                      const isSelected = selectedCourses.includes(course.id);
                      const isFull = course.enrolled >= course.capacity;
                      return (
                        <div
                          key={course.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isFull
                              ? "bg-muted/30 opacity-60"
                              : isSelected
                              ? "bg-primary/5 border border-primary/20"
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCourse(course.id)}
                            disabled={isFull}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{course.course_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {course.course_code} · {course.credit_hours} CH · {course.enrolled}/{course.capacity} enrolled
                            </p>
                          </div>
                          {isFull && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                              No Seats Available
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const GRADE_STYLES: Record<string, string> = {
  "A+": "bg-green-600 text-white",
  "A":  "bg-green-500 text-white",
  "B+": "bg-blue-600 text-white",
  "B":  "bg-blue-500 text-white",
  "B-": "bg-yellow-500 text-white",
  "C+": "bg-orange-500 text-white",
  "C":  "bg-amber-700 text-white",
  "C-": "bg-red-400 text-white",
  "D+": "bg-red-600 text-white",
  "D":  "bg-red-700 text-white",
};

const gradeStyle = (grade: string) =>
  GRADE_STYLES[grade] ?? "bg-muted text-foreground";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="p-4 rounded-lg bg-muted/50">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="font-semibold text-sm">{value}</p>
  </div>
);

export default StudentDashboard;
