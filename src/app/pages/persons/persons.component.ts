// src/app/pages/persons/persons.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import { GenericListComponent } from '../../components/generic-list/generic-list.component';
import {
  LabelsService,
  ListColumn,
  ListFilter,
} from '../../services/labels.service';

@Component({
  selector: 'app-persons',
  templateUrl: './persons.component.html',
  styleUrls: ['./persons.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class PersonsComponent {
  personColumns: ListColumn[] = [];
  filters: ListFilter[] = [];

  constructor(
    private metadataService: MetadataService,
    private labelService: LabelsService
  ) {}
  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Personas',
      description:
        'Investigadores, científicos y colaboradores de diversas instituciones y disciplinas. ',
      authors: [],
      subjects: [],
    });
    this.labelService.loadData().subscribe((labels) => {
      this.personColumns = labels.nodes['person'].properties;
      this.filters = labels.nodes['person'].filters;
    });
  }

  onNodeSelected(node: any) {
    console.log('Person selected:', node);
    // Navigate to person detail or show dialog
  }
}
