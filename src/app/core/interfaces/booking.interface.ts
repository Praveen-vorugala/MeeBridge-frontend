export interface Booking {
  id: string;
  meeting_page: string;
  user_input: any;
  date: string;
  status: 'booked' | 'cancelled' | 'completed';
  attendee_email: string;
  attendee_name: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  user: string;
  weekday: number;
  weekday_display: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  time: string;
  display: string;
}

