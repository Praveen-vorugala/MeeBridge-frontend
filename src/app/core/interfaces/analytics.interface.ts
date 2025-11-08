export interface Analytics {
  total_bookings: number;
  total_cancellations: number;
  total_completed: number;
  average_booking_rate_per_week: number;
  upcoming_meetings_count: number;
  daily_stats: StatData[];
  weekly_stats: StatData[];
  monthly_stats: StatData[];
}

export interface StatData {
  date?: string;
  week?: string;
  month?: string;
  bookings: number;
  cancellations: number;
  completed: number;
}

