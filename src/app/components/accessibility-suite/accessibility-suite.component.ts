import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ThemeIntelligenceService } from '../../services/theme-intelligence.service';
import { Subscription } from 'rxjs';

export interface AccessibilitySettings {
  magnifierEnabled: boolean;
  magnifierLevel: number;
  readerModeEnabled: boolean;
  highContrastMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reducedMotion: boolean;
  voiceControlEnabled: boolean;
  screenReaderOptimized: boolean;
}

@Component({
  selector: 'app-accessibility-suite',
  templateUrl: './accessibility-suite.component.html',
  styleUrls: ['./accessibility-suite.component.scss'],
  standalone: false
})
export class AccessibilitySuiteComponent implements OnInit, OnDestroy {
  @Input() enableMagnifier: boolean = true;
  @Input() enableReaderMode: boolean = true;
  @Input() enableVoiceControl: boolean = true;
  @Input() enableHighContrast: boolean = true;
  
  @Output() accessibilityChanged = new EventEmitter<AccessibilitySettings>();
  
  settings: AccessibilitySettings = {
    magnifierEnabled: false,
    magnifierLevel: 1.5,
    readerModeEnabled: false,
    highContrastMode: false,
    fontSize: 'medium',
    reducedMotion: false,
    voiceControlEnabled: false,
    screenReaderOptimized: false
  };
  
  isMagnifierActive: boolean = false;
  magnifierPosition = { x: 0, y: 0 };
  readerModeActive: boolean = false;
  voiceControlActive: boolean = false;
  
  private subscriptions: Subscription[] = [];
  private recognition: any = null;
  
  constructor(private themeService: ThemeIntelligenceService) {}
  
