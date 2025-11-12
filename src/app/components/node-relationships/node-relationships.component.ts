import {
  Component,
  OnDestroy,
  input,
  output
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { RelationshipGroupComponent } from '../relationship-group/relationship-group.component';
import { RelationshipGroup } from '../../api/models/relationship.models';
import { LabelsService } from '../../services/labels.service';

@Component({
  selector: 'app-node-relationships',
  templateUrl: './node-relationships.component.html',
  styleUrls: ['./node-relationships.component.scss'],
  imports: [MatIconModule, RelationshipGroupComponent],
})
export class NodeRelationshipsComponent implements OnDestroy {
  readonly relationshipGroups = input<RelationshipGroup[]>([]);
  readonly isExporting = input(false);
  readonly labelNameFn = input<(name: string) => string>((name) => name);

  readonly nodeSelected = output<any>();
  readonly relationshipPageChange = output<{
    group: RelationshipGroup;
    page: number;
}>();
  readonly relationshipSearch = output<{
    group: RelationshipGroup;
    searchTerm: string;
}>();
  readonly relationshipExport = output<RelationshipGroup>();
  readonly searchClear = output<RelationshipGroup>();

  onNodeSelected(group: RelationshipGroup, nodeData: any): void {
    let a = { node: nodeData, group: group };
    console.warn(a);

    this.nodeSelected.emit(a);
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
