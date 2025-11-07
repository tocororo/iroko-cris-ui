// src/app/components/relationship-filter/relationship-filter.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormField, MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
  of,
  Observable,
} from 'rxjs';
import { CypherApiService } from '../../services/cypher-api.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  ListFilter,
  FilterValue,
  DisplayItem,
  RelationshipAttributeConfig,
} from '../../services/labels.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

interface AttributeControls {
  valueControl: FormControl;
  operatorControl: FormControl;
}

@Component({
  selector: 'app-relationship-filter',
  templateUrl: './relationship-filter.component.html',
  styleUrls: ['./relationship-filter.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class RelationshipFilterComponent implements OnInit, OnChanges {
  @Input() filter!: ListFilter;
  label: string = 'Filtrar por relación';
  @Input() initialValue: FilterValue = { ids: [] };
  @Output() selectionChange = new EventEmitter<FilterValue>();

  searchControl = new FormControl('');
  selectedIds: string[] = [];
  displayItems: DisplayItem[] = [];
  options: DisplayItem[] = [];
  isLoading = false;
  hasError = false;

  // Store attribute controls in a map for multiple attribute configs
  attributeControls = new Map<string, AttributeControls>();

  operators = [
    { value: 'EQUALS', label: '=' },
    { value: 'GREATER_THAN', label: '>' },
    { value: 'LESS_THAN', label: '<' },
    { value: 'GREATER_EQUAL', label: '>=' },
    { value: 'LESS_EQUAL', label: '<=' },
  ];

  // Safe accessor for template
  attributeConfigs: RelationshipAttributeConfig[] = [];

  constructor(private cypherApiService: CypherApiService) {}

  ngOnInit() {
    this.label = this.filter.label;
    this.setupSearch();
    this.initializeAttributeControls();

    if (this.initialValue?.ids?.length > 0) {
      this.selectedIds = [...this.initialValue.ids];
      this.fetchNamesForIds(this.initialValue.ids);
    }

    if (this.initialValue?.attributeValues) {
      this.setAttributeValues(this.initialValue.attributeValues);
    }

    // Listen for attribute changes
    this.setupAttributeListeners();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialValue'] && !changes['initialValue'].firstChange) {
      const newValue = changes['initialValue'].currentValue || { ids: [] };

      // Update IDs
      if (JSON.stringify(newValue.ids) !== JSON.stringify(this.selectedIds)) {
        this.selectedIds = [...newValue.ids];
        if (newValue.ids.length > 0) {
          this.fetchNamesForIds(newValue.ids);
        } else {
          this.displayItems = [];
        }
      }

      // Update attribute values
      if (newValue.attributeValues) {
        this.setAttributeValues(newValue.attributeValues);
      }
    }

    if (changes['filter'] && !changes['filter'].firstChange) {
      this.initializeAttributeControls();
    }
  }

  private initializeAttributeControls() {
    // Clear existing controls
    this.attributeControls.clear();
    this.attributeConfigs = [];

    if (this.filter.relationshipConfig?.attributeConfig) {
      this.attributeConfigs = [
        ...this.filter.relationshipConfig.attributeConfig,
      ];

      this.filter.relationshipConfig.attributeConfig.forEach((config) => {
        // Set appropriate default value based on type
        let defaultValue: any;
        switch (config.type) {
          case 'number':
            defaultValue =
              config.default !== undefined ? Number(config.default) : null;
            break;
          case 'date':
            defaultValue = config.default ? new Date(config.default) : null;
            break;
          case 'text':
          default:
            defaultValue = config.default || '';
            break;
        }

        const valueControl = new FormControl(defaultValue);
        const operatorControl = new FormControl(config.operator || 'EQUALS');

        this.attributeControls.set(config.attribute, {
          valueControl,
          operatorControl,
        });
      });
    }
  }

  private setupAttributeListeners() {
    this.attributeControls.forEach((controls, attribute) => {
      controls.valueControl.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe(() => this.emitSelectionChange());

      controls.operatorControl.valueChanges
        .pipe(debounceTime(300))
        .subscribe(() => this.emitSelectionChange());
    });
  }

  private setAttributeValues(attributeValues: {
    [key: string]: { value: any; operator: string };
  }) {
    Object.entries(attributeValues).forEach(([attribute, config]) => {
      const controls = this.attributeControls.get(attribute);
      const attributeConfig = this.getAttributeConfig(attribute);

      if (controls && attributeConfig) {
        let value = config.value;

        // Convert value based on type
        switch (attributeConfig.type) {
          case 'number':
            value =
              value !== null && value !== undefined ? Number(value) : null;
            break;
          case 'date':
            value = value ? new Date(value) : null;
            break;
          // text type doesn't need conversion
        }

        controls.valueControl.setValue(value, { emitEvent: false });
        controls.operatorControl.setValue(config.operator || 'EQUALS', {
          emitEvent: false,
        });
      }
    });
  }

  private setupSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.searchRelationships(term || ''))
      )
      .subscribe({
        next: (results) => {
          this.options = results;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.hasError = true;
          this.isLoading = false;
          this.options = [];
        },
      });
  }

  private searchRelationships(searchTerm: string): Observable<DisplayItem[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return of([]);
    }

    this.isLoading = true;
    this.hasError = false;

    const targetLabel = this.filter.relationshipConfig?.targetLabel
      ? `:${this.filter.relationshipConfig.targetLabel}`
      : '';
    const query = `
      MATCH (node${targetLabel})
      WHERE toLower(node.name) CONTAINS toLower($searchTerm)
      RETURN node.iroko_uuid AS iroko_uuid, node.name AS name
      ORDER BY node.name
      LIMIT 10
    `;

    return this.cypherApiService
      .executeQuery({
        query,
        parameters: { searchTerm },
        readonly: true,
      })
      .pipe(
        map((results: any[]) =>
          results.map((item) => ({
            iroko_uuid: item.iroko_uuid,
            name: item.name,
          }))
        ),
        catchError((error) => {
          console.error('Search query error:', error);
          this.hasError = true;
          return of([]);
        })
      );
  }

  private fetchNamesForIds(ids: string[]) {
    if (!ids.length) {
      this.displayItems = [];
      return;
    }

    const query = `
      MATCH (node:${this.filter.relationshipConfig?.targetLabel})
      WHERE node.iroko_uuid IN $ids
      RETURN node.iroko_uuid AS iroko_uuid, node.name AS name
      ORDER BY node.name
    `;

    this.cypherApiService
      .executeQuery({
        query,
        parameters: { ids },
        readonly: true,
      })
      .subscribe({
        next: (results: any[]) => {
          this.displayItems = results.map((item) => ({
            iroko_uuid: item.iroko_uuid,
            name: item.name,
          }));
        },
        error: (error) => {
          console.error('Error fetching names:', error);
          this.hasError = true;
        },
      });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    // Trigger search through valueChanges
  }

  onOptionSelected(event: any) {
    const option: DisplayItem = event.option.value;
    if (!this.selectedIds.includes(option.iroko_uuid)) {
      this.selectedIds.push(option.iroko_uuid);
      this.displayItems.push(option);
      this.emitSelectionChange();
    }
    this.searchControl.setValue('');
    this.options = [];
  }

  removeRelationship(item: DisplayItem) {
    const index = this.selectedIds.indexOf(item.iroko_uuid);
    if (index >= 0) {
      this.selectedIds.splice(index, 1);
      this.displayItems.splice(index, 1);
      this.emitSelectionChange();
    }
  }

  clearAll() {
    this.selectedIds = [];
    this.displayItems = [];
    this.clearAllAttributes();
    this.emitSelectionChange();
  }

  clearAttributeFilter(attribute: string) {
    const controls = this.attributeControls.get(attribute);
    if (controls) {
      const config = this.getAttributeConfig(attribute);
      let defaultValue: any;

      // Set appropriate default value based on type
      switch (config?.type) {
        case 'number':
          defaultValue =
            config?.default !== undefined ? Number(config.default) : null;
          break;
        case 'date':
          defaultValue = config?.default ? new Date(config.default) : null;
          break;
        case 'text':
        default:
          defaultValue = config?.default || '';
          break;
      }

      controls.valueControl.setValue(defaultValue);
      controls.operatorControl.setValue(config?.operator || 'EQUALS');
      this.emitSelectionChange();
    }
  }

  clearAllAttributes() {
    this.attributeControls.forEach((controls, attribute) => {
      const config = this.getAttributeConfig(attribute);
      let defaultValue: any;

      // Set appropriate default value based on type
      switch (config?.type) {
        case 'number':
          defaultValue =
            config?.default !== undefined ? Number(config.default) : null;
          break;
        case 'date':
          defaultValue = config?.default ? new Date(config.default) : null;
          break;
        case 'text':
        default:
          defaultValue = config?.default || '';
          break;
      }

      controls.valueControl.setValue(defaultValue);
      controls.operatorControl.setValue(config?.operator || 'EQUALS');
    });
  }

  // In the emitSelectionChange method, update to handle multiple attributes
  private emitSelectionChange() {
    const filterValue: FilterValue = {
      ids: [...this.selectedIds],
    };

    // Include attribute filters for all configured attributes
    const attributeValues: { [key: string]: { value: any; operator: string } } =
      {};
    let hasAttributeValues = false;

    this.attributeControls.forEach((controls, attribute) => {
      const attributeConfig = this.getAttributeConfig(attribute);

      if (
        controls.valueControl.value !== null &&
        controls.valueControl.value !== ''
      ) {
        let value = controls.valueControl.value;

        // Convert value for storage based on type
        switch (attributeConfig?.type) {
          case 'date':
            value = value instanceof Date ? value.toISOString() : value;
            break;
          case 'number':
            value = Number(value);
            break;
          // text type doesn't need conversion
        }

        attributeValues[attribute] = {
          value: value,
          operator: controls.operatorControl.value!,
        };
        hasAttributeValues = true;
      }
    });

    if (hasAttributeValues) {
      filterValue.attributeValues = attributeValues;
    }

    this.selectionChange.emit(filterValue);
  }

  hasAttributeConfig(): boolean {
    return (
      this.selectedIds.length > 0 &&
      !!this.filter.relationshipConfig?.attributeConfig &&
      this.filter.relationshipConfig.attributeConfig.length > 0
    );
  }

  getAttributeConfigs(): RelationshipAttributeConfig[] {
    return this.attributeConfigs;
  }

  getAttributeConfig(
    attribute: string
  ): RelationshipAttributeConfig | undefined {
    return this.attributeConfigs.find(
      (config) => config.attribute === attribute
    );
  }

  getAttributeControls(attribute: string): AttributeControls | null {
    return this.attributeControls.get(attribute) || null;
  }

  // Safe getters for template
  getValueControl(attribute: string): FormControl {
    return (
      this.attributeControls.get(attribute)?.valueControl || new FormControl('')
    );
  }

  getOperatorControl(attribute: string): FormControl {
    return (
      this.attributeControls.get(attribute)?.operatorControl ||
      new FormControl('EQUALS')
    );
  }

  get placeholder(): string {
    return (
      this.filter.placeholder ||
      `Buscar ${this.filter.relationshipConfig?.targetLabel.toLowerCase()}...`
    );
  }

  getDisplayName(option: DisplayItem): string {
    return option ? option.name : '';
  }
}
