import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GroupService, Group } from '../../core/services/group.service';
import { ExpenseService, Expense } from '../../core/services/expense.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <header class="navbar">
        <div class="container flex-between">
          <h1 class="logo">💰 SplitWise</h1>
          <nav class="nav-links">
            <a routerLink="/groups" class="nav-link">Groups</a>
            <a routerLink="/expenses" class="nav-link">Expenses</a>
            <button (click)="logout()" class="btn-secondary">Logout</button>
          </nav>
        </div>
      </header>

      <main class="container dashboard-main">
        <div class="welcome-section mb-lg">
          <h2>Welcome, {{ currentUser?.name }}</h2>
          <p class="text-muted">Manage your group expenses and settlements</p>
        </div>

        <div class="dashboard-grid">
          <div class="stats-card card">
            <h3>Total Groups</h3>
            <p class="stat-value">{{ groups.length }}</p>
          </div>

          <div class="stats-card card">
            <h3>Recent Expenses</h3>
            <p class="stat-value">{{ expenses.length }}</p>
          </div>

          <div class="stats-card card">
            <h3>Quick Actions</h3>
            <div class="actions">
              <a routerLink="/groups" class="btn-primary">Manage Groups</a>
              <a routerLink="/expenses" class="btn-secondary">View Expenses</a>
            </div>
          </div>
        </div>

        <div class="recent-section mt-lg">
          <h3>Recent Groups</h3>
          <div *ngIf="groups.length === 0" class="empty-state">
            <p>No groups yet. <a routerLink="/groups">Create one</a></p>
          </div>
          <div *ngIf="groups.length > 0" class="groups-list">
            <div *ngFor="let group of groups.slice(0, 5)" class="group-item card">
              <h4>{{ group.name }}</h4>
              <p class="text-muted">{{ group.members.length }} members</p>
              <a [routerLink]="['/group', group._id]" class="btn-primary">View</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background-color: #f5f7fa;
    }

    .navbar {
      background: white;
      padding: var(--spacing-lg) 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: var(--spacing-2xl);
    }

    .logo {
      margin: 0;
      font-size: 1.5rem;
    }

    .nav-links {
      display: flex;
      gap: var(--spacing-lg);
      align-items: center;

      .nav-link {
        text-decoration: none;
        color: var(--neutral-600);
        font-weight: 500;
        transition: color 0.2s;

        &:hover {
          color: var(--primary);
        }
      }
    }

    .dashboard-main {
      margin-bottom: var(--spacing-2xl);
    }

    .welcome-section {
      h2 {
        margin-bottom: var(--spacing-sm);
      }
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-lg);
    }

    .stats-card {
      h3 {
        margin-bottom: var(--spacing-md);
        color: var(--neutral-600);
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 600;
        color: var(--primary);
        margin: 0;
      }

      .actions {
        display: flex;
        gap: var(--spacing-md);
        margin-top: var(--spacing-md);

        a {
          flex: 1;
          text-align: center;
          padding: var(--spacing-sm) var(--spacing-md);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }
      }
    }

    .recent-section {
      h3 {
        margin-bottom: var(--spacing-lg);
      }
    }

    .empty-state {
      background: white;
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      text-align: center;
      color: var(--neutral-500);

      a {
        color: var(--primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .groups-list {
      display: grid;
      gap: var(--spacing-md);

      .group-item {
        h4 {
          margin-bottom: var(--spacing-sm);
        }

        a {
          display: inline-block;
          padding: var(--spacing-sm) var(--spacing-lg);
          text-decoration: none;
        }
      }
    }

    @media (max-width: 768px) {
      .nav-links {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: flex-end;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  groups: Group[] = [];
  expenses: Expense[] = [];

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private expenseService: ExpenseService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });

    this.loadGroups();
    this.loadExpenses();
  }

  loadGroups(): void {
    this.groupService.getGroups().subscribe({
      next: (response: any) => {
        this.groups = response.groups;
      },
      error: (err: any) => {
        console.error('Error loading groups', err);
      }
    });
  }

  loadExpenses(): void {
    this.expenseService.getExpenses().subscribe({
      next: (response: any) => {
        this.expenses = response.expenses;
      },
      error: (err: any) => {
        console.error('Error loading expenses', err);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
