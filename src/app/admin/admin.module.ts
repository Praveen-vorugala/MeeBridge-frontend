import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { MeetingPagesListComponent } from './meeting-pages/meeting-pages-list/meeting-pages-list.component';
import { MeetingPageDetailComponent } from './meeting-pages/meeting-page-detail/meeting-page-detail.component';
import { CustomersListComponent } from './customers/customers-list/customers-list.component';
import { CustomerDetailComponent } from './customers/customer-detail/customer-detail.component';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    MeetingPagesListComponent,
    MeetingPageDetailComponent,
    CustomersListComponent,
    CustomerDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    AdminRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ]
})
export class AdminModule { }
