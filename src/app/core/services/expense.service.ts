import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Expense {
  _id: string;
  group: { _id: string; name: string };
  description: string;
  amount: number;
  paidBy: { _id: string; name: string; email: string };
  participants: Array<{ _id: string; name: string; email: string }>;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = 'http://localhost:5000/api/expenses';

  constructor(private http: HttpClient) { }

  getExpenses(groupId?: string): Observable<{ expenses: Expense[] }> {
    let url = this.apiUrl;
    if (groupId) {
      url += `?groupId=${groupId}`;
    }
    return this.http.get<{ expenses: Expense[] }>(url);
  }

  createExpense(groupId: string, description: string, amount: number, participantIds: string[]): Observable<{ expense: Expense }> {
    return this.http.post<{ expense: Expense }>(this.apiUrl, {
      groupId,
      description,
      amount,
      participantIds
    });
  }
}
