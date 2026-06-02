import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GroupService, Group } from '../../../core/services/group.service';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="groups-container">
      <header class="navbar">
        <div class="container flex-between">
          <h1 class="logo">💰 SplitWise</h1>
          <nav class="nav-links">
            <a routerLink="/dashboard" class="nav-link">Dashboard</a>
            <a routerLink="/expenses" class="nav-link">Expenses</a>
            <button (click)="logout()" class="btn-secondary">Logout</button>
          </nav>
        </div>
      </header>

      <main class="container">
        <div class="page-header flex-between mb-lg">
          <div>
            <h2>Your Groups</h2>
            <p class="text-muted">Manage shared expense groups</p>
          </div>
          <button (click)="toggleCreateForm()" class="btn-primary">+ New Group</button>
        </div>

        <div *ngIf="showCreateForm" class="create-form-card card mb-lg">
          <h3>Create New Group</h3>
          <form [formGroup]="createGroupForm" (ngSubmit)="createGroup()" class="form-group">
            <div class="form-field">
              <label>Group Name</label>
              <input type="text" formControlName="name" placeholder="e.g., Weekend Trip">
              <span class="error" *ngIf="isFieldInvalid('name')">Group name is required</span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="createGroupForm.invalid || loading">
                {{ loading ? 'Creating...' : 'Create Group' }}
              </button>
              <button type="button" class="btn-secondary" (click)="toggleCreateForm()">Cancel</button>
            </div>

            <p class="error" *ngIf="error">{{ error }}</p>
          </form>
        </div>

        <div *ngIf="groups.length === 0 && !showCreateForm" class="empty-state card">
          <h3>No groups yet</h3>
          <p class="text-muted">Create a group to start sharing expenses with friends</p>
          <button (click)="toggleCreateForm()" class="btn-primary">Create Your First Group</button>
        </div>

        <div *ngIf="groups.length > 0" class="groups-grid">
          <div *ngFor="let group of groups" class="group-card card">
            <h3>{{ group.name }}</h3>
            <p class="text-muted">{{ group.members.length }} members</p>
            <div class="members-preview">
              <span *ngFor="let member of group.members.slice(0, 3)" class="member-badge">
                {{ member.name.substring(0, 2) }}
              </span>
              <span *ngIf="group.members.length > 3" class="member-badge">
                +{{ group.members.length - 3 }}
              </span>
            </div>
            <a [routerLink]="['/group', group._id]" class="btn-primary">View Details</a>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .groups-container {
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
      margin-bottom: var(--spacing-lg);

      h2 {
        margin-bottom: var(--spacing-sm);
      }
    }

    .create-form-card {
      h3 {
        margin-bottom: var(--spacing-lg);
      }
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

    .empty-state {
      text-align: center;
      padding: var(--spacing-2xl);

      h3 {
        margin-bottom: var(--spacing-md);
      }

      p {
        margin-bottom: var(--spacing-lg);
      }
    }

    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--spacing-lg);
    }

    .group-card {
      h3 {
        margin-bottom: var(--spacing-sm);
      }

      .members-preview {
        display: flex;
        gap: var(--spacing-sm);
        margin: var(--spacing-md) 0;
      }

      .member-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--primary);
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
      }

      a {
        display: block;
        margin-top: var(--spacing-lg);
        text-decoration: none;
        text-align: center;
      }
    }

    .error {
      color: var(--error);
      margin-top: var(--spacing-md);
    }

    @media (max-width: 768px) {
      .groups-grid {
        grid-template-columns: 1fr;
      }

      .nav-links {
        flex-direction: column;
        gap: var(--spacing-md);
      }
    }
  `]
})
export class GroupsListComponent implements OnInit {
  groups: Group[] = [];
  showCreateForm = false;
  createGroupForm!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private groupService: GroupService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createGroupForm = this.fb.group({
      name: ['', [Validators.required]]
    });
    this.loadGroups();
  }

  loadGroups(): void {
    this.groupService.getGroups().subscribe({
      next: (response) => {
        this.groups = response.groups;
      },
      error: (err) => {
        console.error('Error loading groups', err);
        this.error = 'Failed to load groups';
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.error = '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createGroupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  createGroup(): void {
    if (this.createGroupForm.invalid) return;

    this.loading = true;
    const { name } = this.createGroupForm.value;

    this.groupService.createGroup(name, []).subscribe({
      next: () => {
        this.createGroupForm.reset();
        this.showCreateForm = false;
        this.loading = false;
        this.loadGroups();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create group';
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
