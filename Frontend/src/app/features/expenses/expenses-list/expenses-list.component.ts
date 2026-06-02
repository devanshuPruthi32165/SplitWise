import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ExpenseService, Expense } from '../../../core/services/expense.service';

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="expenses-container">
      <header class="navbar">
        <div class="container flex-between">
          <h1 class="logo">💰 SplitWise</h1>
          <nav class="nav-links">
            <a routerLink="/dashboard" class="nav-link">Dashboard</a>
            <a routerLink="/groups" class="nav-link">Groups</a>
            <button (click)="logout()" class="btn-secondary">Logout</button>
          </nav>
        </div>
      </header>

      <main class="container">
        <div class="page-header mb-lg">
          <h2>All Expenses</h2>
          <p class="text-muted">View all expenses across your groups</p>
        </div>

        <div *ngIf="expenses.length === 0" class="empty-state card">
          <h3>No expenses yet</h3>
          <p class="text-muted">Add expenses to your groups to see them here</p>
          <a routerLink="/groups" class="btn-primary">Go to Groups</a>
        </div>

        <div *ngIf="expenses.length > 0" class="expenses-grid">
          <div class="summary-card card">
            <h3>Total Expenses</h3>
            <p class="summary-value">₹{{ getTotalExpenses() }}</p>
            <p class="text-muted">{{ expenses.length }} transactions</p>
          </div>

          <div class="expenses-list">
            <div *ngFor="let expense of expenses" class="expense-card card">
              <div class="expense-top flex-between">
                <div>
                  <h4>{{ expense.description }}</h4>
                  <p class="text-muted">{{ expense.group.name }}</p>
                </div>
                <p class="expense-amount">₹{{ expense.amount }}</p>
              </div>

              <div class="expense-details">
                <p class="text-muted">
                  <strong>Paid by:</strong> {{ expense.paidBy.name }}
                </p>
                <p class="text-muted">
                  <strong>Participants:</strong> {{ expense.participants.length }}
                </p>
                <p class="text-muted expense-date">
                  {{ expense.createdAt | date:'medium' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .expenses-container {
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

    .page-header {
      h2 {
        margin-bottom: var(--spacing-sm);
      }
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-2xl);

      h3 {
        margin-bottom: var(--spacing-md);
      }

      p {
        margin-bottom: var(--spacing-lg);
      }

      a {
        display: inline-block;
        text-decoration: none;
        padding: var(--spacing-sm) var(--spacing-lg);
      }
    }

    .expenses-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }

    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;

      h3, p {
        color: white;
      }

      .summary-value {
        font-size: 2.5rem;
        font-weight: 600;
        margin: var(--spacing-md) 0;
      }

      .text-muted {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .expenses-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .expense-card {
      border-left: 4px solid var(--primary);

      .expense-top {
        margin-bottom: var(--spacing-md);

        h4 {
          margin-bottom: var(--spacing-xs);
        }

        p {
          margin: 0;
        }
      }

      .expense-amount {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary);
        margin: 0;
      }

      .expense-details {
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--neutral-200);

        p {
          margin: var(--spacing-xs) 0;
          font-size: 0.875rem;
        }

        .expense-date {
          margin-top: var(--spacing-md);
        }
      }
    }

    @media (max-width: 768px) {
      .nav-links {
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .expenses-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ExpensesListComponent implements OnInit {
  expenses: Expense[] = [];

  constructor(
    private expenseService: ExpenseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.expenseService.getExpenses().subscribe({
      next: (response) => {
        this.expenses = response.expenses.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      error: (err) => console.error('Error loading expenses', err)
    });
  }

  getTotalExpenses(): number {
    return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
