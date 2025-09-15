"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Menu, PanelLeft, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Department, NewUser, User, KRA, NewKRA, DailyTask, NewDailyTask } from "@/lib/types";
import { logout, getAuthHeaders, getCurrentUser, isAuthenticated, requireAuth, isAdmin } from "@/lib/auth";
import { DepartmentManagement } from "@/components/management/DepartmentManagement";
import { UserManagement } from "@/components/management/UserManagement";
import { KRAManagement } from "@/components/management/KRAManagement";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MyKRADashboard } from "@/components/dashboard/MyKRADashboard";
import { MyTasksDashboard } from "@/components/dashboard/MyTasksDashboard";
import { EscalatedTasksDashboard } from "@/components/dashboard/EscalatedTasksDashboard";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { Sidebar } from "@/components/sidebar/Sidebar";

export function KRADashboard() {
  // Fetch all users and departments from backend on mount
  useEffect(() => {
    // Check if user is authenticated before making API calls
    if (!isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      requireAuth();
      return;
    }
    
    fetchUsers();
    fetchDepartments();
    fetchCurrentUser();
    fetchSystemHealth();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setIsLoadingCurrentUser(true);
      const res = await fetch("http://localhost:5000/api/me", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Unauthorized access, redirecting to login');
          requireAuth();
          return;
        }
        throw new Error(`Failed to fetch current user: ${res.status} ${res.statusText}`);
      }
      const userData = await res.json();
      console.log('Current user data from API:', userData);
      setCurrentUser(userData);
      
      // Set admin status and adjust default tab
      const isAdminUser = userData.role === 'admin' || userData.role === 'superadmin';
      setIsUserAdmin(isAdminUser);
      
      // Set default tab based on role
      if (isAdminUser && activeTab === "my-kra") {
        setActiveTab("home"); // Admin users start with Dashboard
      }
    } catch (err) {
      console.error("Failed to fetch current user", err);
      // Fallback to JWT token data (only on client side)
      if (typeof window !== 'undefined') {
        const tokenUser = getCurrentUser();
        console.log('JWT token user data:', tokenUser);
        if (tokenUser) {
          const isAdminUser = tokenUser.role === 'admin' || tokenUser.role === 'superadmin';
          setIsUserAdmin(isAdminUser);
          
          setCurrentUser({
            _id: tokenUser.id,
            email: tokenUser.email,
            role: tokenUser.role as "superadmin" | "admin" | "user",
            name: "User",
            username: "user",
            department: "Unknown",
            joined: new Date().toISOString(),
          });
          
          // Set default tab based on role
          if (isAdminUser && activeTab === "my-kra") {
            setActiveTab("home"); // Admin users start with Dashboard
          }
        } else {
          // Set a default user if no token is available
          setIsUserAdmin(false);
          setCurrentUser({
            _id: "guest",
            email: "guest@example.com",
            role: "user" as "superadmin" | "admin" | "user",
            name: "Guest User",
            username: "guest",
            department: "Unknown",
            joined: new Date().toISOString(),
          });
        }
      }
    } finally {
      setIsLoadingCurrentUser(false);
    }
  };

  // Update current user profile
  const handleUpdateProfile = async (updatedUser: Partial<User>) => {
    try {
      const res = await fetch("http://localhost:5000/api/me", {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(updatedUser),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updatedData = await res.json();
      setCurrentUser(updatedData);
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      setIsLoadingDepartments(true);
      const res = await fetch("http://localhost:5000/api/departments", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Unauthorized access, redirecting to login');
          requireAuth();
          return;
        }
        throw new Error(`Failed to fetch departments: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      // Ensure data is an array
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch departments", err);
      // Always set an empty array as fallback
      setDepartments([]);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      setIsLoadingSystemHealth(true);
      const res = await fetch("http://localhost:5000/api/health", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch system health");
      const data = await res.json();
      setSystemHealth(data);
    } catch (err) {
      console.error("Failed to fetch system health", err);
      setSystemHealth(null);
    } finally {
      setIsLoadingSystemHealth(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await fetch("http://localhost:5000/api/users", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Unauthorized access, redirecting to login');
          requireAuth();
          return;
        }
        throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      console.log('Fetched users:', data);
      console.log('Current user role:', currentUser.role);
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Create user
  const handleCreateUser = async (user: Omit<User, "_id">) => {
    try {
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error("Failed to create user");
      fetchUsers();
      setCreateUserOpen(false);
    } catch (err) {
      console.error("Failed to create user", err);
    }
  };

  // Update user
  const handleUpdateUser = async (id: string, user: Partial<User>) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error("Failed to update user");
      fetchUsers();
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };

  // Delete user
  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };
  // User list state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  // Modal state for Add User
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    username: "",
    name: "",
    email: "",
    password: "",
    department: "",
    role: "",
  });
  const [currentUser, setCurrentUser] = useState<User>({
    _id: "",
    username: "",
    name: "",
    email: "",
    department: "",
    role: "user" as "superadmin" | "admin" | "user",
    joined: "",
  });
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("my-kra"); // Default to my-kra for non-admin users
  const [notifications, setNotifications] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [newDeptName, setNewDeptName] = useState("");
  const [createDeptOpen, setCreateDeptOpen] = useState(false);
  const [activeManagementView, setActiveManagementView] = useState<
    "all" | "user" | "department" | "kra"
  >("all");
  // Department list state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  
  // KRA list state
  const [kras, setKras] = useState<KRA[]>([]);
  const [isLoadingKRAs, setIsLoadingKRAs] = useState(true);
  const [createKRAOpen, setCreateKRAOpen] = useState(false);
  const [newKRA, setNewKRA] = useState<NewKRA>({
    title: "",
    responsibilityAreas: "",
    department: "",
    assignedTo: "",
    startDate: "",
    endDate: "",
    description: "",
    priority: "medium",
  });
  
  // System health state
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoadingSystemHealth, setIsLoadingSystemHealth] = useState(true);
  // Modal input state

  // Handle tab access restrictions
  useEffect(() => {
    // Only redirect if we have loaded the user data and user is not admin
    if (!isLoadingCurrentUser && !isUserAdmin && (activeTab === "home" || activeTab === "apps")) {
      setActiveTab("my-kra");
    }
  }, [isUserAdmin, activeTab, isLoadingCurrentUser]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 -z-10 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
            "radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.5) 0%, rgba(81, 45, 168, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
            "radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.5) 0%, rgba(32, 119, 188, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
            "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
          ],
        }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        expandedItems={expandedItems}
        setExpandedItems={setExpandedItems}
        activeManagementView={activeManagementView}
        setActiveManagementView={setActiveManagementView}
        currentUser={currentUser}
      />

      {/* Main Content */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:pl-64" : "md:pl-0"
        )}
      >
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">KRA & KPI Dashboard</h1>
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-2xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all duration-200 group"
                      onClick={logout}
                    >
                      <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Logout</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-2xl relative"
                    >
                      <Bell className="h-5 w-5" />
                      {notifications > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                          {notifications}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <button onClick={() => setActiveTab("profile")}>
                <Avatar className="h-9 w-9 border-2 border-primary cursor-pointer hover:border-primary/80 transition-colors">
                  <AvatarImage
                    src={currentUser.avatar || ""}
                    alt="User"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold">
                    {(currentUser.name || "User")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Tabs
            defaultValue="home"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <TabsList className={`grid w-full max-w-[1200px] ${isLoadingCurrentUser ? 'grid-cols-6' : (isUserAdmin ? 'grid-cols-6' : 'grid-cols-4')} rounded-2xl p-1`}>
                {(isLoadingCurrentUser || isUserAdmin) && (
                  <TabsTrigger
                    value="home"
                    className="rounded-xl data-[state=active]:rounded-xl"
                  >
                    Dashboard
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="my-kra"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  My KRA
                </TabsTrigger>
                <TabsTrigger
                  value="my-tasks"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  My Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="escalated-tasks"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  Escalated
                </TabsTrigger>
                {(isLoadingCurrentUser || isUserAdmin) && (
                  <TabsTrigger
                    value="apps"
                    className="rounded-xl data-[state=active]:rounded-xl"
                    onClick={() => setActiveManagementView("all")}
                  >
                    Management
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="profile"
                  className="rounded-xl data-[state=active]:rounded-xl"
                >
                  Profile
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {isUserAdmin && (
                  <TabsContent value="home" className="space-y-8 mt-0">
                    <DashboardOverview
                      users={users}
                      departments={departments}
                      systemHealth={systemHealth}
                      isLoadingSystemHealth={isLoadingSystemHealth}
                      onCreateUser={() => setCreateUserOpen(true)}
                      onCreateDepartment={() => setCreateDeptOpen(true)}
                    />
                  </TabsContent>
                )}

                <TabsContent value="my-kra" className="space-y-8 mt-0">
                  {currentUser._id ? (
                    <MyKRADashboard currentUserId={currentUser._id} />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading user data...</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="my-tasks" className="space-y-8 mt-0">
                  {currentUser._id ? (
                    <MyTasksDashboard 
                      currentUserId={currentUser._id} 
                      departments={departments}
                      users={users}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading user data...</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="escalated-tasks" className="space-y-8 mt-0">
                  {currentUser._id ? (
                    <EscalatedTasksDashboard 
                      currentUserId={currentUser._id} 
                      departments={departments}
                      users={users}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading user data...</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {isUserAdmin && (
                  <TabsContent value="apps" className="space-y-6 mt-0">
                    {/* Management page styled like Files page */}
                    {(activeManagementView === "all" ||
                      activeManagementView === "department") && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <DepartmentManagement
                          departments={departments}
                          setDepartments={setDepartments}
                          createDeptOpen={createDeptOpen}
                          setCreateDeptOpen={setCreateDeptOpen}
                          newDeptName={newDeptName}
                          setNewDeptName={setNewDeptName}
                          users={users}
                        />
                      </motion.div>
                    )}

                    {/* User Management section below departments */}
                    {(activeManagementView === "all" ||
                      activeManagementView === "user") && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <UserManagement
                          users={users}
                          setUsers={setUsers}
                          createUserOpen={createUserOpen}
                          setCreateUserOpen={setCreateUserOpen}
                          newUser={newUser}
                          setNewUser={setNewUser}
                          departments={departments}
                          onCreateUser={handleCreateUser}
                          onUpdateUser={handleUpdateUser}
                          onDeleteUser={handleDeleteUser}
                        />
                      </motion.div>
                    )}

                    {/* KRA Management section */}
                    {(activeManagementView === "all" ||
                      activeManagementView === "kra") && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <KRAManagement
                          departments={departments}
                          users={users}
                        />
                      </motion.div>
                    )}

                  </TabsContent>
                )}

                <TabsContent value="profile" className="space-y-8 mt-0">
                  {isLoadingCurrentUser ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading profile...</p>
                      </div>
                    </div>
                  ) : (
                                <ProfilePage
              currentUser={{
                username: currentUser.username ?? "",
                name: currentUser.name ?? "",
                email: currentUser.email ?? "",
                department:
                  typeof currentUser.department === "string"
                    ? currentUser.department
                    : currentUser.department?.name ?? "",
                role: currentUser.role ?? "",
                joined: currentUser.joined ?? "",
                createdBy: currentUser.createdBy,
              }}
              onUpdateProfile={handleUpdateProfile}
            />
                  )}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
