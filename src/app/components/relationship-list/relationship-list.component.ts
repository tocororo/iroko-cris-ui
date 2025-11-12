import { Component, Input, output } from '@angular/core';

import { RelationshipCardComponent } from '../relationship-card/relationship-card.component';
import { RelationshipGroup } from '../../api/models/relationship.models';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-relationship-list',
  templateUrl: './relationship-list.component.html',
  styleUrls: ['./relationship-list.component.scss'],
  imports: [
    RelationshipCardComponent,
    MatProgressSpinner,
    MatIconModule
],
})
export class RelationshipListComponent {
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() group!: RelationshipGroup;
  readonly nodeSelected = output<any>();
  readonly nodeDelete = output<any>();

  getDisplayedRelationships() {
    return this.group.relationships;
  }

  onNodeSelected(nodeData: any): void {
    this.nodeSelected.emit(nodeData);
  }
  onNodeDelete(nodeData: any): void {
    this.nodeDelete.emit(nodeData);
  }
}
