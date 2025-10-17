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
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

// Models
import {
  EvaluationResult,
  EvaluationSection,
  EvaluationCategory,
  EvaluationQuestion,
  StoredEvaluation,
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
    MatButtonModule,
  ],
  templateUrl: './node-evaluation-viewer.component.html',
  styleUrls: ['./node-evaluation-viewer.component.scss'],
})
export class NodeEvaluationViewerComponent implements OnInit {
  private snackBar = inject(MatSnackBar);

  @Input({ required: true }) evaluation!: StoredEvaluation;
  @Input({ required: true }) result!: EvaluationResult;

  @Input({ required: true }) nodeData: any;
  @Input() showDetails = true;
  @Input() title = 'Resultados de Evaluación';

  panelOpenState: { [key: string]: boolean } = {};
  ngOnInit() {
    this.result = this.evaluation.evaluation_data;
    this.initializePanelStates();
  }

  private initializePanelStates() {
    if (this.result.methodology?.sections) {
      // Open ALL sections and categories by default
      this.result.methodology.sections.forEach((section: EvaluationSection) => {
        this.panelOpenState[section.id] = true;
        section.categories.forEach((category: EvaluationCategory) => {
          this.panelOpenState[category.id] = true;
        });
      });
    }
  }

  exportToPdf() {
    try {
      // Create a printable version of the evaluation
      const printContent = this.generatePrintableContent();

      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Evaluación - ${this.result.methodology.name}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  color: #333;
                }
                .header {
                  border-bottom: 2px solid #2196f3;
                  padding-bottom: 15px;
                  margin-bottom: 20px;
                }
                .summary {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 8px;
                  margin-bottom: 20px;
                }
                .section {
                  margin-bottom: 20px;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  padding: 15px;
                }
                .category {
                  margin: 10px 0;
                  padding: 10px;
                  background: #f5f5f5;
                  border-radius: 6px;
                }
                .question {
                  margin: 8px 0;
                  padding: 8px;
                  border-left: 3px solid #4caf50;
                  background: white;
                }
                .score {
                  color: #2196f3;
                  font-weight: bold;
                }
                .recommendation {
                  background: #fff3e0;
                  padding: 8px;
                  border-left: 4px solid #ff9800;
                  margin: 5px 0;
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => window.close(), 1000);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.snackBar.open('Error al generar el PDF', 'Cerrar', {
        duration: 5000,
      });
    }
  }

  private generatePrintableContent(): string {
    return `
    <div class="header">
      <h1>Evaluación</h1>

      <div class=summary>
      <h2>${this.getNodeDisplayName()}</h2>
      <p><strong>Descripción:</strong> ${this.getNodeDescription()}</p>
      ${this.getNodeProperties()
        .map(
          (elem) => `
        <p><strong>${elem.key}:</strong> ${elem.value}</p>`
        )
        .join('')}
    </div>
    <div class=summary>
      <h2>${this.result.methodology.name} v${
      this.result.methodology.version
    }</h2>
      <p><strong>Descripción:</strong> ${
        this.result.methodology.description
      }</p>
      <p>
        <strong>Evaluado por:</strong> ${this.evaluation?.user?.full_name} (${
      this.evaluation?.user?.email
    })
      </p>
      <p><strong>Fecha:</strong> ${new Date(
        this.result?.timestamp ? this.result?.timestamp : ''
      ).toLocaleDateString('medium')}</p>
      <p><strong>Entidad:</strong> ${this.result.methodology.entity}</p>
      <p><strong>Estructura:</strong> ${
        this.result.methodology.sections.length
      } secciones, ${this.getTotalCategories()} categorías, ${this.getAnsweredQuestions()} preguntas</p>
    </div>
  </div>

    ${this.result.methodology.sections
      .map(
        (section) => `
      <div class="section">
        <h3>Sección: ${section.title}</h3>
        <p><strong>Descripción:</strong> ${section.description}</p>
        <p class="score">Puntuación de sección: ${this.getSectionScore(
          section
        ).toFixed(0)}%</p>

        ${
          section.answer?.result
            ? `<p><strong>Resultado:</strong> ${section.answer.result}</p>`
            : ''
        }
        ${
          section.answer?.recommendation
            ? `<div class="recommendation"><strong>Recomendación de Sección:</strong>
                <ul>
                  ${this.getRecommendationList(section.answer.recommendation)
                    .map((rec) => `<li>${rec}</li>`)
                    .join('')}
                </ul>
               </div>`
            : ''
        }

        ${section.categories
          .map(
            (category) => `
          <div class="category">
            <h4>Categoría: ${category.title}</h4>
            <p><strong>Descripción:</strong> ${category.description}</p>

            ${
              category.answer?.result
                ? `<p><strong>Resultado:</strong> ${category.answer.result}</p>`
                : ''
            }
            ${
              category.answer?.recommendation
                ? `<div class="recommendation"><strong>Recomendación de Categoría:</strong>
                    <div class="recommendation-chips">
                      ${this.getRecommendationList(
                        category.answer.recommendation
                      )
                        .map((rec) => `<span class="chip">${rec}</span>`)
                        .join('')}
                    </div>
                   </div>`
                : ''
            }

            ${category.questions
              .map((questionId) => {
                const question = this.result.question_data[questionId];
                return `
                <div class="question">
                  <p><strong>Pregunta:</strong> ${question.desc}</p>
                  <p><strong>Respuesta:</strong> ${this.getQuestionResultDisplay(
                    question
                  )}</p>
                  <p><strong>Tipo:</strong> ${question.type}</p>
                  ${
                    question.answer?.recommendation
                      ? `<div class="recommendation"><strong>Recomendación:</strong>
                          <ul>
                            ${this.getRecommendationList(
                              question.answer.recommendation
                            )
                              .map((rec) => `<li>${rec}</li>`)
                              .join('')}
                          </ul>
                         </div>`
                      : ''
                  }
                </div>
              `;
              })
              .join('')}
          </div>
        `
          )
          .join('')}
      </div>
    `
      )
      .join('')}
  `;
  }

  getNodeDisplayName(): string {
    if (this.nodeData) {
      return (
        this.nodeData.name ||
        this.nodeData.title ||
        this.nodeData.label ||
        this.nodeData.id
      );
    }
    return this.result.node_id;
  }

  getNodeDescription(): string {
    if (this.nodeData?.description) {
      return this.nodeData.description;
    }
    return 'Nodo ' + this.result.node_id;
  }

  getNodeProperties(): { key: string; value: any }[] {
    if (!this.nodeData) return [];

    const excludedKeys = [
      '_',
      'id',
      'labels',
      'elementId',
      'identity',
      'description',
    ];
    return Object.entries(this.nodeData)
      .filter(
        ([key]) => key.includes('identifier')
        // ([key]) => !excludedKeys.some((excluded) => key.startsWith(excluded))
      )
      .map(([key, value]) => ({ key, value }))
      .slice(0, 13);
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
  // Add these methods to your NodeEvaluationViewerComponent

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
