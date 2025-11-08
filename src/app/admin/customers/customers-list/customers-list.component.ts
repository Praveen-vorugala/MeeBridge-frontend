import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer } from '../../../core/interfaces/customer.interface';

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.css']
})
export class CustomersListComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = true;
  searchTerm = '';

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        const records = Array.isArray(response) ? response : response?.results || [];
        this.customers = records;
        this.filteredCustomers = [...this.customers];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.loading = false;
      }
    });
  }

  onSearch(term: string): void {
    const lowered = term.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer => {
      const name = customer.attendee_name?.toLowerCase() || '';
      const email = customer.attendee_email?.toLowerCase() || '';
      const meetingTitle = customer.meeting_page_title?.toLowerCase() || '';
      return name.includes(lowered) || email.includes(lowered) || meetingTitle.includes(lowered);
    });
  }

  viewCustomer(customer: Customer): void {
    this.router.navigate(['/admin/customers', customer.id]);
  }
}
