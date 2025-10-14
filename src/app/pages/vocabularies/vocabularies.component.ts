import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListColumn,
} from '../../components/generic-list/generic-list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-vocabularies',
  templateUrl: './vocabularies.component.html',
  styleUrls: ['./vocabularies.component.scss'],
  imports: [
    CommonModule,
    GenericListComponent,
    RouterModule,
    MatTabsModule,
    MatCardModule,
  ],
})
export class VocabulariesComponent implements OnInit {
  // Common columns for all term types
  termColumns: ListColumn[] = [
    {
      name: 'id',
      label: 'ID',
      sortable: true,
      filterable: false,
      type: 'string',
    },
    {
      name: 'name',
      label: 'Nombre',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'description',
      label: 'Descripción',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'identifier',
      label: 'Identificador',
      sortable: true,
      filterable: false,
      type: 'string',
    },
  ];

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
  ];

  selectedTabIndex = 0;

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Vocabularios',
      description: 'Explore términos y vocabularios controlados del sistema',
      authors: [],
      subjects: [],
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
