// node-evaluation-viewer.component.ts
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material Imports
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models
import {
  EvaluationMethodology,
  EvaluationResult,
  EvaluationSection,
  EvaluationCategory,
  EvaluationQuestion,
} from '../../api/models/evaluation.model';

@Component({
  selector: 'app-node-evaluation-viewer',
  standalone: true,
  imports: [
    CommonModule,
    // Angular Material Modules
    MatExpansionModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './node-evaluation-viewer.component.html',
  styleUrls: ['./node-evaluation-viewer.component.scss'],
})
export class NodeEvaluationViewerComponent implements OnInit {
  @Input({ required: true }) result!: EvaluationResult;
  @Input() showDetails = true;
  @Input() title = 'Resultados de Evaluación';

  panelOpenState: { [key: string]: boolean } = {};

  ngOnInit() {
    this.initializePanelStates();
  }

  private initializePanelStates() {
    if (this.result.methodology?.sections) {
      // Open first section by default, close others
      this.result.methodology.sections.forEach(
        (section: EvaluationSection, index: number) => {
          this.panelOpenState[section.id] = index === 0;
          section.categories.forEach((category: EvaluationCategory) => {
            this.panelOpenState[category.id] = false;
          });
        }
      );
    }
  }

  getQuestionResultDisplay(question: EvaluationQuestion): string {
    if (
      question.answer?.result === undefined ||
      question.answer?.result === null
    ) {
      return 'No respondido';
    }

    switch (question.type) {
      case 'boolean':
        return question.answer.result ? 'Sí' : 'No';
      case 'select':
        const option = question.selectOptions?.find(
          (opt: any) => opt.value === question.answer?.result
        );
        return option ? option.label : String(question.answer.result);
      default:
        return String(question.answer.result);
    }
  }

  getQuestionResultIcon(question: EvaluationQuestion): string {
    if (
      question.answer?.result === undefined ||
      question.answer?.result === null
    ) {
      return 'help_outline';
    }

    switch (question.type) {
      case 'boolean':
        return question.answer.result ? 'check_circle' : 'cancel';
      case 'number':
        return 'tag';
      case 'select':
        return 'list_alt';
      default:
        return 'question_mark';
    }
  }

  getQuestionResultColor(question: EvaluationQuestion): string {
    if (
      question.answer?.result === undefined ||
      question.answer?.result === null
    ) {
      return 'warn';
    }

    switch (question.type) {
      case 'boolean':
        return question.answer.result ? 'primary' : 'warn';
      default:
        return 'accent';
    }
  }

  getSectionScore(section: EvaluationSection): number {
    const questionIds = section.categories.flatMap(
      (cat: EvaluationCategory) => cat.questions
    );
    const answered = questionIds.filter((qId: string) => {
      const question = this.result.question_data[qId];
      return (
        question.answer?.result !== undefined &&
        question.answer?.result !== null
      );
    });
    return questionIds.length > 0
      ? (answered.length / questionIds.length) * 100
      : 0;
  }

  getOverallScore(): number {
    if (!this.result.methodology?.sections) return 0;

    const allQuestionIds = this.result.methodology.sections.flatMap(
      (section: EvaluationSection) =>
        section.categories.flatMap(
          (category: EvaluationCategory) => category.questions
        )
    );
    const answered = allQuestionIds.filter((qId: string) => {
      const question = this.result.question_data[qId];
      return (
        question.answer?.result !== undefined &&
        question.answer?.result !== null
      );
    });
    return allQuestionIds.length > 0
      ? (answered.length / allQuestionIds.length) * 100
      : 0;
  }

  getTotalCategories(): number {
    return this.result.methodology.sections.reduce(
      (total, section) => total + section.categories.length,
      0
    );
  }

  getTotalQuestions(): number {
    return this.result.methodology.sections.reduce(
      (total, section) =>
        total +
        section.categories.reduce(
          (catTotal, category) => catTotal + category.questions.length,
          0
        ),
      0
    );
  }

  getAnsweredQuestions(): number {
    return this.result.methodology.sections.reduce(
      (total, section) =>
        total +
        section.categories.reduce(
          (catTotal, category) =>
            catTotal +
            category.questions.filter((qId: string) => {
              const question = this.result.question_data[qId];
              return (
                question.answer?.result !== undefined &&
                question.answer?.result !== null
              );
            }).length,
          0
        ),
      0
    );
  }

  // TrackBy functions for performance
  trackBySection(index: number, section: EvaluationSection): string {
    return section.id;
  }

  trackByCategory(index: number, category: EvaluationCategory): string {
    return category.id;
  }

  trackByQuestion(index: number, questionId: string): string {
    return questionId;
  }
}
