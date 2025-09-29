// src/app/components/global-search/global-search.component.ts
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SearchResult, SearchService } from '../../services/search.service';

@Component({
  selector: 'app-global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
  ],
})
export class GlobalSearchComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchTerm = '';
  searchResults: SearchResult[] = [];
  isLoading = false;
  showResults = false;

  private searchTerms = new Subject<string>();

  constructor(private searchService: SearchService, private router: Router) {}

  ngOnInit() {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term.trim()) {
            this.searchResults = [];
            return [];
          }
          this.isLoading = true;
          return this.searchService.globalSearch(term);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults = results.map((item: any) => ({
            id: item.node.properties.id || item.node.identity,
            type: item.type,
            label:
              item.node.properties.name ||
              item.node.properties.title ||
              'Unnamed',
            description: item.node.properties.description,
            properties: item.node.properties,
            score: item.score,
          }));
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.isLoading = false;
        },
      });
  }

  onSearchInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerms.next(term);
  }

  onSearchSubmit(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchTerm },
      });
      this.showResults = false;
      this.searchInput.nativeElement.blur();
    }
  }

  onResultSelect(result: SearchResult): void {
    this.router.navigate([`/${result.type.toLowerCase()}s`, result.id]);
    this.showResults = false;
    this.searchTerm = '';
  }

  onFocus(): void {
    if (this.searchResults.length > 0) {
      this.showResults = true;
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showResults = false;
    }, 200);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.showResults = false;
  }
}
