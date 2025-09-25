import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CypherQuery } from '../../api/models/cypher-query.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-query-executor',
  templateUrl: './query-executor.component.html',
  styleUrls: ['./query-executor.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule,
    MatCheckboxModule
],
})
export class QueryExecutorComponent {
  @Output() queryExecuted = new EventEmitter<CypherQuery>();

  queryForm: FormGroup;
  parameters: { key: string; value: any }[] = [];
  showParameters = false;

  constructor(private fb: FormBuilder) {
    this.queryForm = this.fb.group({
      query: ['', Validators.required],
      readonly: [true],
    });
  }

  addParameter() {
    this.parameters.push({ key: '', value: '' });
  }

  removeParameter(index: number) {
    this.parameters.splice(index, 1);
  }

  onSubmit() {
    if (this.queryForm.valid) {
      const formValue = this.queryForm.value;
      const parametersObj = this.parameters.reduce((acc, param) => {
        if (param.key) {
          acc[param.key] = param.value;
        }
        return acc;
      }, {} as { [key: string]: any });

      const queryData: CypherQuery = {
        query: formValue.query,
        parameters:
          Object.keys(parametersObj).length > 0 ? parametersObj : null,
        readonly: formValue.readonly,
      };

      this.queryExecuted.emit(queryData);
    }
  }
}
