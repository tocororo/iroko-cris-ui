import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RelationshipGroupComponent } from '../relationship-group/relationship-group.component';
import { RelationshipGroup } from '../../api/models/relationship.models';
import { LabelsService } from '../../services/labels.service';

@Component({
  selector: 'app-node-relationships',
  templateUrl: './node-relationships.component.html',
  styleUrls: ['./node-relationships.component.scss'],
  imports: [CommonModule, MatIconModule, RelationshipGroupComponent],
})
export class NodeRelationshipsComponent implements OnDestroy {
  @Input() relationshipGroups: RelationshipGroup[] = [];
  @Input() isExporting = false;
  @Input() labelNameFn: (name: string) => string = (name) => name;

  @Output() nodeSelected = new EventEmitter<any>();
  @Output() relationshipPageChange = new EventEmitter<{
    group: RelationshipGroup;
    page: number;
  }>();
  @Output() relationshipSearch = new EventEmitter<{
    group: RelationshipGroup;
    searchTerm: string;
  }>();
  @Output() relationshipExport = new EventEmitter<RelationshipGroup>();
  @Output() searchClear = new EventEmitter<RelationshipGroup>();

  onNodeSelected(nodeData: any): void {
    this.nodeSelected.emit(nodeData);
  }

  onPageChange(group: RelationshipGroup, page: number): void {
    this.relationshipPageChange.emit({ group, page });
  }

  onSearch(group: RelationshipGroup, searchTerm: string): void {
    this.relationshipSearch.emit({ group, searchTerm });
  }

  onExport(group: RelationshipGroup): void {
    this.relationshipExport.emit(group);
  }

  onSearchClear(group: RelationshipGroup): void {
    this.searchClear.emit(group);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
