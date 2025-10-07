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
import { EvaluationMethodology } from '../../api/models/evaluation.model';

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
  @Input({ required: true }) evaluation!: EvaluationMethodology;
  @Input() showDetails = true;
  @Input() title = 'Resultados de Evaluación';

  panelOpenState: { [key: string]: boolean } = {};

  ngOnInit() {
    this.initializePanelStates();
  }

  private initializePanelStates() {
    if (this.evaluation?.sections) {
      // Open first section by default, close others
      this.evaluation.sections.forEach((section, index) => {
        this.panelOpenState[section.id] = index === 0;
        section.categories.forEach((category) => {
          this.panelOpenState[category.id] = false;
        });
      });
    }
  }

  getQuestionResultDisplay(question: any): string {
    if (question.result === undefined || question.result === null) {
      return 'No respondido';
    }

    switch (question.type) {
      case 'boolean':
        return question.result ? 'Sí' : 'No';
      case 'select':
        const option = question.selectOptions?.find(
          (opt: any) => opt.value === question.result
        );
        return option ? option.label : String(question.result);
      default:
        return String(question.result);
    }
  }

  getQuestionResultIcon(question: any): string {
    if (question.result === undefined || question.result === null) {
      return 'help_outline';
    }

    switch (question.type) {
      case 'boolean':
        return question.result ? 'check_circle' : 'cancel';
      case 'number':
        return 'tag';
      case 'select':
        return 'list_alt';
      default:
        return 'question_mark';
    }
  }

  getQuestionResultColor(question: any): string {
    if (question.result === undefined || question.result === null) {
      return 'warn';
    }

    switch (question.type) {
      case 'boolean':
        return question.result ? 'primary' : 'warn';
      default:
        return 'accent';
    }
  }

  getSectionScore(section: any): number {
    const questions = section.categories.flatMap((cat: any) => cat.questions);
    const answered = questions.filter(
      (q: any) => q.result !== undefined && q.result !== null
    );
    return questions.length > 0
      ? (answered.length / questions.length) * 100
      : 0;
  }

  getOverallScore(): number {
    if (!this.evaluation?.sections) return 0;

    const allQuestions = this.evaluation.sections.flatMap((section) =>
      section.categories.flatMap((category) => category.questions)
    );
    const answered = allQuestions.filter(
      (q) => q.result !== undefined && q.result !== null
    );
    return allQuestions.length > 0
      ? (answered.length / allQuestions.length) * 100
      : 0;
  }

  getTotalCategories(): number {
    return this.evaluation.sections.reduce(
      (total, section) => total + section.categories.length,
      0
    );
  }

  getTotalQuestions(): number {
    return this.evaluation.sections.reduce(
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
    return this.evaluation.sections.reduce(
      (total, section) =>
        total +
        section.categories.reduce(
          (catTotal, category) =>
            catTotal +
            category.questions.filter(
              (q) => q.result !== undefined && q.result !== null
            ).length,
          0
        ),
      0
    );
  }

  // TrackBy functions for performance
  trackBySection(index: number, section: any): string {
    return section.id;
  }

  trackByCategory(index: number, category: any): string {
    return category.id;
  }

  trackByQuestion(index: number, question: any): string {
    return question.id;
  }
}
