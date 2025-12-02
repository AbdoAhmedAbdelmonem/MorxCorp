import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { query, queryOne, execute } from '@/lib/utils/db-helpers';
import { CreateCommentRequest, ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body: CreateCommentRequest = await request.json();
    const { comment_text, task_id } = body;

    if (!comment_text || !task_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'comment_text and task_id are required' },
        { status: 400 }
      );
    }

    // Get task to check project
    const task = await queryOne(
      'SELECT project_id FROM task WHERE task_id = ?',
      [task_id]
    );

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user is project participant
    const isParticipant = await queryOne(
      'SELECT * FROM participation WHERE user_id = ? AND project_id = ?',
      [user.id, task.project_id]
    );

    if (!isParticipant) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized: You must be a project participant to comment' },
        { status: 403 }
      );
    }

    // Create comment
    const result = await execute(
      'INSERT INTO task_comment (comment_text, task_id, user_id) VALUES (?, ?, ?)',
      [comment_text, task_id, user.id]
    );

    const commentId = result.insertId;

    // Fetch the created comment
    const newComment = await queryOne(
      `SELECT c.*, u.first_name, u.last_name 
       FROM task_comment c
       LEFT JOIN user u ON c.user_id = u.user_id
       WHERE c.comment_id = ?`,
      [commentId]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Comment created successfully',
        data: newComment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'task_id query parameter is required' },
        { status: 400 }
      );
    }

    // Get task to check project
    const task = await queryOne(
      'SELECT project_id FROM task WHERE task_id = ?',
      [taskId]
    );

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user is project participant
    const isParticipant = await queryOne(
      'SELECT * FROM participation WHERE user_id = ? AND project_id = ?',
      [user.id, task.project_id]
    );

    if (!isParticipant) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized: You must be a project participant to view comments' },
        { status: 403 }
      );
    }

    // Get all comments for the task
    const comments = await query(
      `SELECT c.*, u.first_name, u.last_name, u.email
       FROM task_comment c
       LEFT JOIN user u ON c.user_id = u.user_id
       WHERE c.task_id = ?
       ORDER BY c.comment_id ASC`,
      [taskId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