  ngOnInit(): void {
    this.initializeAccessibility();
    this.setupVoiceControl();
    this.loadSavedSettings();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.recognition) {
      this.recognition.stop();
    }
  }
  
  // Initialize accessibility features
  private initializeAccessibility(): void {
    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    this.settings.reducedMotion = prefersReducedMotion;
    this.settings.highContrastMode = prefersHighContrast;
    
    // Apply initial settings
    this.applyAccessibilitySettings();
  }
  
  // Setup voice control
  private setupVoiceControl(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase();
      this.processVoiceCommand(command);
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.voiceControlActive = false;
    };
  }
  
  // Process voice commands
  private processVoiceCommand(command: string): void {
    console.log('Voice command:', command);
    
    // Navigation commands
    if (command.includes('go to home') || command.includes('navigate home')) {
      this.navigateWithVoice('/home');
    } else if (command.includes('go to technology') || command.includes('navigate technology')) {
      this.navigateWithVoice('/technology');
    } else if (command.includes('go to about') || command.includes('navigate about')) {
      this.navigateWithVoice('/about');
    } else if (command.includes('go to contact') || command.includes('navigate contact')) {
      this.navigateWithVoice('/contact');
    }
    
    // Accessibility commands
    if (command.includes('enable magnifier') || command.includes('turn on magnifier')) {
      this.toggleMagnifier(true);
    } else if (command.includes('disable magnifier') || command.includes('turn off magnifier')) {
      this.toggleMagnifier(false);
    }
    
    if (command.includes('enable reader mode') || command.includes('turn on reader')) {
      this.toggleReaderMode(true);
    } else if (command.includes('disable reader mode') || command.includes('turn off reader')) {
      this.toggleReaderMode(false);
    }
    
    if (command.includes('increase font size') || command.includes('make text bigger')) {
      this.increaseFontSize();
    } else if (command.includes('decrease font size') || command.includes('make text smaller')) {
      this.decreaseFontSize();
    }
    
    if (command.includes('high contrast') || command.includes('increase contrast')) {
      this.toggleHighContrast(true);
    } else if (command.includes('normal contrast') || command.includes('decrease contrast')) {
      this.toggleHighContrast(false);
    }
  }
  
  // Navigate with voice feedback
  private navigateWithVoice(path: string): void {
    // Provide voice feedback if possible
    this.speak(`Navigating to ${path.replace('/', '')}`);
    
    // Navigate to the route
    window.location.hash = path;
  }
  
  // Text-to-speech for feedback
  private speak(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }
  
  // Toggle magnifier
  toggleMagnifier(enable?: boolean): void {
    this.settings.magnifierEnabled = enable !== undefined ? enable : !this.settings.magnifierEnabled;
    this.isMagnifierActive = this.settings.magnifierEnabled;
    
    if (this.settings.magnifierEnabled) {
      this.setupMagnifier();
      this.speak('Magnifier enabled');
    } else {
      this.removeMagnifier();
      this.speak('Magnifier disabled');
    }
    
    this.applyAccessibilitySettings();
    this.saveSettings();
  }
  
  // Setup magnifier functionality
  private setupMagnifier(): void {
    if (!this.settings.magnifierEnabled) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      this.magnifierPosition = { x: e.clientX, y: e.clientY };
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    // Store event listener for cleanup
    this.subscriptions.push({
      unsubscribe: () => {
        document.removeEventListener('mousemove', handleMouseMove);
      }
    } as any);
  }
  
  // Remove magnifier
  private removeMagnifier(): void {
    this.isMagnifierActive = false;
  }
  
  // Toggle reader mode
  toggleReaderMode(enable?: boolean): void {
    this.settings.readerModeEnabled = enable !== undefined ? enable : !this.settings.readerModeEnabled;
    this.readerModeActive = this.settings.readerModeEnabled;
    
    if (this.settings.readerModeEnabled) {
      this.enableReaderMode();
      this.speak('Reader mode enabled');
    } else {
      this.disableReaderMode();
      this.speak('Reader mode disabled');
    }
    
    this.applyAccessibilitySettings();
    this.saveSettings();
  }
  
  // Enable reader mode
  private enableReaderMode(): void {
    document.body.classList.add('reader-mode');
    
    // Focus on main content
    const mainContent = document.querySelector('ion-content') || document.querySelector('main');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
    }
  }
  
  // Disable reader mode
  private disableReaderMode(): void {
    document.body.classList.remove('reader-mode');
  }
  
  // Toggle high contrast
  toggleHighContrast(enable?: boolean): void {
    this.settings.highContrastMode = enable !== undefined ? enable : !this.settings.highContrastMode;
    
    if (this.settings.highContrastMode) {
      document.body.classList.add('high-contrast');
      this.speak('High contrast enabled');
    } else {
      document.body.classList.remove('high-contrast');
      this.speak('High contrast disabled');
    }
    
    this.applyAccessibilitySettings();
    this.saveSettings();
  }
  
  // Change font size
  changeFontSize(size: 'small' | 'medium' | 'large' | 'extra-large'): void {
    this.settings.fontSize = size;
    this.applyAccessibilitySettings();
    this.saveSettings();
    this.speak(`Font size changed to ${size}`);
  }
  
  // Increase font size
  increaseFontSize(): void {
    const sizes: Array<'small' | 'medium' | 'large' | 'extra-large'> = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.settings.fontSize);
    const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
    this.changeFontSize(sizes[nextIndex]);
  }
  
  // Decrease font size
  decreaseFontSize(): void {
    const sizes: Array<'small' | 'medium' | 'large' | 'extra-large'> = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.settings.fontSize);
    const prevIndex = Math.max(currentIndex - 1, 0);
    this.changeFontSize(sizes[prevIndex]);
  }
  
  // Toggle voice control
  toggleVoiceControl(): void {
    if (!this.recognition) {
      console.warn('Voice control not available');
      return;
    }
    
    this.settings.voiceControlEnabled = !this.settings.voiceControlEnabled;
    this.voiceControlActive = this.settings.voiceControlEnabled;
    
    if (this.settings.voiceControlEnabled) {
      this.recognition.start();
      this.speak('Voice control enabled. Say "help" for available commands.');
    } else {
      this.recognition.stop();
      this.speak('Voice control disabled');
    }
    
    this.saveSettings();
  }
  
  // Apply accessibility settings to the DOM
  private applyAccessibilitySettings(): void {
    const root = document.documentElement;
    
    // Apply font size
    root.style.setProperty('--accessibility-font-size', this.getFontSizeValue());
    
    // Apply reduced motion
    if (this.settings.reducedMotion) {
      root.style.setProperty('--accessibility-animation-duration', '0.01ms');
    } else {
      root.style.removeProperty('--accessibility-animation-duration');
    }
    
    // Update theme service with accessibility level
    const accessibilityLevel = this.calculateAccessibilityLevel();
    this.themeService.optimizeForAccessibility(accessibilityLevel);
    
    // Emit changes
    this.accessibilityChanged.emit(this.settings);
  }
  
  // Get font size value
  private getFontSizeValue(): string {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    return sizes[this.settings.fontSize];
  }
  
  // Calculate accessibility level (0-3 scale)
  private calculateAccessibilityLevel(): number {
    let level = 0;
    
    if (this.settings.magnifierEnabled) level += 0.5;
    if (this.settings.readerModeEnabled) level += 0.5;
    if (this.settings.highContrastMode) level += 1;
    if (this.settings.fontSize === 'large' || this.settings.fontSize === 'extra-large') level += 0.5;
    if (this.settings.voiceControlEnabled) level += 0.5;
    
    return Math.min(level, 3);
  }
  
  // Save settings to localStorage
  private saveSettings(): void {
    localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
  }
  
  // Load saved settings
  private loadSavedSettings(): void {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
        this.applyAccessibilitySettings();
        
        // Restore active states
        this.isMagnifierActive = this.settings.magnifierEnabled;
        this.readerModeActive = this.settings.readerModeEnabled;
        
        if (this.settings.voiceControlEnabled && this.recognition) {
          this.toggleVoiceControl();
        }
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
  }
  
  // Reset to default settings
  resetToDefaults(): void {
    this.settings = {
      magnifierEnabled: false,
      magnifierLevel: 1.5,
      readerModeEnabled: false,
      highContrastMode: false,
      fontSize: 'medium',
      reducedMotion: false,
      voiceControlEnabled: false,
      screenReaderOptimized: false
    };
    
    this.isMagnifierActive = false;
    this.readerModeActive = false;
    this.voiceControlActive = false;
    
    if (this.recognition) {
      this.recognition.stop();
    }
    
    this.applyAccessibilitySettings();
    this.saveSettings();
    this.speak('Accessibility settings reset to default');
  }
}
