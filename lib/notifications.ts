// Utility functions for managing email notifications

export async function triggerNewMatchNotification(matchId: string) {
  try {
    const response = await fetch('/api/notifications/new-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to trigger notification:', error);
    return { success: false, error };
  }
}

export async function processEmailQueue() {
  try {
    const response = await fetch('/api/notifications/process-queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || process.env.WEBHOOK_SECRET}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to process email queue:', error);
    return { success: false, error };
  }
}

// Helper function to format currency for South African Rand
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to format date for emails
export function formatEventDate(date: string | Date): string {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  return eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}