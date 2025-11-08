import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MeetingPageService } from '../../core/services/meeting-page.service';
import { MeetingPage, FieldConfig } from '../../core/interfaces/meeting-page.interface';

@Component({
  selector: 'app-page-builder',
  templateUrl: './page-builder.component.html',
  styleUrls: ['./page-builder.component.css']
})
export class PageBuilderComponent implements OnInit {
  meetingPages: MeetingPage[] = [];
  selectedPage: MeetingPage | null = null;
  pageForm: FormGroup;
  fieldTypes = ['text', 'email', 'phone', 'dropdown', 'checkbox', 'date', 'textarea'];
  loading = false;
  selectedPageLoading = false;
  private initialPageId: string | null = null;

  constructor(
    private meetingPageService: MeetingPageService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.pageForm = this.fb.group({
      title: [''],
      slug: [''],
      event_type: ['default'],
      duration_minutes: [30],
      layout_style: ['classic'],
      theme: this.fb.group({
        primaryColor: ['#667eea'],
        accentColor: ['#764ba2'],
        buttonStyle: ['rounded']
      }),
      fields: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.initialPageId = params.get('id');
      this.loadMeetingPages();
    });
  }

  loadMeetingPages(): void {
    this.loading = true;
    this.meetingPageService.getMeetingPages().subscribe({
      next: (response) => {
        this.loading = false;
        const pages = Array.isArray(response) ? response : response?.results || [];
        this.meetingPages = pages;

        if (this.meetingPages.length > 0) {
          const preferredId = this.initialPageId || this.selectedPage?.id || this.meetingPages[0].id;
          if (preferredId) {
            this.selectPage(preferredId);
          }
          this.initialPageId = null;
        } else {
          this.resetFormForNewPage();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading meeting pages:', err);
        this.selectedPage = null;
        this.meetingPages = [];
        alert('Error loading meeting pages. Please refresh the page.');
      }
    });
  }

  selectPage(pageId: string): void {
    if (!pageId) {
      return;
    }

    this.selectedPageLoading = true;
    this.meetingPageService.getMeetingPage(pageId).subscribe({
      next: (page) => {
        this.selectedPageLoading = false;
        this.applySelectedPage(page);
        const index = this.meetingPages.findIndex(p => p.id === page.id);
        if (index !== -1) {
          this.meetingPages[index] = page;
        }
      },
      error: (err) => {
        this.selectedPageLoading = false;
        console.error('Error loading meeting page:', err);
        alert('Unable to load meeting page details. Please try again.');
      }
    });
  }

  private applySelectedPage(page: MeetingPage): void {
    this.selectedPage = page;

    const themeValue = page.theme || {
      primaryColor: '#667eea',
      accentColor: '#764ba2',
      buttonStyle: 'rounded'
    };

    this.pageForm.patchValue({
      title: page.title || '',
      slug: page.slug || '',
      event_type: page.event_type || 'default',
      duration_minutes: page.duration_minutes || 30,
      layout_style: page.layout_style || 'classic',
      theme: themeValue
    });

    const fieldsArray = this.pageForm.get('fields') as FormArray;
    fieldsArray.clear();
    if (page.fields && Array.isArray(page.fields)) {
      page.fields.forEach(field => {
        fieldsArray.push(this.createFieldFormGroup(field));
      });
    }
  }

  private resetFormForNewPage(): void {
    this.selectedPage = null;
    this.pageForm.reset({
      title: '',
      slug: '',
      event_type: 'default',
      duration_minutes: 30,
      layout_style: 'classic',
      theme: {
        primaryColor: '#667eea',
        accentColor: '#764ba2',
        buttonStyle: 'rounded'
      },
      fields: []
    });
    const fieldsArray = this.pageForm.get('fields') as FormArray;
    fieldsArray.clear();
  }

  createFieldFormGroup(field?: FieldConfig): FormGroup {
    return this.fb.group({
      id: [field?.id || this.generateId()],
      type: [field?.type || 'text'],
      label: [field?.label || ''],
      name: [field?.name || ''],
      required: [field?.required || false],
      options: [field?.options || []],
      placeholder: [field?.placeholder || ''],
      order: [field?.order || 0]
    });
  }

  getFieldOptions(fieldIndex: number): string[] {
    const field = this.fieldsArray.at(fieldIndex);
    const options = field?.get('options')?.value;
    return Array.isArray(options) ? options : [];
  }

  addOptionToField(fieldIndex: number, option: string): void {
    if (!option.trim()) return;
    const field = this.fieldsArray.at(fieldIndex);
    const currentOptions = this.getFieldOptions(fieldIndex);
    if (!currentOptions.includes(option.trim())) {
      field?.patchValue({ options: [...currentOptions, option.trim()] });
    }
  }

  removeOptionFromField(fieldIndex: number, optionIndex: number): void {
    const field = this.fieldsArray.at(fieldIndex);
    const currentOptions = this.getFieldOptions(fieldIndex);
    currentOptions.splice(optionIndex, 1);
    field?.patchValue({ options: currentOptions });
  }

  get fieldsArray(): FormArray {
    return this.pageForm.get('fields') as FormArray;
  }

  addField(): void {
    this.fieldsArray.push(this.createFieldFormGroup());
  }

  removeField(index: number): void {
    this.fieldsArray.removeAt(index);
  }

  savePage(): void {
    if (!this.selectedPage || !this.selectedPage.id) {
      alert('No page selected');
      return;
    }

    if (!this.pageForm.valid) {
      alert('Please fill in all required fields');
      return;
    }

    const formValue = this.pageForm.value;
    // Ensure fields have proper structure
    if (formValue.fields) {
      formValue.fields = formValue.fields.map((field: any, index: number) => ({
        ...field,
        order: index,
        options: field.type === 'dropdown' && field.options ? field.options : undefined
      }));
    }

    this.meetingPageService.updateMeetingPage(this.selectedPage.id, formValue).subscribe({
      next: (page) => {
        this.selectedPage = page;
        this.loadMeetingPages();
        alert('Page saved successfully!');
      },
      error: (err) => {
        console.error('Error saving page:', err);
        alert('Error saving page: ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  createNewPage(): void {
    if (!this.pageForm.valid) {
      alert('Please fill in all required fields');
      return;
    }

    const formValue = { ...this.pageForm.value };
    if (!formValue.title) {
      alert('Please enter a title');
      return;
    }
    
    if (!formValue.slug) {
      formValue.slug = formValue.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    // Ensure fields have proper structure
    if (formValue.fields) {
      formValue.fields = formValue.fields.map((field: any, index: number) => ({
        ...field,
        order: index,
        options: field.type === 'dropdown' && field.options ? field.options : undefined
      }));
    }

    this.meetingPageService.createMeetingPage(formValue).subscribe({
      next: (page) => {
        this.selectedPage = page;
        this.loadMeetingPages();
        alert('Page created successfully!');
      },
      error: (err) => {
        console.error('Error creating page:', err);
        alert('Error creating page: ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  generateId(): string {
    return 'field_' + Math.random().toString(36).substr(2, 9);
  }

  moveFieldUp(index: number): void {
    if (index > 0) {
      const fields = this.fieldsArray;
      const field = fields.at(index);
      fields.removeAt(index);
      fields.insert(index - 1, field);
      this.updateFieldOrders();
    }
  }

  moveFieldDown(index: number): void {
    if (index < this.fieldsArray.length - 1) {
      const fields = this.fieldsArray;
      const field = fields.at(index);
      fields.removeAt(index);
      fields.insert(index + 1, field);
      this.updateFieldOrders();
    }
  }

  updateFieldOrders(): void {
    this.fieldsArray.controls.forEach((control, index) => {
      control.patchValue({ order: index });
    });
  }

  getPublicUrl(): string {
    if (this.selectedPage) {
      return `${window.location.origin}/booking/${this.selectedPage.slug}`;
    }
    return '';
  }

  createNewPageMode(): void {
    this.initialPageId = null;
    this.resetFormForNewPage();
  }

  updateColorValue(colorType: 'primaryColor' | 'accentColor', value: string): void {
    const themeControl = this.pageForm.get('theme');
    if (themeControl) {
      themeControl.patchValue({ [colorType]: value });
    }
  }
}
