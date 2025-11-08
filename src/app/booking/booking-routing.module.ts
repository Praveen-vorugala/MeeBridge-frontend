import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicBookingComponent } from './public-booking/public-booking.component';

const routes: Routes = [
  { path: ':slug', component: PublicBookingComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookingRoutingModule { }
