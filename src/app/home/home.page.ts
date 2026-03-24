import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {

  // Scroll state for sticky nav
  isScrolled = false;

  // Live counters
  wastedKg   = 0;
  co2Tonnes  = 0;
  waterLitres = 0;

  // Animated stat values (count up)
  statHungry = 0;
  statYield  = 0;

  // Scroll-in visibility flags
  impactVisible   = false;
  problemsVisible = false;
  techVisible     = false;

  @ViewChildren('impactSection,problemsSection,techSection')
  sections!: QueryList<ElementRef>;

  private startTime = Date.now();
  private ticker: ReturnType<typeof setInterval> | null = null;
  private statTicker: ReturnType<typeof setInterval> | null = null;
  private observer: IntersectionObserver | null = null;

  // Known annual rates
  private readonly FOOD_WASTED_KG_PER_SEC  = 1_300_000_000_000 / (365.25 * 24 * 3600); // 1.3B metric tons/yr
  private readonly MEAT_CO2_TONNES_PER_SEC = (7_100_000_000 * 0.145) / (365.25 * 24 * 3600); // 14.5% of 7.1B tonnes
  private readonly BEEF_WATER_L_PER_SEC    = (340_000_000_000 * 1614 / 0.45) / (365.25 * 24 * 3600); // ~340M kg beef/day × 1614L/450g

  ngOnInit() {
    // Live ticking counters
    this.ticker = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      this.wastedKg    = Math.floor(elapsed * this.FOOD_WASTED_KG_PER_SEC);
      const secondsToday = this.secondsIntoDay();
      this.co2Tonnes   = Math.floor(secondsToday * this.MEAT_CO2_TONNES_PER_SEC);
      this.waterLitres = Math.floor(secondsToday * this.BEEF_WATER_L_PER_SEC);
    }, 1000);
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        if (el.hasAttribute('data-section')) {
          const name = el.getAttribute('data-section');
          if (name === 'impact')   { this.impactVisible   = true; this.animateStats(); }
          if (name === 'problems') { this.problemsVisible = true; }
          if (name === 'tech')     { this.techVisible     = true; }
          this.observer?.unobserve(el);
        }
      });
    }, { threshold: 0.15 });

    this.sections.forEach((ref, i) => {
      const names = ['impact', 'problems', 'tech'];
      ref.nativeElement.setAttribute('data-section', names[i]);
      this.observer!.observe(ref.nativeElement);
    });
  }

  ngOnDestroy() {
    if (this.ticker)     clearInterval(this.ticker);
    if (this.statTicker) clearInterval(this.statTicker);
    this.observer?.disconnect();
  }

  onScroll(event: CustomEvent) {
    this.isScrolled = event.detail.scrollTop > 60;
  }

  private animateStats() {
    const TARGET_HUNGRY = 811;
    const TARGET_YIELD  = 20;
    const STEPS = 60;
    let step = 0;
    this.statTicker = setInterval(() => {
      step++;
      this.statHungry = Math.round((TARGET_HUNGRY / STEPS) * step);
      this.statYield  = Math.round((TARGET_YIELD  / STEPS) * step);
      if (step >= STEPS) {
        clearInterval(this.statTicker!);
        this.statHungry = TARGET_HUNGRY;
        this.statYield  = TARGET_YIELD;
      }
    }, 20);
  }

  private secondsIntoDay(): number {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  }
}
