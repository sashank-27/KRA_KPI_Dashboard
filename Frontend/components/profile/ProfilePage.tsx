"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  User,
  Users,
  Mail,
  Building,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Bell,
  Globe,
  Lock,
  Activity,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfilePageProps {
  currentUser: {
    username: string;
    name: string;
    email: string;
    department: string;
    role: string;
    joined: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    createdBy?: string | { _id: string; name: string; email: string };
  };
  onUpdateProfile: (updatedUser: any) => Promise<void>;
}

export function ProfilePage({
  currentUser,
  onUpdateProfile,
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(currentUser);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    weekly: true,
  });

  const handleSave = async () => {
    try {
      await onUpdateProfile(editedUser);
      setIsEditing(false);
      setPreviewImage(null);
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleCancel = () => {
    setEditedUser(currentUser);
    setIsEditing(false);
    setPreviewImage(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Convert to base64 for now (in production, you'd upload to a file storage service)
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Update the edited user with the new image
      setEditedUser({
        ...editedUser,
        avatar: base64,
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const event = {
          target: { files: [file] }
        } as React.ChangeEvent<HTMLInputElement>;
        handleImageUpload(event);
      }
    }
  };

  // Mock data for activities and achievements
  const activities = [
    {
      id: 1,
      action: "Completed project review",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: 2,
      action: "Updated department settings",
      time: "1 day ago",
      type: "info",
    },
    {
      id: 3,
      action: "Added new team member",
      time: "3 days ago",
      type: "success",
    },
    {
      id: 4,
      action: "Generated monthly report",
      time: "1 week ago",
      type: "info",
    },
  ];

  const achievements = [
    {
      id: 1,
      title: "Team Leader",
      description: "Led 5+ successful projects",
      icon: Award,
      color: "text-yellow-500",
    },
    {
      id: 2,
      title: "Collaborator",
      description: "Worked with 10+ departments",
      icon: Users,
      color: "text-blue-500",
    },
    {
      id: 3,
      title: "Innovator",
      description: "Implemented 3 new processes",
      icon: Star,
      color: "text-purple-500",
    },
  ];

  const stats = [
    { label: "Projects Completed", value: 12, total: 15, color: "bg-blue-500" },
    { label: "Team Members", value: 8, total: 10, color: "bg-green-500" },
    { label: "Goals Achieved", value: 7, total: 10, color: "bg-purple-500" },
    { label: "Hours Logged", value: 240, total: 300, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white/20">
                <AvatarImage
                  src={previewImage || editedUser.avatar || currentUser.avatar || ""}
                  alt={currentUser.name}
                />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold">
                  {(currentUser.name || "User")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white text-gray-700 hover:bg-gray-100"
                  onClick={handleCameraClick}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{currentUser.name || "User"}</h1>
              <p className="text-white/80 text-lg">
                {currentUser.role || "Member"} • {currentUser.department || "Unknown Department"}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  {currentUser.role || "Member"}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  Member since {formatDate(currentUser.joined || "")}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <Button
                className="rounded-2xl bg-white text-purple-700 hover:bg-white/90"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="rounded-2xl bg-white text-green-700 hover:bg-white/90"
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-white text-white hover:bg-white/10"
                  onClick={handleCancel}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl">
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-xl">
            Activity
          </TabsTrigger>
          <TabsTrigger value="achievements" className="rounded-xl">
            Achievements
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Your personal and professional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Profile Picture Upload Section - Only show in edit mode */}
                  {isEditing && (
                    <div className="space-y-4">
                      <Label>Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <div 
                          className="relative cursor-pointer"
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={handleCameraClick}
                        >
                          <Avatar className="h-16 w-16 border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
                            <AvatarImage
                              src={previewImage || editedUser.avatar || currentUser.avatar || ""}
                              alt={currentUser.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold">
                              {(currentUser.name || "User")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-full transition-colors flex items-center justify-center">
                            <Camera className="h-4 w-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCameraClick}
                              disabled={isUploadingImage}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              {isUploadingImage ? "Uploading..." : "Change Photo"}
                            </Button>
                            {previewImage && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPreviewImage(null);
                                  setEditedUser({ ...editedUser, avatar: currentUser.avatar });
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG or GIF. Max size 5MB. Click avatar or drag & drop to upload.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedUser.name}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, name: e.target.value })
                        }
                        className="rounded-xl"
                      />
                    ) : (
                      <p className="text-sm font-medium">{currentUser.name || "No name set"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedUser.email}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            email: e.target.value,
                          })
                        }
                        className="rounded-xl"
                      />
                    ) : (
                      <p className="text-sm font-medium">{currentUser.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Select
                        value={editedUser.department}
                        onValueChange={(value) =>
                          setEditedUser({ ...editedUser, department: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Development">
                            Development
                          </SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium">
                        {currentUser.department}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    {isEditing ? (
                      <Select
                        value={editedUser.role}
                        onValueChange={(value) =>
                          setEditedUser({ ...editedUser, role: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Member">Member</SelectItem>
                          <SelectItem value="Intern">Intern</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium">{currentUser.role}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={editedUser.bio || ""}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, bio: e.target.value })
                        }
                        placeholder="Tell us about yourself..."
                        className="rounded-xl"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {currentUser.bio || "No bio available"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Stats
                  </CardTitle>
                  <CardDescription>
                    Your progress and achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {stat.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {stat.value}/{stat.total}
                        </span>
                      </div>
                      <Progress
                        value={(stat.value / stat.total) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Quick Info
                  </CardTitle>
                  <CardDescription>
                    Important details at a glance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-xs text-muted-foreground">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Department</p>
                      <p className="text-xs text-muted-foreground">
                        {currentUser.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Joined</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(currentUser.joined || "")}
                      </p>
                    </div>
                  </div>
                  {currentUser.createdBy && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Created by</p>
                        <p className="text-xs text-muted-foreground">
                          {typeof currentUser.createdBy === 'string' 
                            ? currentUser.createdBy 
                            : currentUser.createdBy.name || currentUser.createdBy.email}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-xs text-muted-foreground">
                        {currentUser.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest actions and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/50"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === "success"
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements & Badges
                </CardTitle>
                <CardDescription>
                  Your accomplishments and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 text-center"
                    >
                      <achievement.icon
                        className={`h-8 w-8 mx-auto mb-2 ${achievement.color}`}
                      />
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get instant notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, push: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive text messages
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, sms: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Get weekly performance summaries
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weekly}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, weekly: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
