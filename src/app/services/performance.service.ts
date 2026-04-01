import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

// Type augmentation for environment
interface ExtendedEnvironment {
  production: boolean;
  features: {
    preloader: boolean;
    hoverEffects: boolean;
    liveCounterAnimations: boolean;
    ambientMotion: boolean;
    scrollReveals: boolean;
    pageTransitions: boolean;
    labMode: boolean;
    techCardExpand: boolean;
    hero3D: boolean;
    fpsCounter: boolean;
  };
  performance: {
    maxBackdropFilters: number;
    maxParticles: number;
    scrollThrottleMs: number;
    counterUpdateIntervalMs: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private fps = 60;
  private frameCount = 0;
  private lastTime = performance.now();
  private fpsCallbacks: ((fps: number) => void)[] = [];
  private animationId: number | null = null;
  private isMonitoring = false;
  
  // Performance thresholds
  private readonly FPS_THRESHOLD = 45; // Below this is considered poor performance
  private consecutiveLowFpsFrames = 0;
  private readonly LOW_FPS_THRESHOLD = 10; // Number of consecutive frames before triggering perf mode
  
  // Feature flags reference - with safe fallback
  private features = (environment as unknown as ExtendedEnvironment).features ?? {
    preloader: true,
    hoverEffects: true,
    liveCounterAnimations: true,
    ambientMotion: false,
    scrollReveals: false,
    pageTransitions: false,
    labMode: false,
    techCardExpand: false,
    hero3D: false,
    fpsCounter: true
  };
  private performance = (environment as unknown as ExtendedEnvironment).performance ?? {
    maxBackdropFilters: 4,
    maxParticles: 15,
    scrollThrottleMs: 16,
    counterUpdateIntervalMs: 1000
  };

  constructor() {}

  /**
   * Start FPS monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring || !this.features.fpsCounter) return;
    
    this.isMonitoring = true;
    this.measureFps();
  }

  /**
   * Stop FPS monitoring
   */
  stopMonitoring(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Subscribe to FPS updates
   */
  onFpsUpdate(callback: (fps: number) => void): () => void {
    this.fpsCallbacks.push(callback);
    return () => {
      const index = this.fpsCallbacks.indexOf(callback);
      if (index > -1) {
        this.fpsCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current FPS
   */
  getFps(): number {
    return this.fps;
  }

  /**
   * Check if performance is poor
   */
  isPerformancePoor(): boolean {
    return this.fps < this.FPS_THRESHOLD;
  }

  /**
   * Enable performance mode (disables expensive effects)
   */
  enablePerformanceMode(): void {
    document.body.classList.add('perf-mode');
    console.warn('[PerformanceService] Performance mode enabled - expensive effects disabled');
  }

  /**
   * Disable performance mode
   */
  disablePerformanceMode(): void {
    document.body.classList.remove('perf-mode');
  }

  /**
   * Check if performance mode is active
   */
  isPerformanceMode(): boolean {
    return document.body.classList.contains('perf-mode');
  }

  /**
   * Measure FPS using requestAnimationFrame
   */
  private measureFps(): void {
    const now = performance.now();
    this.frameCount++;

    if (now >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;

      // Notify subscribers
      this.fpsCallbacks.forEach(cb => cb(this.fps));

      // Auto-enable performance mode if FPS is consistently low
      if (this.fps < this.FPS_THRESHOLD) {
        this.consecutiveLowFpsFrames++;
        if (this.consecutiveLowFpsFrames >= this.LOW_FPS_THRESHOLD && !this.isPerformanceMode()) {
          this.enablePerformanceMode();
        }
      } else {
        this.consecutiveLowFpsFrames = 0;
      }
    }

    if (this.isMonitoring) {
      this.animationId = requestAnimationFrame(() => this.measureFps());
    }
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    return this.features[featureName as keyof typeof this.features] ?? false;
  }

  /**
   * Get performance settings
   */
  getPerformanceSettings(): typeof this.performance {
    return this.performance;
  }

  /**
   * Throttle function for scroll events
   */
  throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * RAF-based throttle (more accurate for animations)
   */
  rafThrottle<T extends (...args: unknown[]) => unknown>(func: T): (...args: Parameters<T>) => void {
    let ticking = false;
    return (...args: Parameters<T>) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          func(...args);
          ticking = false;
        });
        ticking = true;
      }
    };
  }
}
