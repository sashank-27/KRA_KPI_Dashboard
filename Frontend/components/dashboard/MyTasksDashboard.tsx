"use client";

import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import {
  ClipboardList,
  Plus,
  Calendar,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DailyTask, NewDailyTask, Department, User as UserType } from "@/lib/types";
import { DailyTaskModal } from "@/components/modals/DailyTaskModal";
import { getAuthHeaders, requireAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";

interface MyTasksDashboardProps {
  currentUserId: string;
  departments: Department[];
  users: UserType[];
}

export function MyTasksDashboard({ currentUserId, departments, users }: MyTasksDashboardProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newTask, setNewTask] = useState<NewDailyTask>({
    task: "",
    srId: "",
    remarks: "",
    status: "in-progress",
    date: new Date().toISOString().split('T')[0],
    tags: [],
  });
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    closed: 0,
  });
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [taskToEscalate, setTaskToEscalate] = useState<DailyTask | null>(null);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalatedTo, setEscalatedTo] = useState("");

  // Fetch user's daily tasks
  useEffect(() => {
    fetchUserTasks();
  }, [currentUserId]);

  const fetchUserTasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:5000/api/daily-tasks/user/${currentUserId}`, {
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
      
      // Calculate stats
      const taskStats = {
        total: data.tasks?.length || 0,
        inProgress: data.tasks?.filter((task: DailyTask) => task.status === "in-progress").length || 0,
        closed: data.tasks?.filter((task: DailyTask) => task.status === "closed").length || 0,
      };
      setStats(taskStats);
    } catch (err) {
      console.error("Failed to fetch user daily tasks", err);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create task
  const handleCreateTask = async () => {
    if (newTask.task && newTask.remarks) {
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
          task: "",
          srId: "",
          remarks: "",
          status: "in-progress",
          date: new Date().toISOString().split('T')[0],
          tags: [],
        });
        fetchUserTasks(); // Refresh to update stats
      } catch (err) {
        console.error("Failed to create daily task", err);
        alert(`Failed to create daily task: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  // Escalate task
  const handleEscalateTask = (task: DailyTask) => {
    setTaskToEscalate(task);
    setEscalationReason("");
    setEscalatedTo("");
    setEscalateDialogOpen(true);
  };

  const confirmEscalateTask = async () => {
    if (!taskToEscalate || !escalatedTo) return;

    try {
      const res = await fetch(`http://localhost:5000/api/daily-tasks/${taskToEscalate._id}/escalate`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          escalatedTo,
          escalationReason,
        }),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Unauthorized access, redirecting to login');
          requireAuth();
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to escalate task: ${res.status} ${res.statusText}`);
      }
      
      // Refresh tasks to show updated data
      fetchUserTasks();
      setEscalateDialogOpen(false);
      setTaskToEscalate(null);
      setEscalationReason("");
      setEscalatedTo("");
    } catch (err) {
      console.error("Failed to escalate task", err);
      alert(`Failed to escalate task: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Rollback escalated task
  const handleRollbackTask = async (task: DailyTask) => {
    if (!confirm("Are you sure you want to rollback this escalated task?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/daily-tasks/${task._id}/rollback`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          requireAuth();
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to rollback task: ${res.status} ${res.statusText}`);
      }
      
      // Refresh tasks to show updated data
      fetchUserTasks();
    } catch (err) {
      console.error("Failed to rollback task", err);
      alert(`Failed to rollback task: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.srId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your daily tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">My Daily Tasks</h2>
            <p className="max-w-[600px] text-white/80">
              Track and manage your daily tasks and service requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-white/80" />
            <span className="text-2xl font-bold">{stats.total}</span>
            <span className="text-white/80">Total Tasks</span>
          </div>
        </div>
      </motion.div>

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
          transition={{ duration: 0.5, delay: 0.3 }}
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

      {/* Add Task Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setCreateTaskOpen(true)}
          className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Daily Task
        </Button>
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
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task, index) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Task Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.task}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge 
                            variant="secondary"
                            className={`${getStatusColor(task.status)}`}
                          >
                            {getStatusIcon(task.status)}
                            <span className="ml-1 capitalize">{task.status}</span>
                          </Badge>
                          {task.isEscalated && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              Escalated
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{task.remarks}</p>
                      </div>
                    </div>
                  </div>

                  {/* Task Details */}
                  <div className="lg:w-80 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">Department:</span>
                        </div>
                        <p className="text-sm text-gray-900">
                          {typeof task.department === 'string' 
                            ? task.department 
                            : task.department?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Date:</span>
                        </div>
                        <p className="text-sm text-gray-900">
                          {formatDate(task.date).split(',')[0]}
                        </p>
                      </div>
                    </div>

                    {/* Escalation Info */}
                    {task.isEscalated && (
                      <div className="space-y-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-orange-700">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="font-medium">Escalated to:</span>
                        </div>
                        <p className="text-sm text-orange-800">
                          {typeof task.escalatedTo === 'string' 
                            ? task.escalatedTo 
                            : task.escalatedTo?.name || 'Unknown'}
                        </p>
                        {task.escalationReason && (
                          <p className="text-xs text-orange-600 italic">
                            Reason: {task.escalationReason}
                          </p>
                        )}
                      </div>
                    )}

                    {task.tags && task.tags.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-600">Tags:</div>
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {!task.isEscalated && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEscalateTask(task)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          Escalate
                        </Button>
                      )}
                      {task.isEscalated && (() => {
                        // Use originalUser if available, otherwise fallback to escalatedBy
                        const originalUserId = task.originalUser || task.escalatedBy;
                        const canRollback = originalUserId && 
                          (typeof originalUserId === 'string' ? originalUserId : originalUserId._id) === currentUserId;
                        
                        return (
                          <div className="flex gap-2">
                            {canRollback && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRollbackTask(task)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <ArrowDownLeft className="h-4 w-4 mr-1" />
                                Rollback
                              </Button>
                            )}
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              Escalated
                            </Badge>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border shadow-sm p-12 text-center"
          >
            <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Daily Tasks Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "No tasks match your current filters. Try adjusting your search criteria."
                : "You don't have any daily tasks yet. Create your first task to get started."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}
      </div>

      <DailyTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        newTask={newTask}
        setNewTask={setNewTask}
        onCreateTask={handleCreateTask}
      />

      {/* Escalation Dialog */}
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Escalate Task</DialogTitle>
            <DialogDescription>
              Escalate this task to another user. They will be able to work on it and you can rollback if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="escalatedTo">Escalate to</Label>
              <Select value={escalatedTo} onValueChange={setEscalatedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(user => user._id !== currentUserId)
                    .map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="escalationReason">Reason (optional)</Label>
              <Textarea
                id="escalationReason"
                placeholder="Why are you escalating this task?"
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEscalateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEscalateTask}
              disabled={!escalatedTo}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Escalate Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
