// Database entity types
export interface User {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  password: string | null;
  profile_image?: string | null;
  create_at: Date;
}

export interface Team {
  team_id: number;
  team_name: string;
  create_at: Date;
  create_by: number;
  team_url: string;
}

export interface Project {
  project_id: number;
  create_at: Date;
  description: string;
  team_id: number;
  create_by: number;
  project_url: string | null;
}

export interface Task {
  task_id: number;
  title: string;
  due_date: Date | null;
  priority: number | null;
  description: string | null;
  status: number | null;
  file: Buffer | null;
  project_id: number;
}

export interface TaskComment {
  comment_id: number;
  comment_text: string;
  task_id: number;
  user_id: number;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: number;
  create_at: Date;
  task_id: number;
  type: 'warning' | 'success' | 'info' | 'expired';
}

export interface Belong {
  user_id: number;
  team_id: number;
  join_at: Date;
  role: string | null;
}

export interface Participation {
  user_id: number;
  project_id: number;
}

export interface AssignedTo {
  user_id: number;
  task_id: number;
}

// API Request/Response types
export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface CreateTeamRequest {
  team_name: string;
}

export interface CreateProjectRequest {
  description: string;
  team_id: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  due_date?: string;
  priority?: number;
  status?: number;
  project_id: number;
}

export interface CreateCommentRequest {
  comment_text: string;
  task_id: number;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info' | 'expired';
  task_id: number;
  user_id: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  isExisting?: boolean;
}

// Extended User type with profile image
export interface UserWithProfile extends User {
  profile_image?: string | null;
}
