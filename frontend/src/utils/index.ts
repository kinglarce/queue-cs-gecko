import { Ticket } from "@/types";

/**
 * Format a date as a relative time string (e.g., "5 minutes ago")
 */
export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  return date.toLocaleString();
}

/**
 * Format a duration in minutes to a human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    return 'less than a minute';
  }
  
  if (minutes < 60) {
    return `${Math.floor(minutes)} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Safely parse a date string and return a formatted time string
 */
export function formatTime(dateString: string | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error parsing date:', error);
    return '';
  }
}

/**
 * Generate a color based on a string (useful for consistent colors per name)
 */
export function getColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-indigo-100 text-indigo-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-teal-100 text-teal-800',
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Calculate the position of a ticket in the waiting queue
 */
export function calculateTicketPosition(ticket: Ticket, allTickets: Ticket[]): number {
  if (!ticket || ticket.status !== 'waiting') return -1;
  
  const waitingTickets = allTickets
    .filter(t => t.status === 'waiting')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  return waitingTickets.findIndex(t => t.id === ticket.id) + 1;
}

/**
 * Calculate the estimated wait time based on position and average time per person
 */
export function calculateWaitTime(position: number, averageMinutesPerPerson: number = 3): number {
  if (position <= 0) return 0;
  return position * averageMinutesPerPerson;
}

/**
 * Shorten a UUID for display purposes
 */
export function shortenId(id: string): string {
  if (!id) return '';
  return id.slice(0, 8);
}

/**
 * Check if notifications are supported in the browser
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!areNotificationsSupported()) {
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Show a notification
 */
export function showNotification(title: string, options?: NotificationOptions): boolean {
  if (!areNotificationsSupported() || Notification.permission !== 'granted') {
    return false;
  }
  
  try {
    new Notification(title, options);
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
} 