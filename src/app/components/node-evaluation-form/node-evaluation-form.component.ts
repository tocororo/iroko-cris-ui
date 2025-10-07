import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';

// Angular Material Imports
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models
import {
  EvaluationMethodology,
  EvaluationQuestion,
} from '../../api/models/evaluation.model';

@Component({
  selector: 'app-node-evaluation-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Angular Material Modules
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './node-evaluation-form.component.html',
  styleUrls: ['./node-evaluation-form.component.scss'],
})
export class NodeEvaluationFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input({ required: true }) evaluation!: EvaluationMethodology;
  @Input({ required: true }) nodeId!: string;
  @Input() isLoading = false;
  @Output() evaluationSubmit = new EventEmitter<EvaluationMethodology>();

  evaluationForm!: FormGroup;
  panelOpenState: { [key: string]: boolean } = {};

  ngOnInit() {
    this.buildForm();
  }

  private buildForm() {
    const formControls: { [key: string]: [any, any[]?] } = {};

    this.evaluation.sections.forEach((section) => {
      section.categories.forEach((category) => {
        category.questions.forEach((question) => {
          // Only create controls for questions that don't have pre-filled results
          if (question.result === undefined || question.result === null) {
            const validators = [];

            if (question.type === 'number') {
              validators.push(Validators.required);
              if (question.min !== undefined) {
                validators.push(Validators.min(question.min));
              }
              if (question.max !== undefined) {
                validators.push(Validators.max(question.max));
              }
            } else if (
              question.type === 'boolean' ||
              question.type === 'select'
            ) {
              validators.push(Validators.required);
            }

            formControls[question.id] = [question.result || '', validators];
          }
        });
      });
    });

    this.evaluationForm = this.fb.group(formControls);

    // Initialize panel states - open first section by default
    this.evaluation.sections.forEach((section, index) => {
      this.panelOpenState[section.id] = index === 0; // Open first section
      section.categories.forEach((category) => {
        this.panelOpenState[category.id] = false;
      });
    });
  }

  onSubmit() {
    if (this.evaluationForm.valid) {
      // Create a deep copy of the evaluation to avoid mutation
      const updatedEvaluation: EvaluationMethodology = {
        ...this.evaluation,
        sections: this.evaluation.sections.map((section) => ({
          ...section,
          categories: section.categories.map((category) => ({
            ...category,
            questions: category.questions.map((question) => ({
              ...question,
              // Update result if this question is in the form
              ...(this.evaluationForm.contains(question.id) && {
                result: this.evaluationForm.get(question.id)?.value,
              }),
            })),
          })),
        })),
      };

      this.evaluationSubmit.emit(updatedEvaluation);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.evaluationForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  isQuestionAnswered(question: EvaluationQuestion): boolean {
    if (this.evaluationForm.contains(question.id)) {
      const control = this.evaluationForm.get(question.id);
      return control
        ? control.value !== null && control.value !== '' && control.valid
        : false;
    }
    return question.result !== undefined && question.result !== null;
  }

  getSectionCompletion(section: any): number {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    section.categories.forEach((category: any) => {
      category.questions.forEach((question: any) => {
        totalQuestions++;
        if (this.isQuestionAnswered(question)) {
          answeredQuestions++;
        }
      });
    });

    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }

  getOverallCompletion(): number {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    this.evaluation.sections.forEach((section) => {
      section.categories.forEach((category) => {
        category.questions.forEach((question) => {
          totalQuestions++;
          if (this.isQuestionAnswered(question)) {
            answeredQuestions++;
          }
        });
      });
    });

    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }

  getSelectOptionLabel(question: EvaluationQuestion, value: string): string {
    const option = question.selectOptions?.find((opt) => opt.value === value);
    return option ? option.label : value;
  }

  getQuestionControl(questionId: string): AbstractControl | null {
    return this.evaluationForm.get(questionId);
  }

  isFieldInvalid(questionId: string): boolean {
    const control = this.getQuestionControl(questionId);
    return control ? control.invalid && control.touched : false;
  }

  // TrackBy functions for better performance
  trackBySection(index: number, section: any): string {
    return section.id;
  }

  trackByCategory(index: number, category: any): string {
    return category.id;
  }

  trackByQuestion(index: number, question: any): string {
    return question.id;
  }

  trackByOption(index: number, option: any): string {
    return option.value;
  }

  getTotalCategories(evaluation: EvaluationMethodology): number {
    return evaluation.sections.reduce(
      (total, section) => total + section.categories.length,
      0
    );
  }
}
