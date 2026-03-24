import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  menuPages = [
    { title: 'Home',          url: '/home',          icon: 'home-outline' },
    { title: 'Technology',    url: '/technology',    icon: 'flask-outline' },
    { title: 'Food Security', url: '/food-security', icon: 'earth-outline' },
    { title: 'FLVR MEAT',     url: '/flvr-meat',     icon: 'nutrition-outline' },
    { title: 'About',         url: '/about',         icon: 'leaf-outline' },
    { title: 'Contact',       url: '/contact',       icon: 'mail-outline' },
  ];
}
