import {
  Component,
  OnDestroy,
  OnInit,
  input,
  output
} from '@angular/core';

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
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
],
})
export class RelationshipSearchComponent implements OnInit, OnDestroy {
  readonly groupType = input('');
  readonly searchTerm = input('');
  readonly isLoading = input(false);
  readonly isSearching = input(false);
  readonly showSearch = input(false);

  readonly search = output<string>();
  readonly searchClear = output<void>();

  searchControl = new FormControl('');
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    this.searchControl.setValue(this.searchTerm(), { emitEvent: false });

    this.searchSubscription = this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.search.emit(searchTerm || '');
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    // TODO: The 'emit' function requires a mandatory void argument
    this.searchClear.emit();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }
}
