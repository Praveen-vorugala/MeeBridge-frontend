import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Booking, Availability, TimeSlot } from '../interfaces/booking.interface';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  constructor(private apiService: ApiService) {}

  getBookings(): Observable<Booking[]> {
    return this.apiService.get<Booking[]>('bookings/');
  }

  getBooking(id: string): Observable<Booking> {
    return this.apiService.get<Booking>(`bookings/${id}/`);
  }

  getUpcomingBookings(): Observable<Booking[]> {
    return this.apiService.get<Booking[]>('bookings/upcoming/');
  }

  createBooking(data: Partial<Booking>): Observable<Booking> {
    return this.apiService.post<Booking>('public/bookings/', data);
  }

  cancelBooking(id: string): Observable<Booking> {
    return this.apiService.post<Booking>(`bookings/${id}/cancel/`, {});
  }

  completeBooking(id: string): Observable<Booking> {
    return this.apiService.post<Booking>(`bookings/${id}/complete/`, {});
  }

  getAvailableSlots(meetingPageId: string, date: string): Observable<{slots: TimeSlot[]}> {
    return this.apiService.get<{slots: TimeSlot[]}>(`public/bookings/available-slots/?meeting_page_id=${meetingPageId}&date=${date}`);
  }

  getAvailabilities(): Observable<Availability[]> {
    return this.apiService.get<Availability[]>('availabilities/');
  }

  createAvailability(data: Partial<Availability>): Observable<Availability> {
    return this.apiService.post<Availability>('availabilities/', data);
  }

  updateAvailability(id: string, data: Partial<Availability>): Observable<Availability> {
    return this.apiService.patch<Availability>(`availabilities/${id}/`, data);
  }

  deleteAvailability(id: string): Observable<void> {
    return this.apiService.delete<void>(`availabilities/${id}/`);
  }
}

