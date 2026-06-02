import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupService, Group } from '../../../core/services/group.service';
import { ExpenseService, Expense } from '../../../core/services/expense.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="group-detail-container">
      <header class="navbar">
        <div class="container flex-between">
          <h1 class="logo">💰 SplitWise</h1>
          <nav class="nav-links">
            <a routerLink="/groups" class="nav-link">Groups</a>
            <a routerLink="/dashboard" class="nav-link">Dashboard</a>
            <button (click)="logout()" class="btn-secondary">Logout</button>
          </nav>
        </div>
      </header>

      <main class="container">
        <a routerLink="/groups" class="back-link">← Back to Groups</a>

        <div *ngIf="group" class="group-header card mb-lg">
          <h2>{{ group.name }}</h2>
          <p class="text-muted">{{ group.members.length }} members</p>
          <div class="members">
            <div *ngFor="let member of group.members" class="member-card">
              <span class="member-avatar">{{ member.name.substring(0, 2).toUpperCase() }}</span>
              <div>
                <p class="member-name">{{ member.name }}</p>
                <p class="text-muted">{{ member.email }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="add-expense-section mb-lg">
          <button (click)="toggleExpenseForm()" class="btn-primary">+ Add Expense</button>
        </div>

        <div *ngIf="showExpenseForm" class="expense-form-card card mb-lg">
          <h3>Add Expense</h3>
          <form [formGroup]="expenseForm" (ngSubmit)="addExpense()" class="form-group">
            <div class="form-field">
              <label>Description</label>
              <input type="text" formControlName="description" placeholder="e.g., Dinner">
              <span class="error" *ngIf="isFieldInvalid('description')">Description is required</span>
            </div>

            <div class="form-field">
              <label>Amount</label>
              <input type="number" formControlName="amount" placeholder="0.00" step="0.01">
              <span class="error" *ngIf="isFieldInvalid('amount')">Valid amount is required</span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="expenseForm.invalid || expenseLoading">
                {{ expenseLoading ? 'Adding...' : 'Add Expense' }}
              </button>
              <button type="button" class="btn-secondary" (click)="toggleExpenseForm()">Cancel</button>
            </div>

            <p class="error" *ngIf="expenseError">{{ expenseError }}</p>
          </form>
        </div>

        <div class="expenses-section">
          <h3>Group Expenses</h3>
          <div *ngIf="expenses.length === 0" class="empty-state">
            <p class="text-muted">No expenses yet</p>
          </div>
          <div *ngIf="expenses.length > 0" class="expenses-list">
            <div *ngFor="let expense of expenses" class="expense-item card">
              <div class="expense-header flex-between">
                <div>
                  <h4>{{ expense.description }}</h4>
                  <p class="text-muted">Paid by {{ expense.paidBy.name }}</p>
                </div>
                <p class="expense-amount">₹{{ expense.amount }}</p>
              </div>
              <p class="text-muted expense-date">{{ expense.createdAt | date:'short' }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .group-detail-container {
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

    .back-link {
      display: inline-block;
      margin-bottom: var(--spacing-lg);
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .group-header {
      h2 {
        margin-bottom: var(--spacing-sm);
      }

      .members {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--spacing-lg);
        margin-top: var(--spacing-lg);
      }
    }

    .member-card {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      background-color: var(--neutral-50);
      border-radius: var(--radius-md);

      .member-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: var(--primary);
        color: white;
        font-weight: 600;
        flex-shrink: 0;
      }

      .member-name {
        margin: 0;
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
      }

      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }

    .add-expense-section {
      display: flex;
      justify-content: flex-end;
    }

    .expense-form-card {
      h3 {
        margin-bottom: var(--spacing-lg);
      }

      .form-field {
        margin-bottom: var(--spacing-lg);

        label {
          display: block;
          margin-bottom: var(--spacing-sm);
          font-weight: 500;
          color: var(--neutral-700);
        }

        input {
          width: 100%;
          max-width: 400px;
        }

        .error {
          color: var(--error);
          font-size: 0.875rem;
          display: block;
          margin-top: var(--spacing-xs);
        }
      }

      .form-actions {
        display: flex;
        gap: var(--spacing-md);

        button {
          padding: var(--spacing-sm) var(--spacing-lg);
        }
      }

      .error {
        color: var(--error);
        margin-top: var(--spacing-md);
      }
    }

    .expenses-section {
      h3 {
        margin-bottom: var(--spacing-lg);
      }

      .empty-state {
        background: white;
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        text-align: center;
      }

      .expenses-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);

        .expense-item {
          .expense-header {
            margin-bottom: var(--spacing-md);

            h4 {
              margin-bottom: var(--spacing-xs);
            }

            p {
              margin: 0;
            }
          }

          .expense-amount {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--primary);
            margin: 0;
          }

          .expense-date {
            font-size: 0.875rem;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .nav-links {
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .group-header .members {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class GroupDetailComponent implements OnInit {
  group: Group | null = null;
  expenses: Expense[] = [];
  showExpenseForm = false;
  expenseForm!: FormGroup;
  expenseLoading = false;
  expenseError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private expenseService: ExpenseService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.expenseForm = this.fb.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]]
    });

    this.route.params.subscribe(params => {
      const groupId = params['id'];
      this.loadGroupAndExpenses(groupId);
    });
  }

  loadGroupAndExpenses(groupId: string): void {
    this.groupService.getGroups().subscribe({
      next: (response) => {
        this.group = response.groups.find(g => g._id === groupId) || null;
      },
      error: (err) => console.error('Error loading groups', err)
    });

    this.expenseService.getExpenses(groupId).subscribe({
      next: (response) => {
        this.expenses = response.expenses;
      },
      error: (err) => console.error('Error loading expenses', err)
    });
  }

  toggleExpenseForm(): void {
    this.showExpenseForm = !this.showExpenseForm;
    this.expenseError = '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.expenseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  addExpense(): void {
    if (this.expenseForm.invalid || !this.group) return;

    this.expenseLoading = true;
    const { description, amount } = this.expenseForm.value;

    this.expenseService.createExpense(
      this.group._id,
      description,
      amount,
      this.group.members.map(m => m._id)
    ).subscribe({
      next: () => {
        this.expenseForm.reset();
        this.showExpenseForm = false;
        this.expenseLoading = false;
        this.loadGroupAndExpenses(this.group!._id);
      },
      error: (err) => {
        this.expenseError = err.error?.message || 'Failed to add expense';
        this.expenseLoading = false;
      }
    });
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
