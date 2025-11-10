import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ElementRef, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { forkJoin } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { MeetingPageService } from '../../core/services/meeting-page.service';
import { Booking } from '../../core/interfaces/booking.interface';
import { MeetingPage } from '../../core/interfaces/meeting-page.interface';

interface MeetingEvent {
  id: string;
  title: string;
  attendeeName: string;
  attendeeEmail: string;
  start: Date;
  end: Date;
  meetingPageId: string;
  notes?: string;
  userInput?: any;
  meetingLink: string;
}

@Component({
  selector: 'app-meeting-calendar',
  templateUrl: './meeting-calendar.component.html',
  styleUrls: ['./meeting-calendar.component.css']
})
export class MeetingCalendarComponent implements OnInit, OnDestroy {
  loading = true;
  events: MeetingEvent[] = [];
  weekEvents: MeetingEvent[] = [];
  weekDays: Date[] = [];
  hours: { label: string; minutes: number }[] = [];
  weekStart: Date = this.getStartOfWeek(new Date());
  readonly dayStartHour = 0;
  readonly dayEndHour = 24;
  readonly minuteHeight = 0.8; // px per minute

  private meetingPageMap = new Map<string, MeetingPage>();
  private overlayRef: OverlayRef | null = null;
  private readonly fallbackTimezone = 'UTC';
  private readonly fallbackMeetingLink = 'https://meet.google.com/kro-egve-ssm';

  @ViewChild('eventDetailTemplate') eventDetailTemplate!: TemplateRef<any>;

  constructor(
    private bookingService: BookingService,
    private meetingPageService: MeetingPageService,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    this.hours = this.generateHours();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.disposeOverlay();
  }

  loadData(): void {
    this.loading = true;
    forkJoin([
      this.bookingService.getBookings(),
      this.meetingPageService.getMeetingPages()
    ]).subscribe({
      next: ([bookingsResponse, pagesResponse]) => {
        const meetingPages = this.extractList<MeetingPage>(pagesResponse);
        meetingPages.forEach((page) => this.meetingPageMap.set(page.id, page));

        const bookingList = this.extractList<Booking>(bookingsResponse);
        this.events = bookingList
          .map((booking) => this.transformBooking(booking))
          .filter((event): event is MeetingEvent => !!event);

        this.buildWeek();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading calendar data:', err);
        this.loading = false;
      }
    });
  }

  changeWeek(offset: number): void {
    const newDate = new Date(this.weekStart);
    newDate.setDate(newDate.getDate() + offset * 7);
    this.weekStart = this.getStartOfWeek(newDate);
    this.buildWeek();
    this.disposeOverlay();
  }

  goToToday(): void {
    this.weekStart = this.getStartOfWeek(new Date());
    this.buildWeek();
    this.disposeOverlay();
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  eventsForDay(day: Date): MeetingEvent[] {
    return this.weekEvents.filter(event => this.isSameDay(event.start, day));
  }

  eventStyle(event: MeetingEvent): { [key: string]: string } {
    const dayStart = new Date(event.start);
    dayStart.setHours(this.dayStartHour, 0, 0, 0);
    const minutesFromStart = (event.start.getTime() - dayStart.getTime()) / 60000;
    const durationMinutes = (event.end.getTime() - event.start.getTime()) / 60000;

    const top = Math.max(0, minutesFromStart * this.minuteHeight);
    const height = Math.max(32, durationMinutes * this.minuteHeight);

    return {
      top: `${top}px`,
      height: `${height}px`
    };
  }

  openDetails(mouseEvent: MouseEvent, event: MeetingEvent): void {
    const origin = new ElementRef(mouseEvent.currentTarget as HTMLElement);
    const positionStrategy = this.createOverlayPositionStrategy(origin);

    if (this.overlayRef) {
      this.overlayRef.updatePositionStrategy(positionStrategy);
    } else {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'calendar-overlay-backdrop',
        panelClass: 'calendar-overlay-panel',
        positionStrategy
      });
      this.overlayRef.backdropClick().subscribe(() => this.disposeOverlay());
    }

