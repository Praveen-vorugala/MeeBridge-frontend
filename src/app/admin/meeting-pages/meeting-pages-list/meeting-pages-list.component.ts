import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MeetingPageService } from '../../../core/services/meeting-page.service';
import { MeetingPage } from '../../../core/interfaces/meeting-page.interface';

@Component({
  selector: 'app-meeting-pages-list',
  templateUrl: './meeting-pages-list.component.html',
  styleUrls: ['./meeting-pages-list.component.css']
})
export class MeetingPagesListComponent implements OnInit {
  meetingPages: MeetingPage[] = [];
  filteredPages: MeetingPage[] = [];
  loading = true;
  searchTerm = '';

  constructor(
    private meetingPageService: MeetingPageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMeetingPages();
  }

  loadMeetingPages(): void {
    this.meetingPageService.getMeetingPages().subscribe({
      next: (response) => {
        const pages = Array.isArray(response) ? response : response?.results || [];
        this.meetingPages = pages;
        this.filteredPages = [...this.meetingPages];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading meeting pages:', err);
        this.loading = false;
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.filteredPages = this.meetingPages.filter(page => {
      const title = page.title?.toLowerCase() || '';
      const slug = page.slug?.toLowerCase() || '';
      const eventType = page.event_type?.toLowerCase() || '';
      return (
        title.includes(this.searchTerm) ||
        slug.includes(this.searchTerm) ||
        eventType.includes(this.searchTerm)
      );
    });
  }

  viewPage(page: MeetingPage): void {
    this.router.navigate(['/admin/meeting-pages', page.id]);
  }

  openBuilder(page: MeetingPage): void {
    this.router.navigate(['/builder'], { queryParams: { id: page.id } });
  }
}
