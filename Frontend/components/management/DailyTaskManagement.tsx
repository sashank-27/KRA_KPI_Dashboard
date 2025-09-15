"use client";

import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import {
  ClipboardList,
  Plus,
  MoreHorizontal,
  PanelLeft,
  ArrowUpDown,
  Edit,
  Trash2,
  Calendar,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DailyTask, NewDailyTask, Department, User as UserType } from "@/lib/types";
import { DailyTaskModal } from "@/components/modals/DailyTaskModal";
import { getAuthHeaders, requireAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface DailyTaskManagementProps {
  departments: Department[];
  users: UserType[];
}

export function DailyTaskManagement({ departments, users }: DailyTaskManagementProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<DailyTask | null>(null);
  const [newTask, setNewTask] = useState<NewDailyTask>({
    srId: "",
    remarks: "",
    status: "open",
    date: new Date().toISOString().split('T')[0],
    tags: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
  });

  // Fetch tasks from backend
  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/daily-tasks", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Unauthorized access, redirecting to login');
          requireAuth();
          return;
        }
        throw new Error(`Failed to fetch daily tasks: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err) {
      console.error("Failed to fetch daily tasks", err);
      setTasks([]);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/daily-tasks/stats", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch daily task stats", err);
    }
  };

  // Create task
  const handleCreateTask = async () => {
    if (newTask.srId && newTask.remarks) {
      try {
        const res = await fetch("http://localhost:5000/api/daily-tasks", {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(newTask),
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            console.log('Unauthorized access, redirecting to login');
            requireAuth();
            return;
          }
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create daily task: ${res.status} ${res.statusText}`);
        }
        
        const createdTask = await res.json();
        setTasks([createdTask, ...tasks]);
        setCreateTaskOpen(false);
        setNewTask({
          srId: "",
          remarks: "",
          status: "open",
          date: new Date().toISOString().split('T')[0],
          tags: [],
        });
        fetchStats();
      } catch (err) {
        console.error("Failed to create daily task", err);
        alert(`Failed to create daily task: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  // Edit task
  const handleEditTask = (task: DailyTask) => {
    setEditingTask(task);
    setEditTaskOpen(true);
  };

  // Update task
  const handleUpdateTask = async (updatedTask: DailyTask) => {
    try {
      const res = await fetch(`http://localhost:5000/api/daily-tasks/${updatedTask._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(updatedTask),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Unauthorized access, redirecting to login');
          requireAuth();
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update daily task: ${res.status} ${res.statusText}`);
      }
      
      const updated = await res.json();
      setTasks(tasks.map((task) => (task._id === updated._id ? updated : task)));
      setEditTaskOpen(false);
      setEditingTask(null);
      fetchStats();
    } catch (err) {
      console.error("Failed to update daily task", err);
      alert(`Failed to update daily task: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Delete task
  const handleDeleteTask = (task: DailyTask) => {
    setTaskToDelete(task);
    setDeleteTaskOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      try {
        const res = await fetch(`http://localhost:5000/api/daily-tasks/${taskToDelete._id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            console.log('Unauthorized access, redirecting to login');
            requireAuth();
            return;
          }
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete daily task: ${res.status} ${res.statusText}`);
        }
        
        setTasks(tasks.filter((task) => task._id !== taskToDelete._id));
        setDeleteTaskOpen(false);
        setTaskToDelete(null);
        fetchStats();
      } catch (err) {
        console.error("Failed to delete daily task", err);
        alert(`Failed to delete daily task: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "in-progress":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "closed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };


  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.srId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || 
      (typeof task.department === 'string' ? task.department === departmentFilter : task.department?._id === departmentFilter);
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <>
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Daily Task Management</h2>
              <p className="max-w-[600px] text-white/80">
                Manage and track daily tasks submitted by users across all departments.
              </p>
            </div>
            <Button
              className="rounded-2xl bg-white text-emerald-700 hover:bg-white/90"
              onClick={() => setCreateTaskOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Daily Task
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl border shadow-sm p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl border shadow-sm p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl border shadow-sm p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl border shadow-sm p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
              <p className="text-sm text-gray-600">Closed</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by SR-ID or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">All Daily Tasks</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-2xl">
              <PanelLeft className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="rounded-2xl">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b">
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
              <div className="col-span-2">SR-ID</div>
              <div className="col-span-3">Remarks</div>
              <div className="col-span-2">User</div>
              <div className="col-span-2">Department</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Date</div>
            </div>
          </div>
          
          {/* Task List */}
          <div className="divide-y divide-gray-100">
            {Array.isArray(filteredTasks) && filteredTasks.length > 0 ? filteredTasks.map((task, idx) => (
              <div
                key={task._id}
                className="px-6 py-4 hover:bg-gray-50/50 transition-colors duration-200"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* SR-ID */}
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-900">{task.srId}</p>
                  </div>
                  
                  {/* Remarks */}
                  <div className="col-span-3">
                    <p className="text-sm text-gray-700 truncate">{task.remarks}</p>
                  </div>
                  
                  {/* User */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 truncate">
                        {typeof task.user === 'string' 
                          ? task.user 
                          : task.user?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Department */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 truncate">
                        {typeof task.department === 'string' 
                          ? task.department 
                          : task.department?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(task.status)}
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Date */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(task.date).split(',')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No daily tasks found</p>
                <p className="text-sm">Create your first daily task to get started.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <DailyTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        newTask={newTask}
        setNewTask={setNewTask}
        onCreateTask={handleCreateTask}
      />

      {editingTask && (
        <DailyTaskModal
          isOpen={editTaskOpen}
          onClose={() => {
            setEditTaskOpen(false);
            setEditingTask(null);
          }}
          newTask={{
            srId: editingTask.srId,
            remarks: editingTask.remarks,
            status: editingTask.status,
            date: editingTask.date.split('T')[0],
            user: typeof editingTask.user === 'string' 
              ? editingTask.user 
              : editingTask.user?._id || '',
            department: typeof editingTask.department === 'string' 
              ? editingTask.department 
              : editingTask.department?._id || '',
            tags: editingTask.tags,
          }}
          setNewTask={(updatedTask) => {
            setEditingTask({
              ...editingTask,
              ...updatedTask,
            });
          }}
          onCreateTask={() => {
            if (editingTask) {
              handleUpdateTask(editingTask);
            }
          }}
          isEdit={true}
        />
      )}

      <AlertDialog open={deleteTaskOpen} onOpenChange={setDeleteTaskOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              daily task <strong>{taskToDelete?.srId}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
