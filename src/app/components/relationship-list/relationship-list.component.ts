import { Component, Input, Output, EventEmitter } from '@angular/core';

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
  @Input() group!: RelationshipGroup;
  @Output() nodeSelected = new EventEmitter<any>();
  @Output() nodeDelete = new EventEmitter<any>();

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
