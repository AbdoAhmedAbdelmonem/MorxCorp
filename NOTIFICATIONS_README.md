# Notification System Setup

## Database Migration

Run the following SQL to create the notifications table:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notification (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('task_due', 'profile_update', 'team_added') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created (created_at)
);
```

## Features

### Notification Types

1. **Task Due Soon** (`task_due`)
   - Triggered when a task's due date is within 24 hours
   - Includes task title, project name, and hours until due
   - Related to task_id

2. **Profile Updated** (`profile_update`)
   - Triggered when user updates their profile
   - Lists changed fields (name, location, password)
   - Self-notification

3. **Added to Team** (`team_added`)
   - Triggered when user is added to a team
   - Shows who added them, team name, and role
   - Related to team_id

### API Endpoints

#### GET /api/notifications
Get user notifications
- Query params: `user_id` (required), `unread_only` (optional, boolean)
- Returns: Array of notifications

#### POST /api/notifications
Create a notification manually
- Body: `{ user_id, type, title, message, related_id? }`

#### PUT /api/notifications/read
Mark a single notification as read
- Body: `{ notification_id, user_id }`

#### POST /api/notifications/read
Mark all notifications as read
- Body: `{ user_id }`

#### POST /api/notifications/check-due-tasks
Check for tasks due within 24 hours (cron job)
- Creates notifications for assigned users
- Should be called periodically (e.g., every hour)

### Cron Job Setup

To automatically check for due tasks, set up a cron job to call:
```bash
curl -X POST http://localhost:3000/api/notifications/check-due-tasks
```

Or use a service like:
- Vercel Cron Jobs
- GitHub Actions scheduled workflows
- External cron services (cron-job.org, EasyCron)

### UI Components

**NotificationPanel** - Added to Header component
- Bell icon with unread badge
- Slide-out panel from right side
- Real-time polling every 30 seconds
- Mark as read functionality
- Mark all as read button
- Emoji icons for notification types
- Relative time display (e.g., "2h ago")

### Integration Points

Notifications are automatically created when:
1. User is added to a team (in `/api/teams/[teamUrl]/members`)
2. User updates profile (in `/api/users/update-profile`)
3. Task is created with due date within 24 hours (in `/api/tasks`)
4. Cron job runs to check existing tasks (in `/api/notifications/check-due-tasks`)

## Usage Example

```typescript
// In your component
import { NotificationPanel } from '@/components/notification-panel'

// In header or layout
<NotificationPanel userId={user.user_id} />
```

## Customization

To add new notification types:
1. Add the type to the ENUM in the database
2. Update the `Notification` interface in `notification-panel.tsx`
3. Add an emoji in `getNotificationIcon()` function
4. Create notification in your API endpoint using the POST endpoint
