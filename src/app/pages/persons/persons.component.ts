// src/app/pages/persons/persons.component.ts
import { Component, inject } from '@angular/core';

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
  imports: [GenericListComponent, RouterModule],
})
export class PersonsComponent {
  private metadataService = inject(MetadataService);
  private labelService = inject(LabelsService);

  personColumns: ListColumn[] = [];
  filters: ListFilter[] = [];
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
