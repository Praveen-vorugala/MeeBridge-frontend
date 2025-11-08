import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MeetingPageService } from '../../core/services/meeting-page.service';
import { BookingService } from '../../core/services/booking.service';
import { MeetingPage, FieldConfig } from '../../core/interfaces/meeting-page.interface';
import { Booking, TimeSlot } from '../../core/interfaces/booking.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';

interface TimezoneOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-public-booking',
  templateUrl: './public-booking.component.html',
  styleUrls: ['./public-booking.component.css']
})
export class PublicBookingComponent implements OnInit {
  meetingPage: MeetingPage | null = null;
  bookingForm: FormGroup;
  slotForm: FormGroup;
  availableSlots: TimeSlot[] = [];
  selectedDateIso = '';
  selectedSlotDisplay = '';
  loading = true;
  submitted = false;
  minBookingDate = new Date();
  currentStep = 1;
  private readonly defaultTimezone = 'Asia/Kolkata';

  timezones: TimezoneOption[] = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore Time' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time' }
  ];

  constructor(
    private route: ActivatedRoute,
    private meetingPageService: MeetingPageService,
    private bookingService: BookingService,
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {
    this.bookingForm = this.fb.group({});
    this.slotForm = this.fb.group({
      date: [null, Validators.required],
      time: ['', Validators.required],
      timezone: [this.defaultTimezone, Validators.required]
    });

    this.slotForm.get('timezone')?.valueChanges.subscribe(() => {
      if (this.selectedDateIso) {
        this.clearSelectedSlot();
        this.fetchAvailableSlots(this.selectedDateIso);
      }
    });
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadMeetingPage(slug);
    }
  }

  loadMeetingPage(slug: string): void {
    this.meetingPageService.getMeetingPageBySlug(slug).subscribe({
      next: (page) => {
        this.meetingPage = page;
        this.buildForm();
        this.resetSelection();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading meeting page:', err);
        this.loading = false;
      }
    });
  }

  buildForm(): void {
    if (!this.meetingPage) return;

    const formControls: Record<string, any> = {};
    this.meetingPage.fields.forEach((field: FieldConfig) => {
      const validators = field.required ? [Validators.required] : [];
      formControls[field.name] = ['', validators];
    });

    this.bookingForm = this.fb.group(formControls);
  }

  onCalendarDateSelected(date: Date): void {
    this.slotForm.patchValue({ date, time: '' });
    this.selectedSlotDisplay = '';
    this.availableSlots = [];
    this.selectedDateIso = date ? this.formatDate(date) : '';
    if (this.selectedDateIso) {
      this.fetchAvailableSlots(this.selectedDateIso);
    }
  }

  private fetchAvailableSlots(dateIso: string): void {
    if (!this.meetingPage) {
      return;
    }
    const timezone = this.slotForm.get('timezone')?.value || this.defaultTimezone;
    this.clearSelectedSlot();
    this.availableSlots = [];

    this.bookingService.getAvailableSlots(this.meetingPage.id, dateIso).subscribe({
      next: (response) => {
        const slots = response?.slots || [];
        if (slots.length > 0) {
          this.availableSlots = slots;
        } else {
          const duration = this.meetingPage?.duration_minutes || 30;
          this.availableSlots = this.generateFallbackSlots(duration);
        }
      },
      error: (err) => {
        console.error('Error loading slots:', err);
        const duration = this.meetingPage?.duration_minutes || 30;
        this.availableSlots = this.generateFallbackSlots(duration);
      }
    });
  }

  selectTime(slot: TimeSlot): void {
    this.slotForm.patchValue({ time: slot.time });
    this.selectedSlotDisplay = slot.display;
  }

  isSlotSelected(slot: TimeSlot): boolean {
    return this.slotForm.get('time')?.value === slot.time;
  }

  continueToStep2(): void {
    if (this.slotForm.invalid || !this.selectedSlotDisplay) {
      this.slotForm.markAllAsTouched();
      return;
    }
    this.currentStep = 2;
  }

  goBackToStep1(): void {
    this.currentStep = 1;
  }

  getTimezoneLabel(value: string | null | undefined): string {
    if (!value) {
      return 'Not selected';
    }
    return this.timezones.find(tz => tz.value === value)?.label || value;
  }

  onSubmit(): void {
    if (!this.slotForm.valid) {
      this.currentStep = 1;
      this.slotForm.markAllAsTouched();
      return;
    }

    if (this.bookingForm.valid && this.meetingPage) {
      const slotValue = this.slotForm.value;
      const bookingDateIso = this.formatDate(slotValue.date);
      const sanitizedTime = (slotValue.time || '').includes('T') ? slotValue.time.split('T')[1] : slotValue.time;
      if (!bookingDateIso || !sanitizedTime) {
        alert('Please select a date and time.');
        return;
      }

      const normalizedFormValue = this.normalizeFormValue(this.bookingForm.value);
      const bookingDateTime = `${bookingDateIso}T${sanitizedTime}:00`;
      const { timezone } = slotValue;

      const attendeeName = normalizedFormValue['name'] || normalizedFormValue['attendee_name'] || 'Guest';
      const attendeeEmail = normalizedFormValue['email'] || normalizedFormValue['attendee_email'] || '';
      const notes = normalizedFormValue['notes'] || '';

      const combinedUserInput = {
        ...normalizedFormValue,
        selected_date: bookingDateIso,
        selected_time: sanitizedTime,
        timezone
      };

      const bookingData: Partial<Booking> = {
        meeting_page: this.meetingPage.id,
        user_input: combinedUserInput,
        date: bookingDateTime,
        attendee_email: attendeeEmail,
        attendee_name: attendeeName,
        notes,
        status: 'booked' as const
      };

      this.bookingService.createBooking(bookingData).subscribe({
        next: () => {
          // this.createCustomerRecord({
          //   meeting_page: this.meetingPage!.id,
          //   attendee_name: attendeeName,
          //   attendee_email: attendeeEmail,
          //   booking_date: bookingDateTime,
          //   timezone,
          //   notes,
          //   user_input: combinedUserInput
          // });
          this.submitted = true;
        },
        error: (err) => {
          console.error('Error creating booking:', err);
          alert('Error creating booking. Please try again.');
        }
      });
    } else {
      this.bookingForm.markAllAsTouched();
    }
  }

  private createCustomerRecord(payload: Partial<{ meeting_page: string; attendee_name: string; attendee_email: string; booking_date: string; timezone?: string; notes?: string; user_input?: any; }>): void {
    this.customerService.createCustomer(payload).subscribe({
      error: (err) => {
        console.error('Error creating customer record:', err);
      }
    });
  }

  private normalizeFormValue(value: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    Object.keys(value).forEach((key) => {
      const fieldValue = value[key];
      if (fieldValue instanceof Date) {
        normalized[key] = this.formatDate(fieldValue);
      } else {
        normalized[key] = fieldValue;
      }
    });
    return normalized;
  }

  private formatDate(date: Date | string): string {
    if (!date) {
      return '';
    }
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      return '';
    }
    return d.toISOString().split('T')[0];
  }

  private resetSelection(): void {
    this.slotForm.patchValue({ date: null, time: '', timezone: this.defaultTimezone }, { emitEvent: false });
    this.availableSlots = [];
    this.selectedDateIso = '';
    this.selectedSlotDisplay = '';
    this.currentStep = 1;
  }

  private clearSelectedSlot(): void {
    this.selectedSlotDisplay = '';
    this.slotForm.patchValue({ time: '' }, { emitEvent: false });
  }

  private generateFallbackSlots(durationMinutes: number): TimeSlot[] {
    const step = durationMinutes > 0 ? durationMinutes : 30;
    const startMinutes = 9 * 60; // 9:00 AM
    const endMinutes = 17 * 60; // 5:00 PM
    const slots: TimeSlot[] = [];

    for (let minutes = startMinutes; minutes + step <= endMinutes; minutes += step) {
      slots.push({
        time: this.formatTimeValue(minutes),
        display: this.formatDisplayTime(minutes)
      });
    }

    return slots;
  }

  private formatTimeValue(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private formatDisplayTime(totalMinutes: number): string {
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const suffix = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = ((hours24 + 11) % 12) + 1;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  }
}
