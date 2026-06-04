import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.constants';

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
  private apiUrl = `${API_BASE_URL}/expenses`;

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

  updateExpense(expenseId: string, data: { description?: string; amount?: number; participantIds?: string[] }) {
    return this.http.patch<{ expense: Expense }>(`${this.apiUrl}/${expenseId}`, data);
  }

  deleteExpense(expenseId: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${expenseId}`);
  }
}
