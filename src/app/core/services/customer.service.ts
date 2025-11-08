import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Customer } from '../interfaces/customer.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private apiService: ApiService) {}

  getCustomers(): Observable<Customer[] | { results: Customer[] }> {
    return this.apiService.get<Customer[] | { results: Customer[] }>('customers/');
  }

  getCustomer(id: string): Observable<Customer> {
    return this.apiService.get<Customer>(`customers/${id}/`);
  }

  createCustomer(data: Partial<Customer>): Observable<Customer> {
    return this.apiService.post<Customer>('customers/', data);
  }
}
