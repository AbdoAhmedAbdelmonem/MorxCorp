import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/utils/db-helpers';

// GET - Download a file by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const file_id = searchParams.get('file_id');

    if (!file_id) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    const fileData = await query(
      'SELECT file_name, file_type, file_data FROM task_files WHERE file_id = ?',
      [file_id]
    );

    if (!fileData || fileData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    const file = fileData[0];

    // Return file as blob
    return new NextResponse(file.file_data, {
      headers: {
        'Content-Type': file.file_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.file_name}"`,
      },
    });

  } catch (error) {
    console.error('Download file error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
