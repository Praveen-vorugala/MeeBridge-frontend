export interface Customer {
  id: string;
  meeting_page: string;
  meeting_page_title?: string;
  attendee_name: string;
  attendee_email: string;
  booking_date: string;
  timezone?: string;
  notes?: string;
  user_input?: any;
  metadata?: any;
  meta_data?: any;
  created_at: string;
  updated_at: string;
}
