import mysql from 'mysql2';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db_connection';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    const errorResponse = new NextResponse("name is required", { status: 400 });
    return errorResponse;
  }

  return new Promise((resolve) => {
    console.log('Adding user:', name);
    db.query("INSERT INTO USER (name) VALUES (?)", [name], (err: any, result: any) => {
      let response;
      
      if (err) {
        console.error('Add user error:', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
          response = new NextResponse("Error: User with name '" + name + "' already exists!", { status: 400 });
        } else {
          response = new NextResponse("Database Error: " + err.message, { status: 500 });
        }
      } else {
        console.log('User added successfully, ID:', result.insertId);
        response = new NextResponse("User '" + name + "' added successfully with ID: " + result.insertId);
      }
      resolve(response);
    });
  });
}