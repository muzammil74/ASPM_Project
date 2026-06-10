import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GraduationCap, ShieldCheck, PlusCircle, List, LogOut, Pencil, Trash2, Users,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Course, type EnrolledStudent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "add" | "view";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const [newCourse, setNewCourse] = useState({
    courseCode: "", courseName: "", creditHours: "", capacity: "",
  });

  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState({ courseName: "", creditHours: "", capacity: "" });

  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  // ── Queries ────────────────────────────────────────────
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: adminApi.courses,
  });

  const { data: enrolledStudents = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["enrolled-students", viewingCourse?.id],
    queryFn: () => adminApi.enrolledStudents(viewingCourse!.id),
    enabled: !!viewingCourse,
  });

  // ── Mutations ──────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: adminApi.addCourse,
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setNewCourse({ courseCode: "", courseName: "", creditHours: "", capacity: "" });
      toast({ title: "Course Added", description: `${course.course_name} has been added.` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { course_name?: string; credit_hours?: number; capacity?: number } }) =>
      adminApi.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setEditCourse(null);
      toast({ title: "Course Updated", description: "Course details have been saved." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Course Deleted", description: "Course has been removed." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      adminApi.removeStudent(courseId, studentId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["enrolled-students", vars.courseId] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Student Removed", description: "Student has been removed from the course." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ── Handlers ───────────────────────────────────────────
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.courseCode || !newCourse.courseName || !newCourse.creditHours || !newCourse.capacity) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    addMutation.mutate({
      course_code: newCourse.courseCode,
      course_name: newCourse.courseName,
      credit_hours: parseInt(newCourse.creditHours),
      capacity: parseInt(newCourse.capacity),
    });
  };

  const openEdit = (course: Course) => {
    setEditCourse(course);
    setEditForm({
      courseName: course.course_name,
      creditHours: String(course.credit_hours),
      capacity: String(course.capacity),
    });
  };

  const handleUpdateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourse) return;
    updateMutation.mutate({
      id: editCourse.id,
      data: {
        course_name: editForm.courseName,
        credit_hours: parseInt(editForm.creditHours),
        capacity: parseInt(editForm.capacity),
      },
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-lg">Admin Panel</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("add")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "add"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Add New Course
          </button>
          <button
            onClick={() => setActiveTab("view")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "view"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <List className="w-4 h-4" /> View Courses
          </button>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            {/* Add Course */}
            {activeTab === "add" && (
              <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold">Add New Course</h2>
                <form onSubmit={handleAddCourse} className="max-w-lg space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Course Code</Label>
                    <Input
                      id="courseCode"
                      placeholder="e.g. CS-4057"
                      value={newCourse.courseCode}
                      onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      placeholder="e.g. Agile Software Project Management"
                      value={newCourse.courseName}
                      onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="creditHours">Credit Hours</Label>
                      <Input
                        id="creditHours"
                        type="number"
                        placeholder="3"
                        value={newCourse.creditHours}
                        onChange={(e) => setNewCourse({ ...newCourse, creditHours: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Course Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        placeholder="40"
                        value={newCourse.capacity}
                        onChange={(e) => setNewCourse({ ...newCourse, capacity: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full sm:w-auto" disabled={addMutation.isPending}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {addMutation.isPending ? "Adding…" : "Add Course"}
                  </Button>
                </form>
              </div>
            )}

            {/* View Courses */}
            {activeTab === "view" && (
              <div className="space-y-4">
                <h2 className="text-xl font-heading font-bold">All Courses</h2>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Loading…</p>
                ) : courses.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">No courses found.</p>
                ) : (
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{course.course_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.course_code} · {course.credit_hours} CH · Capacity: {course.capacity} · Enrolled: {course.enrolled}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingCourse(course)}
                          >
                            <Users className="w-3.5 h-3.5 mr-1" /> Students
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEdit(course)}>
                            <Pencil className="w-3.5 h-3.5 mr-1" /> Update
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(course.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editCourse} onOpenChange={() => setEditCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Update Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCourse} className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Course Code: </span>
              <span className="font-medium">{editCourse?.course_code}</span>
            </div>
            <div className="space-y-2">
              <Label>Course Name</Label>
              <Input
                value={editForm.courseName}
                onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credit Hours</Label>
                <Input
                  type="number"
                  value={editForm.creditHours}
                  onChange={(e) => setEditForm({ ...editForm, creditHours: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Course Capacity</Label>
                <Input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Update Course"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enrolled Students Dialog */}
      <Dialog open={!!viewingCourse} onOpenChange={() => setViewingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">{viewingCourse?.course_name}</DialogTitle>
          </DialogHeader>
          <Badge variant="secondary" className="w-fit">
            <Users className="w-3 h-3 mr-1" /> Enrolled Students
          </Badge>
          <div className="space-y-2 mt-2">
            {loadingStudents ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : enrolledStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No students enrolled.</p>
            ) : (
              enrolledStudents.map((student: EnrolledStudent) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.student_id}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={removeStudentMutation.isPending}
                    onClick={() =>
                      removeStudentMutation.mutate({
                        courseId: viewingCourse!.id,
                        studentId: student.id,
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
