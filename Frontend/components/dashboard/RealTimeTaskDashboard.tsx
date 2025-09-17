"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  Wifi,
  WifiOff,
  RefreshCw,
  Activity,
  TrendingUp,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DailyTask, NewDailyTask, Department, User as UserType } from "@/lib/types";
import { DailyTaskModal } from "@/components/modals/DailyTaskModal";
import { getAuthHeaders, requireAuth, isAuthenticated } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RealTimeTaskDashboardProps {
  departments: Department[];
  users: UserType[];
}

export function RealTimeTaskDashboard({ departments, users }: RealTimeTaskDashboardProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<DailyTask | null>(null);
  const [newTask, setNewTask] = useState<NewDailyTask>({
    task: "",
    srId: "",
    remarks: "",
    status: "in-progress",
    date: new Date().toISOString().split('T')[0],
    tags: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    closed: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showActivity, setShowActivity] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [escalateTaskOpen, setEscalateTaskOpen] = useState(false);
  const [taskToEscalate, setTaskToEscalate] = useState<DailyTask | null>(null);
  const [escalateToUser, setEscalateToUser] = useState<string>("");
  const [escalationReason, setEscalationReason] = useState<string>("");

  // Initialize socket connection
  useEffect(() => {
    if (realtimeEnabled) {
      console.log("Initializing WebSocket connection...");
      
      const socket = io("http://localhost:5000", {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5,
        autoConnect: true,
        upgrade: true,
        rememberUpgrade: false
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        setIsConnected(true);
        socket.emit("join-admin-room");
        console.log("Joined admin room");
        
        // Join user-specific room for escalated tasks
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser._id) {
          socket.emit("join-user-room", currentUser._id);
          console.log("Joined user room for:", currentUser._id);
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
        // Try to reconnect after a delay
        setTimeout(() => {
          if (socket.disconnected) {
            console.log("Attempting to reconnect...");
            socket.connect();
          }
        }, 2000);
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
        setIsConnected(true);
        socket.emit("join-admin-room");
      });

      socket.on("admin-room-joined", (data) => {
        console.log("Admin room confirmation:", data);
      });

      socket.on("new-task", (task: DailyTask) => {
        console.log("New task received:", task);
        setTasks(prev => {
          // Check if task already exists to prevent duplicates
          const exists = prev.some(t => t._id === task._id);
          if (exists) {
            console.log("Task already exists, skipping duplicate:", task._id);
            return prev;
          }
          return [task, ...prev];
        });
        setRecentActivity(prev => [{
          type: "new",
          task,
          timestamp: new Date(),
          message: `New task created: ${task.task || 'Untitled task'}`
        }, ...prev.slice(0, 9)]);
        setLastUpdate(new Date());
      });

      socket.on("task-updated", (task: DailyTask) => {
        console.log("Task updated:", task);
        setTasks(prev => {
          const taskExists = prev.some(t => t._id === task._id);
          if (taskExists) {
            // Update existing task
            return prev.map(t => t._id === task._id ? task : t);
          } else {
            // Add new task if it doesn't exist
            return [task, ...prev];
          }
        });
        setRecentActivity(prev => [{
          type: "update",
          task,
          timestamp: new Date(),
          message: `Task updated: ${task.task || 'Untitled task'}`
        }, ...prev.slice(0, 9)]);
        setLastUpdate(new Date());
      });

      socket.on("task-deleted", (data: { id: string }) => {
        console.log("Task deleted:", data.id);
        setTasks(prev => prev.filter(t => t._id !== data.id));
        setRecentActivity(prev => [{
          type: "delete",
          taskId: data.id,
          timestamp: new Date(),
          message: `Task deleted: ${data.id}`
        }, ...prev.slice(0, 9)]);
        setLastUpdate(new Date());
      });

      socket.on("task-status-updated", (task: DailyTask) => {
        console.log("Task status updated:", task);
        setTasks(prev => {
          const taskExists = prev.some(t => t._id === task._id);
          if (taskExists) {
            // Update existing task
            return prev.map(t => t._id === task._id ? task : t);
          } else {
            // Add new task if it doesn't exist
            return [task, ...prev];
          }
        });
        setRecentActivity(prev => [{
          type: "status",
          task,
          timestamp: new Date(),
          message: `Status updated to ${task.status || 'in-progress'}: ${task.task || 'Untitled task'}`
        }, ...prev.slice(0, 9)]);
        setLastUpdate(new Date());
      });

      socket.on("task-stats-update", () => {
        console.log("Stats update received");
        fetchStats();
      });

      socket.on("task-assigned", (data) => {
        console.log("Task assigned to you:", data);
        // Show notification for escalated tasks
        if (data.type === 'task-escalated') {
          alert(`New task assigned to you: ${data.message}`);
          // Refresh the task list to show the new escalated task
          fetchTasks(1, itemsPerPage, true);
        }
      });


      return () => {
        console.log("Cleaning up socket connection");
        socket.emit("leave-admin-room");
        socket.disconnect();
        socketRef.current = null;
      };
    } else {
      // Clean up socket if realtime is disabled
      if (socketRef.current) {
        socketRef.current.emit("leave-admin-room");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    }
  }, [realtimeEnabled]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch tasks when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return; // Only fetch when debounced value matches current
    fetchTasks(1, itemsPerPage, true);
  }, [debouncedSearchTerm]);

  // Fetch tasks from backend
  useEffect(() => {
    fetchTasks(1, itemsPerPage, true);
    fetchStats();
  }, []);

  // Clean up any duplicate tasks on mount
  useEffect(() => {
    setTasks(prev => {
      const seen = new Set();
      return prev.filter(task => {
        if (seen.has(task._id)) {
          return false;
        }
        seen.add(task._id);
        return true;
      });
    });
  }, []);

  const fetchTasks = async (page = 1, limit = itemsPerPage, reset = false) => {
    try {
      if (reset) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      // Check authentication status
      const authHeaders = getAuthHeaders();
      console.log('Auth headers:', authHeaders);
      console.log('Is authenticated:', isAuthenticated());
      
      if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        requireAuth();
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      // Add search term if provided
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      // Add status filter if not 'all'
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      // Add department filter if not 'all'
      if (departmentFilter && departmentFilter !== 'all') {
        params.append('department', departmentFilter);
      }
      
      const res = await fetch(`http://localhost:5000/api/daily-tasks?${params.toString()}`, {
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
      const tasksData = Array.isArray(data.tasks) ? data.tasks : (Array.isArray(data) ? data : []);
      
      // Deduplicate tasks by _id
      const deduplicateTasks = (tasks: DailyTask[]) => {
        const seen = new Set();
        return tasks.filter(task => {
          if (seen.has(task._id)) {
            return false;
          }
          seen.add(task._id);
          return true;
        });
      };
      
      if (reset) {
        setTasks(deduplicateTasks(tasksData));
        setCurrentPage(1);
      } else {
        setTasks(prev => deduplicateTasks([...prev, ...tasksData]));
      }
      
      // Check if there's more data
      setHasMoreData(tasksData.length === limit);
    } catch (err) {
      console.error("Failed to fetch daily tasks", err);
      console.error("Error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      
      // Check if it's a network error
      if (err.message === 'Failed to fetch') {
        console.error("Network error: Backend server might not be running on http://localhost:5000");
        alert("Unable to connect to server. Please ensure the backend server is running on http://localhost:5000");
      }
      
      setTasks([]);
    } finally {
      setIsLoadingMore(false);
      setIsInitialLoading(false);
    }
  };

  // Load more tasks
  const loadMoreTasks = () => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchTasks(nextPage, itemsPerPage, false);
    }
  };

  // Handle search and filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchTasks(1, itemsPerPage, true);
  };

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
    fetchTasks(1, itemsPerPage, true);
  };

  const fetchStats = async () => {
    try {
      // Check authentication status
      const authHeaders = getAuthHeaders();
      console.log('Stats - Auth headers:', authHeaders);
      console.log('Stats - Is authenticated:', isAuthenticated());
      
      if (!isAuthenticated()) {
        console.log('User not authenticated for stats, redirecting to login');
        requireAuth();
        return;
      }
      
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
      console.error("Error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      
      // Check if it's a network error
      if (err.message === 'Failed to fetch') {
        console.error("Network error: Backend server might not be running on http://localhost:5000");
      }
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
          status: "in-progress",
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


  // Get escalation details for tooltip
  const getEscalationDetails = (task: DailyTask) => {
    if (!task.isEscalated) return null;
    
    const escalatedBy = typeof task.escalatedBy === 'string' ? task.escalatedBy : task.escalatedBy?.name || 'Unknown';
    const escalatedTo = typeof task.escalatedTo === 'string' ? task.escalatedTo : task.escalatedTo?.name || 'Unknown';
    const escalatedAt = task.escalatedAt ? new Date(task.escalatedAt).toLocaleDateString() : 'Unknown date';
    const reason = task.escalationReason || 'No reason provided';
    
    return {
      escalatedBy,
      escalatedTo,
      escalatedAt,
      reason
    };
  };

  // Escalate task
  const handleEscalateTask = (task: DailyTask) => {
    setTaskToEscalate(task);
    setEscalateTaskOpen(true);
  };

  const confirmEscalateTask = async () => {
    if (taskToEscalate && escalateToUser) {
      try {
        const res = await fetch(`http://localhost:5000/api/daily-tasks/${taskToEscalate._id}/escalate`, {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            escalatedTo: escalateToUser,
            escalationReason: escalationReason
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
        
        const updated = await res.json();
        setTasks(tasks.map((task) => (task._id === updated._id ? updated : task)));
        setEscalateTaskOpen(false);
        setTaskToEscalate(null);
        setEscalateToUser("");
        setEscalationReason("");
        fetchStats();
      } catch (err) {
        console.error("Failed to escalate task", err);
        alert(`Failed to escalate task: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
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

  // Handle task selection
  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task._id));
    }
    setSelectAll(!selectAll);
  };

  // Bulk delete selected tasks
  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    
    try {
      const deletePromises = selectedTasks.map(taskId => 
        fetch(`http://localhost:5000/api/daily-tasks/${taskId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        })
      );
      
      await Promise.all(deletePromises);
      setTasks(tasks.filter(task => !selectedTasks.includes(task._id)));
      setSelectedTasks([]);
      setSelectAll(false);
      fetchStats();
    } catch (err) {
      console.error("Failed to delete selected tasks", err);
      alert(`Failed to delete selected tasks: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "new":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "update":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "status":
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filter tasks
  const filteredTasks = (tasks || []).filter((task) => {
    const matchesSearch = (task.task?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (task.remarks?.toLowerCase() || '').includes(searchTerm.toLowerCase());
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
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold">Tasks Dashboard</h2>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="h-5 w-5 text-green-300" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-300" />
                  )}
                  <span className="text-sm text-white/80">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
              <p className="max-w-[600px] text-white/80">
                Monitor and manage daily tasks submitted by users across all departments with real-time updates.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="realtime-toggle" className="text-white/80">Real-time</Label>
                  <Switch
                    id="realtime-toggle"
                    checked={realtimeEnabled}
                    onCheckedChange={setRealtimeEnabled}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-2xl bg-white/10 text-white border-white/20 hover:bg-white/20 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                onClick={() => setShowActivity(!showActivity)}
              >
                {showActivity ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showActivity ? "Hide" : "Show"} Activity
              </Button>
              <Button
                className="rounded-2xl bg-white text-emerald-700 hover:bg-white/90 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                onClick={() => setCreateTaskOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Daily Task
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <div className={`grid grid-cols-1 gap-6 transition-all duration-500 ease-in-out ${showActivity ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>
        {/* Statistics Cards */}
        <div className={`space-y-6 transition-all duration-500 ease-in-out ${showActivity ? 'lg:col-span-3' : 'lg:col-span-1'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Filters */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by task or remarks..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 transition-all duration-200 ease-in-out focus:scale-105 focus:shadow-md"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-40 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={handleDepartmentFilterChange}>
                  <SelectTrigger className="w-48 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md">
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

          {/* Task List */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">All Daily Tasks</h3>
                  {selectedTasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {selectedTasks.length} selected
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="rounded-2xl transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                      fetchTasks(1, parseInt(value), true);
                    }}>
                      <SelectTrigger className="w-20 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-2xl transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md">
                    <PanelLeft className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-2xl transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <TooltipProvider>
                <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SR ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isInitialLoading ? (
                    // Loading skeleton
                    Array.from({ length: itemsPerPage }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="px-6 py-4 w-12">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <AnimatePresence>
                      {Array.isArray(filteredTasks) && filteredTasks.length > 0 ? filteredTasks.map((task, idx) => (
                      <motion.tr
                        key={`${task._id}-${idx}-${task.updatedAt || task.createdAt || Date.now()}`}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: idx * 0.03,
                          ease: "easeOut"
                        }}
                        className="hover:bg-gray-50/50 transition-all duration-300 ease-in-out hover:shadow-sm"
                      >
                        {/* Checkbox */}
                        <td className="px-6 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task._id)}
                            onChange={() => handleTaskSelect(task._id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all duration-200 ease-in-out hover:scale-110 hover:shadow-sm"
                          />
                        </td>
                        {/* Task Details */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {task.task || 'No task description'}
                            </p>
                            {task.remarks && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {task.remarks}
                              </p>
                            )}
                          </div>
                        </td>
                        
                        {/* SR ID */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-mono">
                            {task.srId || 'N/A'}
                          </span>
                        </td>
                        
                        {/* User */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {typeof task.user === 'string' 
                                  ? task.user 
                                  : task.user?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {typeof task.user === 'object' && task.user?.email 
                                  ? task.user.email 
                                  : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        {/* Department */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {typeof task.department === 'string' 
                                ? task.department 
                                : task.department?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        
                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(task.status || 'in-progress')}
                            <Badge 
                              variant="secondary"
                              className={`ml-2 text-xs ${getStatusColor(task.status || 'in-progress')}`}
                            >
                              {task.status || 'in-progress'}
                            </Badge>
                          </div>
                        </td>
                        
                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {task.date ? new Date(task.date).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {/* Escalate Button - only show for in-progress tasks that are not already escalated */}
                            {task.status === 'in-progress' && !task.isEscalated && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEscalateTask(task)}
                                    className="h-8 px-3 hover:bg-orange-100 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md text-orange-700 border-orange-300"
                                  >
                                    <ArrowUpDown className="h-4 w-4 mr-1" />
                                    Escalate
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">Escalate Task</p>
                                  <p className="text-xs text-gray-500">Click to escalate this task to another user</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {/* Escalated Task Info - show escalation details */}
                            {task.isEscalated && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center space-x-1 text-orange-600">
                                    <ArrowUpDown className="h-4 w-4" />
                                    <span className="text-sm font-medium">Escalated</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-medium text-orange-600">Task Escalated</p>
                                    {(() => {
                                      const details = getEscalationDetails(task);
                                      if (!details) return <p className="text-xs">No escalation details available</p>;
                                      return (
                                        <>
                                          <p className="text-xs"><span className="font-medium">From:</span> {details.escalatedBy}</p>
                                          <p className="text-xs"><span className="font-medium">To:</span> {details.escalatedTo}</p>
                                          <p className="text-xs"><span className="font-medium">Date:</span> {details.escalatedAt}</p>
                                          {details.reason && (
                                            <p className="text-xs"><span className="font-medium">Reason:</span> {details.reason}</p>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 transition-all duration-200 ease-in-out hover:scale-110 hover:shadow-md"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task)}
                              className="h-8 w-8 p-0 hover:bg-red-100 transition-all duration-200 ease-in-out hover:scale-110 hover:shadow-md"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                      )) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No daily tasks found</p>
                            <p className="text-sm">Create your first daily task to get started.</p>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
              </TooltipProvider>
            </div>
            
            {/* Pagination Info and Load More Button */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {tasks.length} tasks
                  {hasMoreData && ` (${itemsPerPage} per page)`}
                </div>
                {hasMoreData && (
                  <Button
                    onClick={loadMoreTasks}
                    disabled={isLoadingMore}
                    variant="outline"
                    className="rounded-2xl transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Load More Tasks
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <motion.div
          className="lg:col-span-1"
          initial={false}
          animate={{
            opacity: showActivity ? 1 : 0,
            scale: showActivity ? 1 : 0.95,
            x: showActivity ? 0 : 20
          }}
          transition={{
            duration: 0.4,
            ease: "easeInOut"
          }}
          style={{
            display: showActivity ? 'block' : 'none'
          }}
        >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl border shadow-sm h-full"
            >
              <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold">Live Activity</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">Real-time task updates</p>
              </div>
              
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                    <motion.div
                      key={`${activity.timestamp.getTime()}-${idx}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center text-gray-500 py-8">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
        </motion.div>
      </div>

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
            task: editingTask.task,
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

      {/* Escalate Task Modal */}
      <AlertDialog open={escalateTaskOpen} onOpenChange={setEscalateTaskOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escalate Task</AlertDialogTitle>
            <AlertDialogDescription>
              Escalate this task to another user. The task will be transferred to the selected user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="escalate-user">Escalate to User</Label>
              <Select value={escalateToUser} onValueChange={setEscalateToUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="escalation-reason">Reason for Escalation (Optional)</Label>
              <Input
                id="escalation-reason"
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Enter reason for escalation..."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setEscalateTaskOpen(false);
              setTaskToEscalate(null);
              setEscalateToUser("");
              setEscalationReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEscalateTask}
              disabled={!escalateToUser}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Escalate Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
