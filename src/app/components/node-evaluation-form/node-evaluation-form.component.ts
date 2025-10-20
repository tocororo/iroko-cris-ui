// node-evaluation-form.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
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
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Models
import {
  EvaluationMethodology,
  EvaluationQuestion,
  EvaluationResult,
  EvaluationSection,
  EvaluationCategory,
} from '../../api/models/evaluation.model';
import { MatChipsModule } from '@angular/material/chips';

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
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatChipsModule,
  ],
  templateUrl: './node-evaluation-form.component.html',
  styleUrls: ['./node-evaluation-form.component.scss'],
})
export class NodeEvaluationFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  @Input({ required: true }) evaluation!: EvaluationResult;
  @Input({ required: true }) nodeId!: string;
  @Input() isLoading = false;
  @Input() isFinalizing = false;
  @Output() evaluationSubmit = new EventEmitter<EvaluationResult>();
  @Output() evaluationFinalize = new EventEmitter<EvaluationResult>();

  evaluationForm!: FormGroup;
  panelOpenState: { [key: string]: boolean } = {};
  hasBeenSubmitted = false;

  editSystemAnswers = false;

  user_id: string | undefined = undefined;

  ngOnInit() {
    this.buildForm();
    this.user_id = this.evaluation.user_id;
  }

  ngOnChanges(changes: SimpleChanges) {
    // Rebuild form when evaluation input changes (after reload)
    if (changes['evaluation'] && !changes['evaluation'].firstChange) {
      this.user_id = this.evaluation.user_id;
      this.buildForm();
    }
  }
  private getInitialValue(question: EvaluationQuestion): any {
    const result = question.answer?.result;

    // Handle null/undefined
    if (result === undefined || result === null) {
      return '';
    }

    // Ensure boolean values remain as booleans
    if (question.type === 'boolean') {
      return Boolean(result); // This handles both actual booleans and string 'true'/'false'
    }

    return result;
  }
  private buildForm() {
    const formControls: { [key: string]: [any, any[]?] } = {};

    this.evaluation.methodology.sections.forEach(
      (section: EvaluationSection) => {
        section.categories.forEach((category: EvaluationCategory) => {
          category.questions.forEach((question_id: string) => {
            const question: EvaluationQuestion =
              this.evaluation.question_data[question_id];
            // Only create controls for questions that don't have pre-filled results
            // After submission, all user answers will be pre-filled, so no controls will be created
            if (
              question.answer?.result === undefined ||
              question.answer?.result === null ||
              this.isUserAnsweredQuestion(question) ||
              this.editSystemAnswers
            ) {
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

              formControls[question.id] = [
                this.getInitialValue(question),
                validators,
              ];
            }
          });
        });
      }
    );

    this.evaluationForm = this.fb.group(formControls);

    // Initialize panel states - open first section by default
    this.evaluation.methodology.sections.forEach(
      (section: EvaluationSection, index: number) => {
        this.panelOpenState[section.id] = index === 0; // Open first section
        section.categories.forEach(
          (category: EvaluationCategory, indexc: number) => {
            this.panelOpenState[category.id] = index === 0 && indexc === 0;
          }
        );
      }
    );
  }
  toggleEditSystemAnswers() {
    this.editSystemAnswers = !this.editSystemAnswers;
    // Rebuild form when toggling edit mode to include/exclude system answers
    this.buildForm();
  }
  hasSystemAnswer(question: EvaluationQuestion): boolean {
    return !!(
      question.answer?.result !== undefined &&
      question.answer?.result !== null &&
      !this.isUserAnsweredQuestion(question)
    );
  }

  private getFormVal(formValue: any, question: EvaluationQuestion) {
    if (question.type === 'boolean') {
      // Handle both string and boolean values
      if (formValue === 'true' || formValue === true) return true;
      if (formValue === 'false' || formValue === false) return false;
      return formValue; // return as-is if it doesn't match expected values
    } else if (question.type === 'number') {
      // Convert string numbers to actual numbers
      return formValue !== '' ? Number(formValue) : formValue;
    } else {
      return formValue;
    }
  }

  onSubmit() {
    if (this.evaluationForm.valid) {
      // Create a deep copy of the evaluation to avoid mutation
      const updatedEvaluation: EvaluationResult = {
        ...this.evaluation,
        question_data: { ...this.evaluation.question_data },
      };

      // Update question answers from form
      Object.keys(this.evaluationForm.controls).forEach((questionId) => {
        if (updatedEvaluation.question_data[questionId]) {
          const formValue = this.evaluationForm.get(questionId)?.value;

          updatedEvaluation.question_data[questionId] = {
            ...updatedEvaluation.question_data[questionId],
            answer: {
              ...updatedEvaluation.question_data[questionId].answer,
              result: this.getFormVal(
                formValue,
                updatedEvaluation.question_data[questionId]
              ),
              // Add user_id only for user-answered questions (not pre-filled)
              user_id: this.user_id,
            },
          };
        }
      });

      // Update completion status
      updatedEvaluation.is_complete = this.getOverallCompletion() === 100;

      this.evaluationSubmit.emit(updatedEvaluation);

      // Mark as submitted - form will be rebuilt when evaluation is reloaded
      this.hasBeenSubmitted = true;
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.evaluationForm);
    }
  }

  onFinalize() {
    // For finalize, we use the current evaluation data (which includes user answers after submission)
    const finalizedEvaluation: EvaluationResult = {
      ...this.evaluation,
      question_data: { ...this.evaluation.question_data },
    };

    // Mark as complete and finalized
    finalizedEvaluation.is_complete = true;
    finalizedEvaluation.is_finalized = true;

    this.evaluationFinalize.emit(finalizedEvaluation);
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

  isQuestionAnswered(questionId: string): boolean {
    const question: EvaluationQuestion =
      this.evaluation.question_data[questionId];

    // Check if question has a pre-filled answer
    if (
      question.answer?.result !== undefined &&
      question.answer?.result !== null
    ) {
      return true;
    }

    // Check if form has a valid value for this question
    if (this.evaluationForm.contains(questionId)) {
      const control = this.evaluationForm.get(questionId);
      return control
        ? control.value !== null && control.value !== '' && control.valid
        : false;
    }

    return false;
  }

  getAnswerTypeLabel(question: EvaluationQuestion): string {
    if (question.answer?.user_id) {
      return 'Respuesta del usuario:';
    } else {
      return 'Respuesta del sistema:';
    }
  }

  getSectionCompletion(section: EvaluationSection): number {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    section.categories.forEach((category: EvaluationCategory) => {
      category.questions.forEach((questionId: string) => {
        totalQuestions++;
        if (this.isQuestionAnswered(questionId)) {
          answeredQuestions++;
        }
      });
    });

    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }

  getOverallCompletion(): number {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    this.evaluation.methodology.sections.forEach(
      (section: EvaluationSection) => {
        section.categories.forEach((category: EvaluationCategory) => {
          category.questions.forEach((questionId: string) => {
            totalQuestions++;
            if (this.isQuestionAnswered(questionId)) {
              answeredQuestions++;
            }
          });
        });
      }
    );

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

  // Check if there are any unanswered questions that need user input
  hasUnansweredQuestions(): boolean {
    let hasUnanswered = false;

    this.evaluation.methodology.sections.forEach(
      (section: EvaluationSection) => {
        section.categories.forEach((category: EvaluationCategory) => {
          category.questions.forEach((questionId: string) => {
            const question: EvaluationQuestion =
              this.evaluation.question_data[questionId];
            if (
              question.answer?.result === undefined ||
              question.answer?.result === null
            ) {
              hasUnanswered = true;
            }
          });
        });
      }
    );

    return hasUnanswered;
  }

  // TrackBy functions for better performance
  trackBySection(index: number, section: EvaluationSection): string {
    return section.id;
  }

  trackByCategory(index: number, category: EvaluationCategory): string {
    return category.id;
  }

  trackByQuestion(index: number, questionId: string): string {
    return questionId;
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

  // Helper method to check if a question was answered by user
  isUserAnsweredQuestion(question: EvaluationQuestion): boolean {
    return !!question.answer?.user_id;
  }
  // Add these methods to your component class

  // Helper method to handle both string and array recommendations
  getRecommendationList(
    recommendation: string | string[] | undefined
  ): string[] {
    if (!recommendation) return [];

    if (Array.isArray(recommendation)) {
      return recommendation.filter((rec) => rec && rec.trim().length > 0);
    }

    // If it's a string, split by newlines or commas, or return as single item array
    if (typeof recommendation === 'string') {
      // Try splitting by newlines first
      if (recommendation.includes('\n')) {
        return recommendation
          .split('\n')
          .filter((rec) => rec.trim().length > 0);
      }
      // Then try commas
      if (recommendation.includes(',')) {
        return recommendation.split(',').filter((rec) => rec.trim().length > 0);
      }
      // Otherwise return as single item
      return [recommendation.trim()];
    }

    return [];
  }

  // TrackBy function for recommendations
  trackByRecommendation(index: number, item: string): string {
    return `${index}-${item.substring(0, 20)}`; // Use first 20 chars for tracking
  }
}
