import { Component, input, output } from '@angular/core';

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
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RelationshipSearchComponent,
    RelationshipListComponent,
    RelationshipPaginationComponent
],
})
export class RelationshipGroupComponent {
  readonly group = input.required<RelationshipGroup>();
  readonly isExporting = input(false);
  readonly nodeSelected = output<any>();
  readonly nodeDelete = output<any>();
  readonly pageChange = output<number>();
  readonly search = output<string>();
  readonly export = output<void>();
  readonly searchClear = output<void>();

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onSearch(searchTerm: string): void {
    this.search.emit(searchTerm);
  }

  onExport(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.export.emit();
  }

  onSearchClear(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.searchClear.emit();
  }

  onNodeSelected(nodeData: any): void {
    this.nodeSelected.emit(nodeData);
  }

  onNodeDelete(nodeData: any): void {
    this.nodeDelete.emit(nodeData);
  }

  shouldShowPagination(): boolean {
    return this.group().totalCount > this.group().pageSize;
  }
}
