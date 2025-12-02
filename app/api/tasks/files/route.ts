import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/utils/db-helpers';

// GET - Get all files for a task
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const task_id = searchParams.get('task_id');

    if (!task_id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const files = await query(
      `SELECT 
        tf.file_id,
        tf.file_name,
        tf.file_type,
        tf.file_size,
        tf.uploaded_at,
        u.user_id,
        u.first_name,
        u.last_name
      FROM task_files tf
      JOIN user u ON tf.user_id = u.user_id
      WHERE tf.task_id = ?
      ORDER BY tf.uploaded_at DESC`,
      [task_id]
    );

    return NextResponse.json({
      success: true,
      data: files
    });

  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// POST - Upload a file to a task
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const task_id = formData.get('task_id') as string;
    const user_id = formData.get('user_id') as string;

    if (!file || !task_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'File, Task ID, and User ID are required' },
        { status: 400 }
      );
    }

    // Read file as buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file data to database as MEDIUMBLOB
    const result = await execute(
      'INSERT INTO task_files (task_id, user_id, file_name, file_type, file_data, file_size) VALUES (?, ?, ?, ?, ?, ?)',
      [task_id, user_id, file.name, file.type, buffer, file.size]
    );

    // Get the newly created file record with user info
    const newFile = await query(
      `SELECT 
        tf.file_id,
        tf.file_name,
        tf.file_type,
        tf.file_size,
        tf.uploaded_at,
        u.user_id,
        u.first_name,
        u.last_name
      FROM task_files tf
      JOIN user u ON tf.user_id = u.user_id
      WHERE tf.file_id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      data: newFile[0]
    });

  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const file_id = searchParams.get('file_id');
    const user_id = searchParams.get('user_id');

    if (!file_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'File ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get file info
    const fileRecord = await query(
      'SELECT * FROM task_files WHERE file_id = ? AND user_id = ?',
      [file_id, user_id]
    );

    if (fileRecord.length === 0) {
      return NextResponse.json(
        { success: false, error: 'File not found or unauthorized' },
        { status: 403 }
      );
    }

    // Delete from database (file data is stored as BLOB)
    await execute('DELETE FROM task_files WHERE file_id = ?', [file_id]);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
