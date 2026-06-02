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
}
