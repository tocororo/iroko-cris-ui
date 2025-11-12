import {
  Component,
  importProvidersFrom,
  inject,
  signal,
  OnInit,
  Input,
} from '@angular/core';
import {
  RouterModule,
  RouterOutlet,
  Router,
  NavigationEnd,
  NavigationStart,
  NavigationError,
} from '@angular/router';
import { ConfigService, Config } from './services/config.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MediaMatcher } from '@angular/cdk/layout';
import { DomSanitizer } from '@angular/platform-browser';
import { MetadataService, PageMetadata } from './services/metadata.service';
import { GlobalSearchComponent } from './components/global-search/global-search.component';
import { filter, map } from 'rxjs/operators';

import { LabelsService } from './services/labels.service';
import { AuthService } from './services/auth.service'; // Add this import
import { environment } from '../environments/environment';

@Component({
  selector: 'app-icon-helper',
  template: `
    @if (isSvgIcon(iconName)) {
    <mat-icon [svgIcon]="iconName"></mat-icon>
    } @else {
    <mat-icon>{{ iconName }}</mat-icon>
    }
  `,
  imports: [MatIconModule],
})
export class IconHelperComponent {
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() iconName!: string;


  // Lista de iconos SVG registrados
  svgIcons = [
    'revistasmes',
    'sceiba',
    'sceibaletras',
    'facebook',
    'twitter',
    'github',
  ];

  isSvgIcon(icon: string): boolean {
    return this.svgIcons.includes(icon);
  }
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    RouterModule,
    MatIconModule,
    IconHelperComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private menuService = inject(ConfigService);
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private metadataService = inject(MetadataService);
  private labelService = inject(LabelsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected readonly isMobile = signal(true);
  private readonly _mobileQuery: MediaQueryList;
  private readonly _mobileQueryListener: () => void;

  config: Config = { title: 'Iroko', menu: [] };
  currentPageTitle = 'Iroko';
  appVersion: string = '';
  metadata: PageMetadata = {
    title: '',
    abstract: '',
    description: '',
    keywords: [],
    subjects: [],
  };

  title = 'iroko-ui-pwa';
  currentUser: any = null; // Add this
  isLoggedIn = false; // Add this

  constructor() {
    this.appVersion = environment.appVersion;
    this.matIconRegistry.addSvgIcon(
      'sceiba',
      this.domSanitizer.bypassSecurityTrustResourceUrl('img/sceiba.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'sceibaletras',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'img/logo.sceiba.letras.svg'
      )
    );
    this.matIconRegistry.addSvgIcon(
      'revistasmes',
      this.domSanitizer.bypassSecurityTrustResourceUrl('img/revistasmes.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'facebook',
      this.domSanitizer.bypassSecurityTrustResourceUrl('img/facebook.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'twitter',
      this.domSanitizer.bypassSecurityTrustResourceUrl('img/twitter.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'github',
      this.domSanitizer.bypassSecurityTrustResourceUrl('img/github.svg')
    );
    const media = inject(MediaMatcher);

    this._mobileQuery = media.matchMedia('(max-width: 600px)');
    this.isMobile.set(this._mobileQuery.matches);
    this._mobileQueryListener = () =>
      this.isMobile.set(this._mobileQuery.matches);
    this._mobileQuery.addEventListener('change', this._mobileQueryListener);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        console.log('NavigationStart:', event.url);
      }
      if (event instanceof NavigationEnd) {
        console.log('NavigationEnd:', event.url);
      }
      if (event instanceof NavigationError) {
        console.error('NavigationError:', event.error);
      }
    });
  }

  ngOnInit() {
    this.menuService.getConfig().subscribe((config) => {
      this.config = config;
    });

    this.metadataService.currentMetadata.subscribe((metadata) => {
      this.metadata = metadata;
      this.currentPageTitle = metadata.title || 'Iroko';
    });

    this.labelService.loadData().subscribe();

    // Subscribe to auth state changes
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      console.log(this.currentUser);
    });

    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isLoggedIn = isAuthenticated;
    });

    // Set page title based on route
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.router.routerState.root;
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        filter((route) => route.outlet === 'primary')
      )
      .subscribe((route) => {
        const title =
          route.snapshot.data['title'] || this.getTitleFromRoute(route);
        this.metadataService.updateMetadata({ title });
      });
  }

  // Add logout method
  logout(): void {
    this.authService.logout();
  }

  private getTitleFromRoute(route: any): string {
    const path = route.snapshot.routeConfig?.path;
    if (!path) return 'Iroko';

    const titleMap: { [key: string]: string } = {
      '': 'Inicio',
      publications: 'Publicaciones',
      organizations: 'Organizaciones',
      persons: 'People',
      projects: 'Projects',
      outputs: 'Resultados de Investigación',
      vocabs: 'Vocabularios',
      query: 'Consulta Cypher',
      search: 'Resultados de Búsqueda',
      login: 'Login', // Add this
      register: 'Register', // Add this
    };

    return titleMap[path] || 'Iroko';
  }

  ngOnDestroy(): void {
    this._mobileQuery.removeEventListener('change', this._mobileQueryListener);
  }

  getMainContainerClass(): string {
    return this.isMobile()
      ? 'main-is-mobile flex flex-col min-h-screen'
      : 'flex flex-col min-h-screen';
  }

  getSidenavOpenedState(): boolean {
    return !this.isMobile();
  }
}
