import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../core/services/booking.service';
import { Availability } from '../../core/interfaces/booking.interface';

@Component({
  selector: 'app-availability',
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.css']
})
export class AvailabilityComponent implements OnInit {
  availabilities: Availability[] = [];
  weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  newAvailability: Partial<Availability> = {
    weekday: 0,
    start_time: '09:00',
    end_time: '17:00',
    is_active: true
  };
  showAddForm = false;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadAvailabilities();
  }

  loadAvailabilities(): void {
    this.bookingService.getAvailabilities().subscribe({
      next: (availabilities) => {
        this.availabilities = availabilities;
      },
      error: (err) => console.error('Error loading availabilities:', err)
    });
  }

  addAvailability(): void {
    this.bookingService.createAvailability(this.newAvailability).subscribe({
      next: () => {
        this.loadAvailabilities();
        this.showAddForm = false;
        this.newAvailability = { weekday: 0, start_time: '09:00', end_time: '17:00', is_active: true };
      },
      error: (err) => console.error('Error creating availability:', err)
    });
  }

  deleteAvailability(id: string): void {
    if (confirm('Are you sure you want to delete this availability?')) {
      this.bookingService.deleteAvailability(id).subscribe({
        next: () => this.loadAvailabilities(),
        error: (err) => console.error('Error deleting availability:', err)
      });
    }
  }
}
