import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MeetingPageService } from '../../../core/services/meeting-page.service';
import { MeetingPage, FieldConfig } from '../../../core/interfaces/meeting-page.interface';

@Component({
  selector: 'app-meeting-page-detail',
  templateUrl: './meeting-page-detail.component.html',
  styleUrls: ['./meeting-page-detail.component.css']
})
export class MeetingPageDetailComponent implements OnInit {
  meetingPage: MeetingPage | null = null;
  loading = true;
  saving = false;
  editMode = false;
  pageForm: FormGroup;
  pageId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private meetingPageService: MeetingPageService
  ) {
    this.pageForm = this.fb.group({
      title: ['', Validators.required],
      slug: ['', Validators.required],
      event_type: [''],
      duration_minutes: [30, [Validators.required, Validators.min(5)]],
      layout_style: ['classic', Validators.required],
      theme: this.fb.group({
        primaryColor: ['#667eea'],
        accentColor: ['#764ba2'],
        buttonStyle: ['rounded']
      })
    });
  }

  ngOnInit(): void {
    this.pageId = this.route.snapshot.paramMap.get('id');
    if (this.pageId) {
      this.loadMeetingPage(this.pageId);
    }
  }

  loadMeetingPage(id: string): void {
    this.loading = true;
    this.meetingPageService.getMeetingPage(id).subscribe({
      next: (page) => {
        this.meetingPage = page;
        this.pageForm.patchValue({
          title: page.title,
          slug: page.slug,
          event_type: page.event_type,
          duration_minutes: page.duration_minutes,
          layout_style: page.layout_style,
          theme: {
            primaryColor: page.theme?.primaryColor || '#667eea',
            accentColor: page.theme?.accentColor || '#764ba2',
            buttonStyle: page.theme?.buttonStyle || 'rounded'
          }
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading meeting page:', err);
        this.loading = false;
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.meetingPage) {
      this.pageForm.patchValue({
        title: this.meetingPage.title,
        slug: this.meetingPage.slug,
        event_type: this.meetingPage.event_type,
        duration_minutes: this.meetingPage.duration_minutes,
        layout_style: this.meetingPage.layout_style,
        theme: {
          primaryColor: this.meetingPage.theme?.primaryColor || '#667eea',
          accentColor: this.meetingPage.theme?.accentColor || '#764ba2',
          buttonStyle: this.meetingPage.theme?.buttonStyle || 'rounded'
        }
      });
    }
  }

  saveChanges(): void {
    if (!this.meetingPage || !this.pageId || this.pageForm.invalid) {
      this.pageForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.pageForm.value;
    this.meetingPageService.updateMeetingPage(this.pageId, formValue).subscribe({
      next: (updatedPage) => {
        this.meetingPage = updatedPage;
        this.saving = false;
        this.editMode = false;
      },
      error: (err) => {
        console.error('Error saving meeting page:', err);
        this.saving = false;
      }
    });
  }

  updateColorValue(colorType: 'primaryColor' | 'accentColor', value: string): void {
    const themeControl = this.pageForm.get('theme');
    if (themeControl) {
      themeControl.patchValue({ [colorType]: value });
    }
  }

  getFieldDisplay(field: FieldConfig): string {
    switch (field.type) {
      case 'text':
        return 'Text Input';
      case 'email':
        return 'Email Input';
      case 'phone':
        return 'Phone Input';
      case 'dropdown':
        return 'Dropdown';
      case 'checkbox':
        return 'Checkbox';
      case 'date':
        return 'Date Picker';
      case 'textarea':
        return 'Textarea';
      default:
        return field.type;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/meeting-pages']);
  }

  openBuilder(): void {
    if (this.meetingPage) {
      this.router.navigate(['/builder'], { queryParams: { id: this.meetingPage.id } });
    }
  }

  openPublicPage(): void {
    if (this.meetingPage) {
      window.open(`/booking/${this.meetingPage.slug}`, '_blank');
    }
  }
}
