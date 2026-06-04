import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupService, Group } from '../../../core/services/group.service';
import { ExpenseService, Expense } from '../../../core/services/expense.service';
import { AuthService } from '../../../core/services/auth.service';
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
          <p *ngIf="currentUserId !== null" class="you-balance">
            <span *ngIf="myBalance > 0" class="positive">You are owed ₹{{ myBalance | number:'1.2-2' }}</span>
            <span *ngIf="myBalance < 0" class="negative">You owe ₹{{ (-myBalance) | number:'1.2-2' }}</span>
            <span *ngIf="myBalance === 0" class="neutral">You are settled</span>
          </p>
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
          

        <div *ngIf="group" class="invite-card card mb-lg">
          <h3>Invite a Member</h3>
          <form [formGroup]="inviteForm" (ngSubmit)="inviteMember()" class="form-group">
            <div class="form-field">
              <label>Member Email</label>
              <input type="email" formControlName="email" placeholder="user@example.com">
              <span class="error" *ngIf="isInviteFieldInvalid('email')">Valid email is required</span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="inviteForm.invalid || inviteLoading">
                {{ inviteLoading ? 'Inviting...' : 'Invite' }}
              </button>
            </div>

            <p class="success" *ngIf="inviteSuccess">{{ inviteSuccess }}</p>
            <p class="error" *ngIf="inviteError">{{ inviteError }}</p>
          </form>
        </div>

        <div *ngIf="group" class="balances-card card mb-lg">
          <h3>Group Settlements</h3>
          <div *ngIf="balancesLoading" class="text-muted">Calculating settlements...</div>
          <div *ngIf="!balancesLoading && (!transfers || transfers.length === 0)" class="text-muted">No settlements yet</div>
          <div *ngIf="!balancesLoading && transfers && transfers.length > 0" class="balances-list">
            <div *ngFor="let t of transfers" class="balance-item">
              <p>
                <strong>{{ t.from.name }}</strong> pays <strong>{{ t.to.name }}</strong> ₹{{ t.amount | number:'1.2-2' }}
                <button *ngIf="currentUserId === t.from.userId" class="btn-secondary" (click)="markTransferPaid(t)">Mark paid</button>
              </p>
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
              <div *ngIf="editingExpenseId !== expense._id" class="expense-header flex-between">
                <div>
                  <h4>{{ expense.description }}</h4>
                  <p class="text-muted">Paid by {{ expense.paidBy.name }}</p>
                </div>
                <div class="flex-row">
                  <p class="expense-amount">₹{{ expense.amount }}</p>
                  <button *ngIf="currentUserId === expense.paidBy._id" class="btn-secondary ml-sm" (click)="startEdit(expense)">Edit</button>
                  <button *ngIf="currentUserId === expense.paidBy._id" class="btn-danger ml-sm" (click)="confirmDelete(expense._id)">Delete</button>
                </div>
              </div>

              <div *ngIf="editingExpenseId === expense._id" class="expense-edit">
                <form [formGroup]="editExpenseForm" (ngSubmit)="submitEdit(expense._id)">
                  <div class="form-field">
                    <input type="text" formControlName="description">
                  </div>
                  <div class="form-field">
                    <input type="number" formControlName="amount" step="0.01">
                  </div>
                  <div class="form-actions">
                    <button type="submit" class="btn-primary" [disabled]="editLoading">Save</button>
                    <button type="button" class="btn-secondary" (click)="cancelEdit()">Cancel</button>
                  </div>
                  <p class="error" *ngIf="editError">{{ editError }}</p>
                </form>
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

    .container {
      width: min(1180px, 100%);
      margin: 0 auto;
      padding: 0 1.5rem 2rem;
    }

    .card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 18px 80px rgba(15, 23, 42, 0.08);
      padding: 1.5rem;
    }

    .mb-lg {
      margin-bottom: 1.5rem;
    }

    .ml-sm {
      margin-left: 0.75rem;
    }

    .flex-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .flex-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .navbar {
      background: white;
      padding: 1rem 0;
      box-shadow: 0 2px 14px rgba(0, 0, 0, 0.08);
      margin-bottom: 1.5rem;
    }

    .logo {
      margin: 0;
      font-size: 1.5rem;
    }

    .nav-links {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .nav-link {
      text-decoration: none;
      color: #374151;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-link:hover {
      color: #2563eb;
    }

    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    .group-header {
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 18px 80px rgba(15, 23, 42, 0.05);
    }

    .group-header h2 {
      margin-bottom: 0.75rem;
    }

    .members {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
      margin-top: 1.25rem;
    }

    .member-card {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background-color: #f8fafc;
      border-radius: 16px;
      align-items: center;
    }

    .member-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background-color: #2563eb;
      color: white;
      font-weight: 700;
      font-size: 0.95rem;
      flex-shrink: 0;
    }

    .member-name {
      margin: 0 0 0.25rem;
      font-weight: 600;
      font-size: 0.98rem;
    }

    .member-card p {
      margin: 0;
      font-size: 0.9rem;
    }

    .you-balance {
      margin-top: 0.5rem;
      font-weight: 700;
      font-size: 1rem;
    }

    .you-balance .positive { color: #16a34a; }
    .you-balance .negative { color: #dc2626; }
    .you-balance .neutral { color: #475569; }

    .card + .card,
    .invite-card + .balances-card,
    .balances-card + .expense-form-card {
      margin-top: 1.5rem;
    }

    .btn-primary,
    .btn-secondary,
    .btn-danger {
      border: none;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 600;
      min-height: 40px;
      padding: 0 1.1rem;
      transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.18);
    }

    .btn-primary:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #111827;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    .form-group {
      display: grid;
      gap: 1rem;
    }

    .form-field {
      display: grid;
      gap: 0.5rem;
    }

    .form-field label {
      font-weight: 600;
      color: #334155;
    }

    .form-field input {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 14px;
      padding: 0.85rem 1rem;
      font-size: 0.95rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-field input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
    }

    .form-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .error {
      color: #dc2626;
      font-size: 0.9rem;
    }

    .success {
      color: #16a34a;
      margin-top: 0.75rem;
      font-weight: 600;
    }

    .invite-card,
    .balances-card,
    .expense-form-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 14px 50px rgba(15, 23, 42, 0.05);
      padding: 1.5rem;
    }

    .balances-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-top: 1rem;
    }

    .balance-item {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: #f8fafc;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
    }

    .balances-card p {
      margin: 0;
    }

    .expenses-section {
      margin-top: 1rem;
    }

    .expenses-section h3 {
      margin-bottom: 1rem;
    }

    .empty-state {
      background: white;
      padding: 1.5rem;
      border-radius: 20px;
      text-align: center;
      border: 1px solid #e5e7eb;
      color: #64748b;
    }

    .expenses-list {
      display: grid;
      gap: 1rem;
    }

    .expense-item {
      padding: 1.25rem;
      border-radius: 20px;
      background: white;
      box-shadow: 0 10px 35px rgba(15, 23, 42, 0.05);
      border: 1px solid #e2e8f0;
    }

    .expense-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .expense-header h4 {
      margin: 0 0 0.35rem;
      font-size: 1.05rem;
    }

    .expense-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.95rem;
    }

    .expense-amount {
      font-size: 1.2rem;
      font-weight: 700;
      color: #2563eb;
      margin: 0;
      min-width: 96px;
      text-align: right;
    }

    .expense-date {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.75rem;
    }

    .expense-edit {
      display: grid;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .expense-edit .form-field input {
      width: 100%;
      max-width: 260px;
    }

    @media (max-width: 768px) {
      .nav-links {
        flex-direction: column;
        gap: 0.75rem;
      }

      .group-header .members {
        grid-template-columns: 1fr;
      }

      .expense-header,
      .balance-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .expense-amount {
        text-align: left;
      }

      .add-expense-section {
        justify-content: stretch;
      }
    }
  `]
})
export class GroupDetailComponent implements OnInit {
  group: Group | null = null;
  expenses: Expense[] = [];
  editExpenseForm!: FormGroup;
  editingExpenseId: string | null = null;
  editLoading = false;
  editError = '';
  balances: Array<{ userId: string; name: string; email: string; balance: number }> = [];
  transfers: Array<{ from: { userId: string; name: string }; to: { userId: string; name: string }; amount: number }> = [];
  currentUserId: string | null = null;
  myBalance = 0;
  toPay: Array<{ name: string; amount: number }> = [];
  toReceive: Array<{ name: string; amount: number }> = [];
  showExpenseForm = false;
  expenseForm!: FormGroup;
  inviteForm!: FormGroup;
  expenseLoading = false;
  inviteLoading = false;
  expenseError = '';
  inviteError = '';
  inviteSuccess = '';
  balancesLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private expenseService: ExpenseService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.expenseForm = this.fb.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]]
    });

    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.editExpenseForm = this.fb.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]]
    });

    this.route.params.subscribe(params => {
      const groupId = params['id'];
      this.loadGroupAndExpenses(groupId);
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user ? user.id : null;
    });
  }

  loadGroupAndExpenses(groupId: string): void {
    this.groupService.getGroups().subscribe({
      next: (response) => {
        this.group = response.groups.find(g => g._id === groupId) || null;
        if (this.group) this.loadGroupBalances(this.group._id);
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

  loadGroupBalances(groupId: string): void {
    this.balancesLoading = true;
    this.groupService.getGroupSettlements(groupId).subscribe({
      next: (response) => {
        this.balances = response.balances;
        this.transfers = response.transfers || [];
        if ((!response.transfers || response.transfers.length === 0) && this.balances && this.balances.length) {
          // compute local transfers as fallback
          this.transfers = this.computeLocalTransfers(this.balances);
        }

        // compute current user's net balance and per-person lists
        this.myBalance = 0;
        this.toPay = [];
        this.toReceive = [];
        if (this.currentUserId) {
          const myEntry = this.balances.find(b => b.userId === this.currentUserId);
          this.myBalance = myEntry ? Math.round((myEntry.balance + Number.EPSILON) * 100) / 100 : 0;

          this.transfers.forEach(t => {
            if (t.from.userId === this.currentUserId) {
              this.toPay.push({ name: t.to.name, amount: t.amount });
            } else if (t.to.userId === this.currentUserId) {
              this.toReceive.push({ name: t.from.name, amount: t.amount });
            }
          });
        }
        this.balancesLoading = false;
      },
      error: (err) => {
        console.error('Error loading balances', err);
        this.balancesLoading = false;
      }
    });
  }

  markTransferPaid(transfer: { from: { userId: string }; to: { userId: string }; amount: number }): void {
    if (!this.group) return;
    const toUserId = transfer.to.userId;
    const amount = transfer.amount;
    this.groupService.settle(this.group._id, toUserId, amount).subscribe({
      next: () => {
        this.loadGroupAndExpenses(this.group!._id);
      },
      error: (err) => console.error('Error recording settlement', err)
    });
  }

  private computeLocalTransfers(balances: Array<{ userId: string; name: string; email: string; balance: number }>) {
    const creditors: Array<{ userId: string; name: string; amount: number }> = [];
    const debtors: Array<{ userId: string; name: string; amount: number }> = [];

    balances.forEach(b => {
      const amt = Math.round((b.balance + Number.EPSILON) * 100) / 100;
      if (amt > 0) creditors.push({ userId: b.userId, name: b.name, amount: amt });
      else if (amt < 0) debtors.push({ userId: b.userId, name: b.name, amount: amt });
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => a.amount - b.amount); // more negative first

    const transfers: Array<{ from: { userId: string; name: string }; to: { userId: string; name: string }; amount: number }> = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const owe = -debtor.amount;
      const give = creditor.amount;
      const pay = Math.round((Math.min(owe, give) + Number.EPSILON) * 100) / 100;

      transfers.push({ from: { userId: debtor.userId, name: debtor.name }, to: { userId: creditor.userId, name: creditor.name }, amount: pay });

      debtor.amount += pay;
      creditor.amount -= pay;

      if (Math.abs(debtor.amount) < 0.01) i++;
      if (Math.abs(creditor.amount) < 0.01) j++;
    }

    return transfers;
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

  startEdit(expense: Expense): void {
    this.editingExpenseId = expense._id;
    this.editError = '';
    this.editExpenseForm.setValue({ description: expense.description, amount: expense.amount });
  }

  cancelEdit(): void {
    this.editingExpenseId = null;
    this.editExpenseForm.reset();
    this.editError = '';
  }

  submitEdit(expenseId: string): void {
    if (this.editExpenseForm.invalid) return;
    this.editLoading = true;
    const { description, amount } = this.editExpenseForm.value;

    this.expenseService.updateExpense(expenseId, { description, amount }).subscribe({
      next: (resp) => {
        this.editLoading = false;
        this.editingExpenseId = null;
        this.loadGroupAndExpenses(this.group!._id);
      },
      error: (err) => {
        this.editLoading = false;
        this.editError = err.error?.message || 'Failed to update expense';
      }
    });
  }

  confirmDelete(expenseId: string): void {
    if (!this.group) return;
    if (!confirm('Delete this expense? This cannot be undone.')) return;
    this.expenseService.deleteExpense(expenseId).subscribe({
      next: () => {
        this.loadGroupAndExpenses(this.group!._id);
      },
      error: (err) => console.error('Error deleting expense', err)
    });
  }

  inviteMember(): void {
    if (this.inviteForm.invalid || !this.group) return;

    this.inviteLoading = true;
    this.inviteError = '';
    this.inviteSuccess = '';

    const { email } = this.inviteForm.value;

    this.groupService.inviteMember(this.group._id, email).subscribe({
      next: (response) => {
        this.group = response.group;
        this.inviteForm.reset();
        this.inviteLoading = false;
        this.inviteSuccess = 'Member invited successfully.';
      },
      error: (err) => {
        this.inviteError = err.error?.message || 'Failed to invite member';
        this.inviteLoading = false;
      }
    });
  }

  isInviteFieldInvalid(fieldName: string): boolean {
    const field = this.inviteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
