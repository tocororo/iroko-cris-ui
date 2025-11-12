// src/app/components/node-edit-form/node-edit-form.component.ts
import {
  Component,
  OnInit,
  inject,
  input,
  output
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { NodeEditService } from '../../services/node-edit.service';
import { CypherApiService } from '../../services/cypher-api.service';
import {
  NodePropertyUpdate,
  RelationshipUpdate,
  NodeEditRequest,
} from '../../api/models/node-edit.model';

interface RelationshipProperty {
  key: string;
  value: any;
  type: string;
}

@Component({
  selector: 'app-node-edit-form',
  templateUrl: './node-edit-form.component.html',
  styleUrls: ['./node-edit-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule
],
})
export class NodeEditFormComponent implements OnInit {
  readonly node = input<any>();
  readonly nodeType = input<string>('');
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private editService = inject(NodeEditService);
  private cypherService = inject(CypherApiService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  editForm!: FormGroup;
  relationshipsForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  availableRelationshipTypes: string[] = [];
  availableNodes: any[] = [];

  // Properties that should not be editable
  private readonly protectedProperties = [
    'iroko_uuid',
    'identity',
    'elementId',
    'labels',
  ];

  // Available data types for relationship properties
  readonly propertyTypes = [
    { value: 'string', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'boolean', label: 'Booleano' },
  ];

  ngOnInit() {
    this.initializeForms();
    this.loadRelationshipTypes();

    // Setup search for target nodes
    this.relationshipsForm
      .get('targetNode')
      ?.valueChanges.subscribe((value) => {
        if (typeof value === 'string') {
          this.searchNodes(value);
        }
      });
  }

  private initializeForms() {
    // Main properties form
    const propertyControls: { [key: string]: any } = {};

    const node = this.node();
    if (node) {
      Object.keys(node).forEach((key) => {
        if (!this.protectedProperties.includes(key) && !key.startsWith('_')) {
          const value = this.node()[key];
          propertyControls[key] = [
            value,
            this.getValidatorsForProperty(key, value),
          ];
        }
      });
    }

    this.editForm = this.fb.group(propertyControls);

    // Relationships form
    this.relationshipsForm = this.fb.group({
      relationshipType: ['', Validators.required],
      targetNode: ['', Validators.required],
      relationshipProperties: this.fb.array([]), // Changed to FormArray
    });
  }

  // Getter for relationship properties form array
  get relationshipPropertiesArray(): FormArray {
    return this.relationshipsForm.get('relationshipProperties') as FormArray;
  }

  // Add a new property field
  addRelationshipProperty() {
    const propertyGroup = this.fb.group({
      key: ['', Validators.required],
      value: [''],
      type: ['string', Validators.required],
    });

    this.relationshipPropertiesArray.push(propertyGroup);
  }

  // Remove a property field
  removeRelationshipProperty(index: number) {
    this.relationshipPropertiesArray.removeAt(index);
  }

  // Convert relationship properties array to object
  private convertPropertiesArrayToObject(): { [key: string]: any } {
    const properties: { [key: string]: any } = {};

    this.relationshipPropertiesArray.controls.forEach((control) => {
      const key = control.get('key')?.value;
      const type = control.get('type')?.value;
      let value = control.get('value')?.value;

      // Convert value based on type
      if (key) {
        switch (type) {
          case 'number':
            value = value ? Number(value) : 0;
            break;
          case 'boolean':
            value = Boolean(value);
            break;
          // string is default, no conversion needed
        }
        properties[key] = value;
      }
    });

    return properties;
  }

  private getValidatorsForProperty(key: string, value: any): any[] {
    const validators = [];

    // Add required validator for critical fields
    if (['name', 'title'].includes(key)) {
      validators.push(Validators.required);
    }

    // Add max length validators
    if (typeof value === 'string') {
      validators.push(Validators.maxLength(1000));
    }

    return validators;
  }

  private loadRelationshipTypes() {
    // Load available relationship types from labels service or API
    const query = `
      CALL db.relationshipTypes() YIELD relationshipType
      RETURN relationshipType
      ORDER BY relationshipType
    `;

    this.cypherService.executeQuery({ query, readonly: true }).subscribe({
      next: (results) => {
        this.availableRelationshipTypes = results.map(
          (r: any) => r.relationshipType
        );
      },
      error: (error) => {
        console.error('Error loading relationship types:', error);
      },
    });
  }

  searchNodes(searchTerm: string) {
    if (!searchTerm || searchTerm.length < 2) return;

    const query = `
      MATCH (n)
      WHERE (toLower(COALESCE(toString(n.name), '')) CONTAINS toLower($searchTerm))
      RETURN n, labels(n) as labels
      LIMIT 15
    `;

    this.cypherService
      .executeQuery({
        query,
        parameters: { searchTerm },
        readonly: true,
      })
      .subscribe({
        next: (results) => {
          this.availableNodes = results.map((item: any) => ({
            ...item.n,
            labels: item.labels,
          }));
        },
        error: (error) => {
          console.error('Error searching nodes:', error);
        },
      });
  }

  onSaveProperties() {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    this.isSubmitting = true;

    const updateData: NodePropertyUpdate = {
      iroko_uuid: this.node().iroko_uuid,
      properties: this.editForm.value,
    };

    this.editService.updateNodeProperties(updateData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.snackBar.open(
            'Propiedades actualizadas correctamente',
            'Cerrar',
            {
              duration: 5000,
            }
          );
          // TODO: The 'emit' function requires a mandatory void argument
          this.saved.emit();
        } else {
          this.snackBar.open(`Error: ${response.message}`, 'Cerrar', {
            duration: 5000,
          });
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error updating properties:', error);
        this.snackBar.open('Error al actualizar las propiedades', 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  onAddRelationship() {
    if (this.relationshipsForm.invalid) {
      this.markFormGroupTouched(this.relationshipsForm);
      return;
    }

    // Validate relationship properties
    const propertiesValid = this.validateRelationshipProperties();
    if (!propertiesValid) {
      return;
    }

    const formValue = this.relationshipsForm.value;
    const relationship: RelationshipUpdate = {
      from_uuid: this.node().iroko_uuid,
      to_uuid: formValue.targetNode.iroko_uuid,
      relation_type: formValue.relationshipType,
      properties: this.convertPropertiesArrayToObject(),
    };

    this.isSubmitting = true;

    this.editService.createOrUpdateRelationship(relationship).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.snackBar.open('Relación añadida correctamente', 'Cerrar', {
            duration: 5000,
          });
          this.relationshipsForm.reset();
          this.relationshipPropertiesArray.clear();
          // TODO: The 'emit' function requires a mandatory void argument
          this.saved.emit();
        } else {
          this.snackBar.open(`Error: ${response.message}`, 'Cerrar', {
            duration: 5000,
          });
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error adding relationship:', error);
        this.snackBar.open('Error al añadir la relación', 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  private validateRelationshipProperties(): boolean {
    let isValid = true;

    this.relationshipPropertiesArray.controls.forEach((control, index) => {
      const keyControl = control.get('key');
      const valueControl = control.get('value');

      if (keyControl?.invalid) {
        keyControl.markAsTouched();
        isValid = false;
      }

      // Additional validation can be added here based on type
      if (valueControl?.invalid) {
        valueControl.markAsTouched();
        isValid = false;
      }
    });

    return isValid;
  }

  onCancel() {
    // TODO: The 'emit' function requires a mandatory void argument
    this.cancelled.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl?.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Add missing method
  getFormControlNames(): string[] {
    return Object.keys(this.editForm.controls);
  }

  getNodeDisplayName(node: any): string {
    return node ? `${node?.name || node?.iroko_uuid}` : '';
  }

  getNodeRelationDisplayName(node: any): string {
    return node
      ? `${node?.name || node?.iroko_uuid} (${node.labels?.join(', ')})`
      : '';
  }

  getPropertyType(value: any): string {
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
