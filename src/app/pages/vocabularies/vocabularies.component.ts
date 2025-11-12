import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import { GenericListComponent } from '../../components/generic-list/generic-list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { LabelsService, ListColumn } from '../../services/labels.service';

@Component({
  selector: 'app-vocabularies',
  templateUrl: './vocabularies.component.html',
  styleUrls: ['./vocabularies.component.scss'],
  imports: [
    GenericListComponent,
    RouterModule,
    MatTabsModule,
    MatCardModule
],
})
export class VocabulariesComponent implements OnInit {
  private metadataService = inject(MetadataService);
  private labelService = inject(LabelsService);

  // Common columns for all term types
  termColumns: ListColumn[] = [];

  // Configuration for different term types
  termTypes = [
    {
      label: 'Todos los Términos',
      type: 'Term',
      searchIndex: 'termsSearch',
      description: 'Explorar todos los términos del vocabulario',
    },
    {
      label: 'Materias',
      type: 'Subject',
      searchIndex: 'subjectsSearch',
      description: 'Términos de materias y temas',
    },
    {
      label: 'Índices',
      type: 'Index',
      searchIndex: 'indexesSearch',
      description: 'Términos de índices y categorización',
    },
    {
      label: 'Licencias',
      type: 'Licence',
      searchIndex: 'licencesSearch',
      description: 'Términos de licencias y derechos',
    },
    {
      label: 'Palabras clave',
      type: 'Keyword',
      searchIndex: '',
      description: '',
    },
  ];

  selectedTabIndex = 0;

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Vocabularios',
      description: 'Explore términos y vocabularios controlados del sistema',
      authors: [],
      subjects: [],
    });
    this.labelService.loadData().subscribe((labels) => {
      this.termColumns = labels.nodes['term'].properties;
    });
  }

  onNodeSelected(node: any) {
    console.log('Término seleccionado:', node);
  }

  getCurrentTermType(): string {
    return this.termTypes[this.selectedTabIndex].type;
  }

  getCurrentSearchIndex(): string | undefined {
    return this.termTypes[this.selectedTabIndex].searchIndex;
  }

  getCurrentDescription(): string {
    return this.termTypes[this.selectedTabIndex].description;
  }
}
