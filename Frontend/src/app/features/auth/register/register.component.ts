import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Create Account</h1>
        <p class="text-muted">Join SplitWise and start sharing expenses</p>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="form-group">
          <div class="form-field">
            <label>Full Name</label>
            <input type="text" formControlName="name" placeholder="Enter your full name">
            <span class="error" *ngIf="isFieldInvalid('name')">Name is required</span>
          </div>

          <div class="form-field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="Enter your email">
            <span class="error" *ngIf="isFieldInvalid('email')">Valid email is required</span>
          </div>

          <div class="form-field">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Enter password (min 6 chars)">
            <span class="error" *ngIf="isFieldInvalid('password')">Password must be at least 6 characters</span>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>

          <p class="error text-center" *ngIf="error">{{ error }}</p>
        </form>

        <p class="text-center">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .auth-card {
      background: white;
      padding: 2rem;
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;
    }

    h1 {
      margin-bottom: var(--spacing-sm);
    }

    .form-group {
      margin-top: var(--spacing-lg);
    }

    .form-field {
      margin-bottom: var(--spacing-lg);
    }

    label {
      display: block;
      margin-bottom: var(--spacing-sm);
      font-weight: 500;
      color: var(--neutral-700);
    }

    input {
      width: 100%;
    }

    .error {
      color: var(--error);
      font-size: 0.875rem;
      margin-top: var(--spacing-xs);
      display: block;
    }

    button {
      width: 100%;
      margin-top: var(--spacing-md);
    }

    .text-center {
      text-align: center;
      margin-top: var(--spacing-lg);

      a {
        color: var(--primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = '';

    const { name, email, password } = this.registerForm.value;
    this.authService.register(name, email, password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
