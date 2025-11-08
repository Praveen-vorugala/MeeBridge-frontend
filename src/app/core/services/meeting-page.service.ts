import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MeetingPage } from '../interfaces/meeting-page.interface';

@Injectable({
  providedIn: 'root'
})
export class MeetingPageService {
  constructor(private apiService: ApiService) {}

  getMeetingPages(): Observable<any> {
    return this.apiService.get<any>('meeting-pages/');
  }

  getMeetingPage(id: string): Observable<MeetingPage> {
    return this.apiService.get<MeetingPage>(`meeting-pages/${id}/`);
  }

  getMeetingPageBySlug(slug: string): Observable<MeetingPage> {
    return this.apiService.get<MeetingPage>(`public/meeting-pages/${slug}/`);
  }

  createMeetingPage(data: Partial<MeetingPage>): Observable<MeetingPage> {
    return this.apiService.post<MeetingPage>('meeting-pages/', data);
  }

  updateMeetingPage(id: string, data: Partial<MeetingPage>): Observable<MeetingPage> {
    return this.apiService.patch<MeetingPage>(`meeting-pages/${id}/`, data);
  }

  deleteMeetingPage(id: string): Observable<void> {
    return this.apiService.delete<void>(`meeting-pages/${id}/`);
  }
}

