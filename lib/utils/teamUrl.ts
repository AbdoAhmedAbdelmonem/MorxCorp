import crypto from 'crypto';
import { db } from '../db_connection';

/**
 * Generates a random 16-digit team URL
 * @returns A promise that resolves to a unique 16-digit string
 */
export async function generateTeamUrl(): Promise<string> {
  let teamUrl: string;
  let isUnique = false;

  while (!isUnique) {
    // Generate 16-digit random number
    const randomNumber = crypto.randomInt(1000000000000000, 10000000000000000);
    teamUrl = randomNumber.toString();

    // Check if this URL already exists in the database
    const [rows]: any = await db.promise().query(
      'SELECT team_url FROM team WHERE team_url = ?',
      [teamUrl]
    );

    if (rows.length === 0) {
      isUnique = true;
      return teamUrl;
    }
  }

  // This should never be reached, but TypeScript requires a return
  throw new Error('Failed to generate unique team URL');
}

/**
 * Generates a random project URL (similar to team URL)
 * @returns A promise that resolves to a unique 16-digit string
 */
export async function generateProjectUrl(): Promise<string> {
  let projectUrl: string;
  let isUnique = false;

  while (!isUnique) {
    // Generate 16-digit random number
    const randomNumber = crypto.randomInt(1000000000000000, 10000000000000000);
    projectUrl = randomNumber.toString();

    // Check if this URL already exists in the database
    const [rows]: any = await db.promise().query(
      'SELECT project_url FROM project WHERE project_url = ?',
      [projectUrl]
    );

    if (rows.length === 0) {
      isUnique = true;
      return projectUrl;
    }
  }

  throw new Error('Failed to generate unique project URL');
}
