import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  selector: 'app-relationship-search',
  templateUrl: './relationship-search.component.html',
  styleUrls: ['./relationship-search.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class RelationshipSearchComponent implements OnInit, OnDestroy {
  @Input() groupType = '';
  @Input() searchTerm = '';
  @Input() isLoading = false;
  @Input() isSearching = false;
  @Input() showSearch = false;

  @Output() search = new EventEmitter<string>();
  @Output() searchClear = new EventEmitter<void>();

  searchControl = new FormControl('');
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    this.searchControl.setValue(this.searchTerm, { emitEvent: false });

    this.searchSubscription = this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.search.emit(searchTerm || '');
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.searchClear.emit();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }
}
