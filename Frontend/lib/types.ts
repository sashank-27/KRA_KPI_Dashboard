
export interface User {
  _id: string;
  username?: string;
  name?: string;
  email: string;
  department: string | { _id: string; name: string };
  role: "superadmin" | "admin" | "user";
  joined?: string;
  avatar?: string;
  createdBy?: string | { _id: string; name: string; email: string };
  isSuperAdmin?: boolean;
}

export interface Department {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  members?: number;
  projects?: number;
  color?: string;
}


export interface NewUser {
  username: string;
  name: string;
  email: string;
  password: string;
  department: string;
  role: string;
}

export interface KRA {
  _id: string;
  title: string;
  responsibilityAreas: string[];
  department: string | { _id: string; name: string };
  assignedTo: string | { _id: string; name: string; email: string };
  startDate: string;
  endDate?: string;
  status: "active" | "completed" | "cancelled" | "on-hold";
  createdBy: string | { _id: string; name: string; email: string };
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  createdAt?: string;
  updatedAt?: string;
}

export interface NewKRA {
  title: string;
  responsibilityAreas: string;
  department: string;
  assignedTo: string;
  startDate: string;
  endDate?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

export interface DailyTask {
  _id: string;
  task: string;
  srId: string;
  remarks: string;
  status: "in-progress" | "closed";
  date: string;
  user: string | { _id: string; name: string; email: string };
  department: string | { _id: string; name: string };
  createdBy: string | { _id: string; name: string; email: string };
  tags: string[];
  attachments?: Array<{
    filename: string;
    url: string;
    uploadedAt: string;
  }>;
  // Escalation fields
  escalatedTo?: string | { _id: string; name: string; email: string };
  escalatedBy?: string | { _id: string; name: string; email: string };
  escalatedAt?: string;
  escalationReason?: string;
  isEscalated?: boolean;
  originalUser?: string | { _id: string; name: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface NewDailyTask {
  task: string;
  srId: string;
  remarks: string;
  status: "in-progress" | "closed";
  date: string;
  tags?: string[];
}