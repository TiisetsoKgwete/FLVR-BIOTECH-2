import { Component, OnInit, OnDestroy } from '@angular/core';
import { PerformanceService } from '../../services/performance.service';

@Component({
  selector: 'app-fps-counter',
  standalone: false,
  template: `
    <div class="fps-counter" [class.poor-performance]="fps < 45" *ngIf="isVisible">
      <span class="fps-value">{{ fps }}</span>
      <span class="fps-label">FPS</span>
      <button class="fps-close" (click)="hide()">×</button>
      <div class="fps-bar" [style.width.%]="fps"></div>
    </div>
  `,
  styles: [`
    .fps-counter {
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: rgba(0,0,0,0.85);
      color: #a8e063;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 80px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      backdrop-filter: blur(4px);
    }
    
    .fps-value {
      font-weight: bold;
      font-size: 18px;
      min-width: 32px;
      text-align: right;
    }
    
    .fps-label {
      font-size: 11px;
      opacity: 0.8;
      text-transform: uppercase;
    }
    
    .fps-close {
      background: none;
      border: none;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      padding: 0 4px;
      margin-left: 8px;
      opacity: 0.6;
      transition: opacity 0.2s;
      
      &:hover {
        opacity: 1;
      }
    }
    
    .fps-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #ef4444 0%, #f97316 30%, #a8e063 60%, #22c55e 100%);
      border-radius: 0 0 0 8px;
      transition: width 0.3s ease;
      max-width: 100%;
    }
    
    .poor-performance {
      color: #ef4444;
      animation: pulse 1s infinite;
      
      .fps-bar {
        background: #ef4444;
      }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `]
})
export class FpsCounterComponent implements OnInit, OnDestroy {
  fps = 60;
  isVisible = false;
  private unsubscribe: (() => void) | null = null;

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    // Check if FPS counter should be shown
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    
    if (debugParam === 'perf' || debugParam === 'fps' || this.performanceService.isFeatureEnabled('fpsCounter')) {
      this.isVisible = true;
      this.performanceService.startMonitoring();
      
      this.unsubscribe = this.performanceService.onFpsUpdate((fps) => {
        this.fps = fps;
      });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    this.performanceService.stopMonitoring();
  }

  hide(): void {
    this.isVisible = false;
  }
}
