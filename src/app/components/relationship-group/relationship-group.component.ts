import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RelationshipGroup } from '../../api/models/relationship.models';
import { RelationshipSearchComponent } from '../relationship-search/relationship-search.component';
import { RelationshipListComponent } from '../relationship-list/relationship-list.component';
import { RelationshipPaginationComponent } from '../relationship-pagination/relationship-pagination.component';

@Component({
  selector: 'app-relationship-group',
  templateUrl: './relationship-group.component.html',
  styleUrls: ['./relationship-group.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RelationshipSearchComponent,
    RelationshipListComponent,
    RelationshipPaginationComponent,
  ],
})
export class RelationshipGroupComponent {
  @Input() group!: RelationshipGroup;
  @Input() isExporting = false;
  @Output() nodeSelected = new EventEmitter<any>();
  @Output() nodeDelete = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() search = new EventEmitter<string>();
  @Output() export = new EventEmitter<void>();
  @Output() searchClear = new EventEmitter<void>();

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onSearch(searchTerm: string): void {
    this.search.emit(searchTerm);
  }

  onExport(): void {
    this.export.emit();
  }

  onSearchClear(): void {
    this.searchClear.emit();
  }

  onNodeSelected(nodeData: any): void {
    this.nodeSelected.emit(nodeData);
  }

  onNodeDelete(nodeData: any): void {
    this.nodeDelete.emit(nodeData);
  }

  shouldShowPagination(): boolean {
    return this.group.totalCount > this.group.pageSize;
  }
}