    const portal = new TemplatePortal(this.eventDetailTemplate, this.viewContainerRef, { $implicit: event });
    this.overlayRef.attach(portal);
  }

  joinMeeting(link: string): void {
    if (link) {
      window.open(link, '_blank');
    }
  }

  closeDetails(): void {
    this.disposeOverlay();
  }

  getWeekRangeLabel(): string {
    const start = this.weekDays[0];
    const end = this.weekDays[this.weekDays.length - 1];
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  private transformBooking(booking: Booking): MeetingEvent | null {
    if (!booking.user_input) {
      return null;
    }

    const userInput = booking.user_input as Record<string, any>;
    const selectedDate = userInput['selected_date'];
    const selectedTime = userInput['selected_time'];
    const timezone = userInput['timezone'] || this.fallbackTimezone;
    if (!selectedDate || !selectedTime) {
      return null;
    }

    const start = this.combineDateTime(selectedDate, selectedTime, timezone);
    if (!start) {
      return null;
    }

    const meetingPage = booking.meeting_page ? this.meetingPageMap.get(booking.meeting_page) : undefined;
    const duration = meetingPage?.duration_minutes || 60;
    const end = new Date(start.getTime() + duration * 60000);
    const attendeeName = booking.attendee_name || userInput['name'] || userInput['attendee_name'] || 'Guest';
    const attendeeEmail = booking.attendee_email || userInput['email'] || userInput['attendee_email'] || '';
    const meetingLink = userInput['meeting_link'] || (meetingPage as any)?.meeting_link || this.fallbackMeetingLink;

    return {
      id: booking.id,
      title: meetingPage?.title || 'Meeting',
      attendeeName,
      attendeeEmail,
      start,
      end,
      meetingPageId: booking.meeting_page,
      notes: booking.notes,
      userInput: booking.user_input,
      meetingLink
    };
  }

  private buildWeek(): void {
    this.weekDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(this.weekStart);
      day.setDate(this.weekStart.getDate() + index);
      return day;
    });

    this.weekEvents = this.events.filter(event => {
      return event.start >= this.weekDays[0] && event.start < this.addDays(this.weekDays[this.weekDays.length - 1], 1);
    });
  }

  private generateHours(): { label: string; minutes: number }[] {
    const hours: { label: string; minutes: number }[] = [];
    for (let hour = this.dayStartHour; hour <= this.dayEndHour; hour++) {
      const label = this.formatHourLabel(hour);
      hours.push({ label, minutes: hour * 60 });
    }
    return hours;
  }

  private formatHourLabel(hour24: number): string {
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = ((hour24 + 11) % 12) + 1;
    return `${hour12}${suffix}`;
  }

  getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private extractList<T>(response: T[] | { results?: T[] } | null | undefined): T[] {
    if (!response) {
      return [];
    }
    if (Array.isArray(response)) {
      return response;
    }
    const results = (response as { results?: T[] }).results;
    return Array.isArray(results) ? results : [];
  }

  private createOverlayPositionStrategy(origin: ElementRef<HTMLElement>): FlexibleConnectedPositionStrategy {
    const positions: ConnectedPosition[] = [
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'top',
        offsetY: -12
      },
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: 12
      }
    ];
    return this.overlay.position().flexibleConnectedTo(origin).withPositions(positions).withFlexibleDimensions(false).withPush(true);
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private combineDateTime(dateStr: string, timeStr: string, timeZone: string): Date | null {
    if (!dateStr || !timeStr) {
      return null;
    }
    const base = new Date(`${dateStr}T${timeStr}:00`);
    if (isNaN(base.getTime())) {
      return null;
    }
    try {
      const tzDate = new Date(base.toLocaleString('en-US', { timeZone }));
      const diff = base.getTime() - tzDate.getTime();
      return new Date(base.getTime() + diff);
    } catch (error) {
      console.warn('Unable to apply timezone conversion for', timeZone, error);
      return base;
    }
  }
}
