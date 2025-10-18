// src/app/pages/outputs/outputs.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import { GenericListComponent } from '../../components/generic-list/generic-list.component';
import { LabelsService, ListColumn } from '../../services/labels.service';

@Component({
  selector: 'app-outputs',
  templateUrl: './outputs.component.html',
  styleUrls: ['./outputs.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class OutputsComponent {
  outputColumns: ListColumn[] = [];

  constructor(
    private metadataService: MetadataService,
    private labelService: LabelsService
  ) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Resultados de Investigación',
      description:
        'Explore research publications, articles, and scientific outputs in the knowledge graph',
      authors: [],
      subjects: [],
    });
    this.labelService.loadData().subscribe((labels) => {
      this.outputColumns = labels.nodes['output'].properties;
    });
  }

  onNodeSelected(node: any) {
    console.log('Output selected:', node);
    // Navigate to output detail or show dialog
  }
}
