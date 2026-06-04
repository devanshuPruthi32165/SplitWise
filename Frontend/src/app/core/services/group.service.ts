import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Group {
  _id: string;
  name: string;
  members: Array<{ _id: string; name: string; email: string }>;
  createdBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = 'http://localhost:5000/api/groups';

  constructor(private http: HttpClient) { }

  getGroups(): Observable<{ groups: Group[] }> {
    return this.http.get<{ groups: Group[] }>(this.apiUrl);
  }

  createGroup(name: string, memberIds: string[]): Observable<{ group: Group }> {
    return this.http.post<{ group: Group }>(this.apiUrl, { name, memberIds });
  }

  inviteMember(groupId: string, email: string): Observable<{ group: Group }> {
    return this.http.post<{ group: Group }>(`${this.apiUrl}/${groupId}/invite`, { email });
  }

  getGroupSettlements(groupId: string): Observable<{
    balances: Array<{ userId: string; name: string; email: string; balance: number }>;
    expenses?: any[];
    transfers?: Array<{
      from: { userId: string; name: string; email?: string };
      to: { userId: string; name: string; email?: string };
      amount: number;
    }>;
  }> {
    return this.http.get<{
      balances: Array<{ userId: string; name: string; email: string; balance: number }>;
      expenses?: any[];
      transfers?: Array<{
        from: { userId: string; name: string; email?: string };
        to: { userId: string; name: string; email?: string };
        amount: number;
      }>;
    }>(`${this.apiUrl}/${groupId}/settlements`);
  }

  settle(groupId: string, toUserId: string, amount: number) {
    return this.http.post<{ settlement: any; balances: any; transfers: any[] }>(`${this.apiUrl}/${groupId}/settle`, { toUserId, amount });
  }
}
