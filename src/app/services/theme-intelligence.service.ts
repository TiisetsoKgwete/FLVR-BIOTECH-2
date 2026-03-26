import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  glass: {
    background: string;
    border: string;
    blur: number;
    opacity: number;
  };
}

export interface ContentData {
  type: 'technology' | 'about' | 'contact' | 'home' | 'food-security' | 'flvr-meat';
  density: 'light' | 'medium' | 'heavy';
  complexity: number; // 0-1 scale
  hasImages: boolean;
  hasVideo: boolean;
}

export interface UserProfile {
  prefersDark: boolean;
  prefersReducedMotion: boolean;
  accessibilityLevel: number; // 0-3 scale
  sessionDuration: number;
  interactionFrequency: number;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeIntelligenceService {
  private currentTheme$ = new BehaviorSubject<ThemeConfig>(this.getDefaultTheme());
  private currentTimeOfDay$ = new BehaviorSubject<string>(this.getTimeOfDay());
  private userProfile$ = new BehaviorSubject<UserProfile>(this.getDefaultUserProfile());
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initializeThemeSystem();
  }

  // Public observables
  getCurrentTheme(): Observable<ThemeConfig> {
    return this.currentTheme$.asObservable();
  }

  getTimeOfDay(): Observable<string> {
    return this.currentTimeOfDay$.asObservable();
  }

  getUserProfile(): Observable<UserProfile> {
    return this.userProfile$.asObservable();
  }

  // Generate contextual theme based on content and user
  generateContextualTheme(content: ContentData): ThemeConfig {
    const timeOfDay = this.currentTimeOfDay$.value;
    const userProfile = this.userProfile$.value;
    
    // Base theme variations
    const themes = {
      morning: {
        primary: '#5a9e2f',
        secondary: '#a8e063',
        accent: '#7cb342',
        background: '#f6faf3',
        surface: '#ffffff',
        text: '#2d3748'
      },
      afternoon: {
        primary: '#4a8e1f',
        secondary: '#98d053',
        accent: '#6ca332',
        background: '#f5faf0',
        surface: '#ffffff',
        text: '#2d3748'
      },
      evening: {
        primary: '#6aae3f',
        secondary: '#b8e073',
        accent: '#8cc352',
        background: '#f4f8ef',
        surface: '#ffffff',
        text: '#2d3748'
      },
      night: {
        primary: '#7abe4f',
        secondary: '#c8e083',
        accent: '#9cc362',
        background: '#1a202c',
        surface: '#2d3748',
        text: '#f7fafc'
      }
    };

    const baseTheme = themes[timeOfDay as keyof typeof themes] || themes.afternoon;
    
    // Adjust based on content density
    const densityMultiplier = content.density === 'light' ? 0.8 : 
                              content.density === 'heavy' ? 1.2 : 1.0;
    
    // Adjust based on accessibility level
    const accessibilityMultiplier = 1 + (userProfile.accessibilityLevel * 0.2);
    
    // Generate glass configuration
    const glassConfig = this.generateGlassConfig(content, userProfile, timeOfDay);
    
    return {
      ...baseTheme,
      glass: glassConfig
    };
  }

  // Generate glass configuration based on context
  private generateGlassConfig(content: ContentData, userProfile: UserProfile, timeOfDay: string): ThemeConfig['glass'] {
    const baseBlur = 18;
    const baseOpacity = 0.35;
    
    // Content density affects blur
    const densityBlur = content.density === 'light' ? baseBlur * 0.8 :
                       content.density === 'heavy' ? baseBlur * 1.2 : baseBlur;
    
    // Time of day affects opacity
    const timeOpacity = timeOfDay === 'night' ? 0.25 :
                       timeOfDay === 'morning' ? 0.45 :
                       timeOfDay === 'evening' ? 0.3 : baseOpacity;
    
    // Accessibility affects contrast
    const accessibilityOpacity = timeOpacity * (1 + userProfile.accessibilityLevel * 0.1);
    
    return {
      background: timeOfDay === 'night' ? 'rgba(30,34,40,0.32)' : 'rgba(255,255,255,0.35)',
      border: timeOfDay === 'night' ? 'rgba(255,255,255,0.12)' : 'rgba(90,158,47,0.25)',
      blur: densityBlur,
      opacity: accessibilityOpacity
    };
  }

  // Adapt theme to time of day
  adaptToTimeOfDay(): void {
    const timeOfDay = this.getTimeOfDay();
    this.currentTimeOfDay$.next(timeOfDay);
    this.updateTheme();
  }

  // Optimize for accessibility
  optimizeForAccessibility(accessibilityLevel: number): void {
    const currentProfile = this.userProfile$.value;
    this.userProfile$.next({
      ...currentProfile,
      accessibilityLevel
    });
    this.updateTheme();
  }

  // Apply theme to CSS variables
  applyTheme(theme: ThemeConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const root = document.documentElement;
    root.style.setProperty('--dynamic-primary', theme.primary);
    root.style.setProperty('--dynamic-secondary', theme.secondary);
    root.style.setProperty('--dynamic-accent', theme.accent);
    root.style.setProperty('--dynamic-background', theme.background);
    root.style.setProperty('--dynamic-surface', theme.surface);
    root.style.setProperty('--dynamic-text', theme.text);
    root.style.setProperty('--dynamic-glass-bg', theme.glass.background);
    root.style.setProperty('--dynamic-glass-border', theme.glass.border);
    root.style.setProperty('--dynamic-glass-blur', `${theme.glass.blur}px`);
    root.style.setProperty('--dynamic-glass-opacity', theme.glass.opacity.toString());
  }

  // Initialize theme system
  private initializeThemeSystem(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Set up time-based theme updates
    setInterval(() => {
      this.adaptToTimeOfDay();
    }, 60000); // Update every minute
    
    // Listen for system preference changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', () => {
      this.updateUserProfile();
      this.updateTheme();
    });
    
    // Listen for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', () => {
      this.updateUserProfile();
      this.updateTheme();
    });
    
    // Initialize with current preferences
    this.updateUserProfile();
    this.updateTheme();
  }

  // Update user profile based on system preferences
  private updateUserProfile(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const currentProfile = this.userProfile$.value;
    this.userProfile$.next({
      ...currentProfile,
      prefersDark,
      prefersReducedMotion
    });
  }

  // Update current theme
  private updateTheme(): void {
    const defaultContent: ContentData = {
      type: 'home',
      density: 'medium',
      complexity: 0.5,
      hasImages: true,
      hasVideo: false
    };
    
    const newTheme = this.generateContextualTheme(defaultContent);
    this.currentTheme$.next(newTheme);
    this.applyTheme(newTheme);
  }

  // Get current time of day
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  // Get default theme
  private getDefaultTheme(): ThemeConfig {
    return {
      primary: '#5a9e2f',
      secondary: '#a8e063',
      accent: '#7cb342',
      background: '#f6faf3',
      surface: '#ffffff',
      text: '#2d3748',
      glass: {
        background: 'rgba(255,255,255,0.35)',
        border: 'rgba(90,158,47,0.25)',
        blur: 18,
        opacity: 0.35
      }
    };
  }

  // Get default user profile
  private getDefaultUserProfile(): UserProfile {
    return {
      prefersDark: false,
      prefersReducedMotion: false,
      accessibilityLevel: 0,
      sessionDuration: 0,
      interactionFrequency: 0
    };
  }
}
