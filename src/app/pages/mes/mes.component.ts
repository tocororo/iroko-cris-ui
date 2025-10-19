// src/app/pages/mes/mes.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  AdvancedQueryOptions,
  GenericListComponent,
} from '../../components/generic-list/generic-list.component';
import {
  LabelsService,
  ListColumn,
  ListFilter,
} from '../../services/labels.service';

@Component({
  selector: 'app-mes',
  templateUrl: './mes.component.html',
  styleUrls: ['./mes.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class MesComponent {
  mesColumns: ListColumn[] = [];

  filters: ListFilter[] = [];

  mesAdvancedQuery: AdvancedQueryOptions = {
    customWhereClause:
      "EXISTS((n)-[:SOURCE_CREATED_IN]->(:Organization {id: '11514c12-3d6a-43d0-ba3b-3b992aa96295'}))",
  };

  constructor(
    private metadataService: MetadataService,
    private labelService: LabelsService
  ) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Revistas MES',
      description: 'Revistas científicas del Ministerio de Educación Superior',
      authors: [],
      subjects: [],
    });

    this.labelService.loadData().subscribe((labels) => {
      this.mesColumns = labels.nodes['publication'].properties;
      this.filters = labels.nodes['publication'].filters;
    });
  }

  onNodeSelected(node: any) {
    console.log('MES journal selected:', node);
    // Navigate to journal detail or show dialog
  }
}
