import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Welcome Back</h1>
        <p class="text-muted">Sign in to your SplitWise account</p>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form-group">
          <div class="form-field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="Enter your email">
            <span class="error" *ngIf="isFieldInvalid('email')">Valid email is required</span>
          </div>

          <div class="form-field">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Enter your password">
            <span class="error" *ngIf="isFieldInvalid('password')">Password is required</span>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>

          <p class="error text-center" *ngIf="error">{{ error }}</p>
        </form>

        <p class="text-center">Don't have an account? <a routerLink="/register">Create one</a></p>
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
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.error = '';

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
