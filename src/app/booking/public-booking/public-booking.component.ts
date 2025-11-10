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

interface RequiredFieldDefinition {
  name: string;
  label: string;
  type: FieldConfig['type'];
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
  maxBookingDate = this.computeMaxBookingDate(3);
  currentStep = 1;
  private readonly defaultTimezone = 'Asia/Kolkata';
  readonly defaultDescription = 'Please pick a convenient date and time to schedule your meeting.';
  private readonly requiredFieldDefinitions: RequiredFieldDefinition[] = [
    { name: 'name', label: 'Full Name', type: 'text' },
    { name: 'email', label: 'Email Address', type: 'email' }
  ];

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
        const normalizedFields = this.ensureRequiredFields(page.fields || []);
        this.meetingPage = { ...page, fields: normalizedFields };
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
    const fields = this.ensureRequiredFields(this.meetingPage.fields || []);
    this.meetingPage = { ...this.meetingPage, fields };
    fields.forEach((field: FieldConfig) => {
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

    const duration = this.meetingPage?.duration_minutes || 30;
    const baseSlots = this.generateFallbackSlots(duration);

    this.bookingService.getAvailableSlots(this.meetingPage.id, dateIso, timezone).subscribe({
      next: (response) => {
        const slots = response?.slots || [];

        if (slots.length === 0) {
          this.availableSlots = baseSlots;
          return;
        }

        const busyTimes = new Set(
          slots
            .filter(slot => (slot.status || '').toLowerCase() !== 'cancelled')
            .map(slot => this.extractTimeKey(slot.time, timezone))
            .filter((timeKey): timeKey is string => !!timeKey)
        );

        const filtered = baseSlots.filter(slot => !busyTimes.has(slot.time));

        this.availableSlots = filtered.length > 0 ? filtered : [];
      },
      error: (err) => {
        console.error('Error loading slots:', err);
        this.availableSlots = baseSlots;
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
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  private extractTimeKey(isoTime: string, timezone?: string | null): string | null {
    if (!isoTime) {
      return null;
    }

    const date = new Date(isoTime);
    if (isNaN(date.getTime())) {
      return null;
    }

    const tz = timezone || this.slotForm.get('timezone')?.value || this.defaultTimezone;
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: tz
      });
      const parts = formatter.formatToParts(date);
      const hour = parts.find(part => part.type === 'hour')?.value ?? '00';
      const minute = parts.find(part => part.type === 'minute')?.value ?? '00';
      return `${hour}:${minute}`;
    } catch (error) {
      console.warn('Failed to format busy slot time', error);
      return null;
    }
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

  private computeMaxBookingDate(monthsAhead: number): Date {
    const max = new Date();
    max.setHours(23, 59, 59, 999);
    max.setMonth(max.getMonth() + monthsAhead);
    return max;
  }

  private ensureRequiredFields(fields: FieldConfig[]): FieldConfig[] {
    const result: FieldConfig[] = [];
    const remaining = [...fields];

    this.requiredFieldDefinitions.forEach((def, index) => {
      const existingIndex = remaining.findIndex(f => (f.name || '').toLowerCase() === def.name);
      const existing = existingIndex >= 0 ? remaining.splice(existingIndex, 1)[0] : undefined;
      const ensured: FieldConfig = {
        id: existing?.id || this.generateId(),
        type: def.type,
        label: existing?.label || def.label,
        name: def.name,
        required: true,
        options: undefined,
        placeholder: existing?.placeholder || '',
        order: index
      };
      result.push(ensured);
    });

    const others = remaining.map((field, idx) => ({
      ...field,
      order: result.length + idx
    }));

    return [...result, ...others];
  }

  private generateId(): string {
    return 'field_' + Math.random().toString(36).substr(2, 9);
  }
}
