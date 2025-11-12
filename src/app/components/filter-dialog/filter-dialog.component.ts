// filter-dialog.component.ts
import { Component, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { ListColumn, ListFilter } from '../../services/labels.service';
import { MatIconModule } from '@angular/material/icon';

export interface FilterDialogData {
  availableFilters: ListFilter[];
  selectedFilters: string[];
  columns: ListColumn[];
}

@Component({
  selector: 'app-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss'],
  imports: [MatDialogModule, MatCheckboxModule, MatIconModule],
})
export class FilterDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<FilterDialogComponent>>(MatDialogRef);
  data = inject<FilterDialogData>(MAT_DIALOG_DATA);

  selectedFilters: Set<string> = new Set();

  ngOnInit() {
    // Initialize with the provided selected filters (default filters)
    this.selectedFilters = new Set(this.data.selectedFilters);
  }

  isSelected(filterName: string): boolean {
    return this.selectedFilters.has(filterName);
  }

  onFilterToggle(event: MatCheckboxChange, filterName: string): void {
    if (event.checked) {
      this.selectedFilters.add(filterName);
    } else {
      this.selectedFilters.delete(filterName);
    }
  }

  getFilterTypeLabel(filterType: string): string {
    const typeLabels: { [key: string]: string } = {
      text: 'Texto',
      select: 'Selección',
      multiselect: 'Selección múltiple',
      date: 'Fecha',
      boolean: 'Sí/No',
      relationship: 'Relación',
    };
    return typeLabels[filterType] || filterType;
  }

  onSave(): void {
    this.dialogRef.close(Array.from(this.selectedFilters));
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
