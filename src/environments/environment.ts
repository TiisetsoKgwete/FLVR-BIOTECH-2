// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // Feature flags for gradual rollout - set to false to disable features
  features: {
    preloader: true,
    hoverEffects: true,
    liveCounterAnimations: true,
    ambientMotion: true,
    scrollReveals: false,
    pageTransitions: false,
    labMode: false,
    techCardExpand: false,
    hero3D: false,
    fpsCounter: true // Debug overlay for performance monitoring
  },
  // Performance settings
  performance: {
    maxBackdropFilters: 4,
    maxParticles: 15,
    scrollThrottleMs: 16,
    counterUpdateIntervalMs: 1000
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
