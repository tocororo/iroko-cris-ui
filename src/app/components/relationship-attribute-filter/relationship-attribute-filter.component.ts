// src/app/components/relationship-attribute-filter/relationship-attribute-filter.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-relationship-attribute-filter',
  templateUrl: './relationship-attribute-filter.component.html',
  styleUrls: ['./relationship-attribute-filter.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class RelationshipAttributeFilterComponent implements OnInit {
  @Input() config!: any;
  @Input() label: string = 'Filtrar por atributo de relación';
  @Output() valueChange = new EventEmitter<any>();

  valueControl = new FormControl('');
  operatorControl = new FormControl('EQUALS');

  operators = [
    { value: 'EQUALS', label: 'Igual a' },
    { value: 'GREATER_THAN', label: 'Mayor que' },
    { value: 'LESS_THAN', label: 'Menor que' },
    { value: 'GREATER_EQUAL', label: 'Mayor o igual que' },
    { value: 'LESS_EQUAL', label: 'Menor o igual que' },
  ];

  ngOnInit() {
    // Listen for value changes
    this.valueControl.valueChanges.subscribe(() => this.emitValue());
    this.operatorControl.valueChanges.subscribe(() => this.emitValue());
  }

  private emitValue() {
    const value = this.valueControl.value;
    const operator = this.operatorControl.value;

    if (value) {
      this.valueChange.emit({
        value: value,
        operator: operator,
        attribute: this.config.attribute,
      });
    } else {
      this.valueChange.emit(null);
    }
  }

  clearFilter() {
    this.valueControl.setValue('');
    this.operatorControl.setValue('EQUALS');
    this.valueChange.emit(null);
  }

  get placeholder(): string {
    return this.config.placeholder || `Valor para ${this.config.attribute}`;
  }
}
