// src/app/app.component.ts (updated)
import {
  Component,
  importProvidersFrom,
  inject,
  signal,
  OnInit,
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
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    RouterModule,
    MatIconModule,
    GlobalSearchComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  protected readonly isMobile = signal(true);
  private readonly _mobileQuery: MediaQueryList;
  private readonly _mobileQueryListener: () => void;

  config: Config = { title: 'Iroko', menu: [] };
  currentPageTitle = 'Iroko';
  metadata: PageMetadata = {
    title: '',
    abstract: '',
    description: '',
    keywords: [],
    subjects: [],
  };

  title = 'iroko-ui-pwa';

  constructor(
    private menuService: ConfigService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private metadataService: MetadataService,
    private router: Router
  ) {
    this.matIconRegistry.addSvgIcon(
      'sceiba',
      this.domSanitizer.bypassSecurityTrustResourceUrl('img/sceiba.svg')
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

  private getTitleFromRoute(route: any): string {
    const path = route.snapshot.routeConfig?.path;
    if (!path) return 'Iroko';

    const titleMap: { [key: string]: string } = {
      '': 'Inicio',
      sources: 'Sources',
      organizations: 'Organizaciones',
      persons: 'People',
      projects: 'Projects',
      outputs: 'Resultados de Investigación',
      vocabs: 'Vocabularios',
      query: 'Consulta Cypher',
      search: 'Resultados de Búsqueda',
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
  // Add this method to the AppComponent class in app.component.ts
  getSidenavOpenedState(): boolean {
    // Expanded by default on desktop, collapsed on mobile
    return !this.isMobile();
  }
}
