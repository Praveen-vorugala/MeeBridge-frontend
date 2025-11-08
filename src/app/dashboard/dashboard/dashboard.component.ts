import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BookingService } from '../../core/services/booking.service';
import { Analytics, StatData } from '../../core/interfaces/analytics.interface';
import { Booking } from '../../core/interfaces/booking.interface';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  analytics: Analytics | null = null;
  upcomingBookings: Booking[] = [];
  loading = true;

  // Chart data
  dailyChartData: any = null;
  weeklyChartData: any = null;
  monthlyChartData: any = null;

  chartOptions: any = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  constructor(
    private analyticsService: AnalyticsService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.analyticsService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.prepareChartData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.loading = false;
      }
    });

    this.bookingService.getUpcomingBookings().subscribe({
      next: (bookings) => {
        this.upcomingBookings = bookings;
      },
      error: (err) => {
        console.error('Error loading upcoming bookings:', err);
      }
    });
  }

  prepareChartData(): void {
    if (!this.analytics) return;

    // Daily chart
    this.dailyChartData = {
      labels: this.analytics.daily_stats.map(s => new Date(s.date!).toLocaleDateString()),
      datasets: [
        {
          label: 'Bookings',
          data: this.analytics.daily_stats.map(s => s.bookings),
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1
        },
        {
          label: 'Completed',
          data: this.analytics.daily_stats.map(s => s.completed),
          backgroundColor: 'rgba(76, 175, 80, 0.6)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        },
        {
          label: 'Cancelled',
          data: this.analytics.daily_stats.map(s => s.cancellations),
          backgroundColor: 'rgba(244, 67, 54, 0.6)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1
        }
      ]
    };

    // Weekly chart
    this.weeklyChartData = {
      labels: this.analytics.weekly_stats.map(s => `Week ${s.week}`),
      datasets: [
        {
          label: 'Bookings',
          data: this.analytics.weekly_stats.map(s => s.bookings),
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1
        }
      ]
    };

    // Monthly chart
    this.monthlyChartData = {
      labels: this.analytics.monthly_stats.map(s => s.month),
      datasets: [
        {
          label: 'Bookings',
          data: this.analytics.monthly_stats.map(s => s.bookings),
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1
        }
      ]
    };
  }
}
