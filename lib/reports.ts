import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

const REPORTS_COLLECTION = 'reports';

export interface ReportProblemInput {
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  description: string;
}

/**
 * Submit a problem report
 */
export async function submitReport(
  user: User,
  category: string,
  description: string
): Promise<string> {
  try {
    if (!description.trim()) {
      throw new Error('Please describe your problem');
    }

    const reportData = {
      userId: user.uid,
      userName: user.displayName || user.email || 'User',
      userEmail: user.email || '',
      category: category.trim(),
      description: description.trim(),
      createdAt: serverTimestamp(),
      status: 'pending', // pending, reviewed, resolved
    };

    const ref = await addDoc(collection(db, REPORTS_COLLECTION), reportData);
    return ref.id;
  } catch (error: any) {
    console.error('Error submitting report:', error);
    throw error;
  }
}

export const REPORT_CATEGORIES = [
  { id: 'bug', label: 'Bug / App not working', icon: 'bug' },
  { id: 'feature', label: 'Feature request', icon: 'lightbulb-outline' },
  { id: 'activity', label: 'Activity / Join issue', icon: 'calendar-alert' },
  { id: 'chat', label: 'Chat / Messages issue', icon: 'message-alert' },
  { id: 'account', label: 'Account / Profile issue', icon: 'account-alert' },
  { id: 'other', label: 'Other', icon: 'help-circle' },
] as const;
