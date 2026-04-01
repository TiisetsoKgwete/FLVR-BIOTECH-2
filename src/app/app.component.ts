import { Component, OnInit, Renderer2 } from '@angular/core';
import { PerformanceService } from './services/performance.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
  providers: [PerformanceService]
})
export class AppComponent implements OnInit {
  menuPages = [
    { title: 'Home',          url: '/home',          icon: 'home-outline' },
    { title: 'Technology',    url: '/technology',    icon: 'flask-outline' },
    { title: 'Food Security', url: '/food-security', icon: 'earth-outline' },
    { title: 'FLVR MEAT',     url: '/flvr-meat',     icon: 'nutrition-outline' },
    { title: 'About',         url: '/about',         icon: 'leaf-outline' },
    { title: 'Contact',       url: '/contact',       icon: 'mail-outline' },
  ];

  isDarkMode = false;

  constructor(
    private performanceService: PerformanceService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Load dark mode preference before render to prevent flash
    this.loadDarkModePreference();
    
    // Auto-enable performance mode if URL has ?perf=1
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('perf') === '1') {
      this.performanceService.enablePerformanceMode();
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyDarkMode();
    this.saveDarkModePreference();
  }

  private applyDarkMode(): void {
    if (this.isDarkMode) {
      this.renderer.addClass(document.body, 'dark-mode');
    } else {
      this.renderer.removeClass(document.body, 'dark-mode');
    }
  }

  private saveDarkModePreference(): void {
    try {
      localStorage.setItem('flvr-dark-mode', JSON.stringify(this.isDarkMode));
    } catch (e) {
      console.warn('Could not save dark mode preference');
    }
  }

  private loadDarkModePreference(): void {
    try {
      const saved = localStorage.getItem('flvr-dark-mode');
      if (saved !== null) {
        this.isDarkMode = JSON.parse(saved);
        this.applyDarkMode();
      } else {
        // Check system preference
        this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyDarkMode();
      }
    } catch (e) {
      console.warn('Could not load dark mode preference');
    }
  }
}
