import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OverlayModule } from '@angular/cdk/overlay';
import { RouterModule } from '@angular/router';

import { CalendarRoutingModule } from './calendar-routing.module';
import { AvailabilityComponent } from './availability/availability.component';
import { SharedModule } from '../shared/shared.module';
import { MeetingCalendarComponent } from './meeting-calendar/meeting-calendar.component';

@NgModule({
  declarations: [
    AvailabilityComponent,
    MeetingCalendarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CalendarRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatListModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    OverlayModule,
    SharedModule
  ]
})
export class CalendarModule { }
