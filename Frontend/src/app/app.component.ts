import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="page-loader" *ngIf="loadingService.isLoading()">
      <div class="loader-overlay">
        <div class="spinner"></div>
      </div>
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [
    `
      .page-loader {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.35);
      }

      .loader-overlay {
        width: 96px;
        height: 96px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.12);
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(8px);
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 5px solid rgba(255, 255, 255, 0.25);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 0.9s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class AppComponent {
  title = 'SplitWise';

  constructor(public loadingService: LoadingService) {}
}
