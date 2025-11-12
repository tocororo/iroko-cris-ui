// node-evaluation-viewer.component.ts
import { Component, Input, OnInit, inject, input } from '@angular/core';
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
  Answer,
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

  readonly evaluation = input.required<StoredEvaluation>();
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input({ required: true }) result!: EvaluationResult;

  readonly nodeData = input.required<any>();
  readonly showDetails = input(true);
  readonly title = input('Resultados de Evaluación');

  panelOpenState: { [key: string]: boolean } = {};
  ngOnInit() {
    this.result = this.evaluation().evaluation_data;
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
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 20px;
    color: #333;
    line-height: 1.5;
    font-size: 12pt;
  }
  .header {
    border-bottom: 1px solid #444;
    padding-bottom: 15px;
    margin-bottom: 25px;
  }
  .header h1 {
    margin: 0 0 10px 0;
    color: #222;
  }
  .summary {
    background: #f9f9f9;
    padding: 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    border: 1px solid #eee;
  }
  .summary h2 {
    margin-top: 0;
    color: #2c3e50;
    font-size: 14pt;
  }
  .general-result {
    background: #f0f7ff;
    border-color: #d0e3f0;
  }
  .section {
    margin-bottom: 25px;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 16px;
    background: #fff;
  }
  .section h3 {
    margin-top: 0;
    color: #2c3e50;
    border-bottom: 1px solid #eee;
    padding-bottom: 6px;
  }
  .category {
    margin: 15px 0;
    padding: 12px;
    background: #fafafa;
    border-radius: 5px;
    border: 1px solid #f0f0f0;
  }
  .category h4 {
    margin-top: 0;
    color: #34495e;
  }
  .question {
    margin: 10px 0;
    padding: 10px;
    background: #ffffff;
    border-left: 3px solid #666;
    border: 1px solid #f5f5f5;
  }
  .recommendation {
    background: #fdf6f0;
    padding: 10px;
    border-left: 3px solid #888;
    margin: 10px 0;
    border-radius: 4px;
  }
  .recommendation ul {
    margin: 6px 0 0 20px;
    padding: 0;
  }
  .recommendation li {
    margin-bottom: 4px;
  }
  strong {
    font-weight: 600;
  }
  @media print {
    body {
      margin: 10mm;
      font-size: 11pt;
    }
    .no-print {
      display: none;
    }
    h1, h2, h3, h4 {
      page-break-after: avoid;
    }
    .section {
      page-break-inside: avoid;
    }
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
    const formatDate = (timestamp: string | undefined): string => {
      if (!timestamp) return '—';
      return new Date(timestamp).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    // === Bloque de Resultado y Recomendación General ===
    let generalResultBlock = '';
    if (
      this.result.methodology.answer?.result !== undefined ||
      this.result.methodology.answer?.recommendation
    ) {
      generalResultBlock = `
        <div class="summary general-result">
          <h2>Resultado y Recomendación General</h2>
          ${
            this.result.methodology.answer?.result !== undefined
              ? `<p><strong>Resultado General:</strong> ${this.result.methodology.answer.result}</p>`
              : ''
          }
          ${
            this.result.methodology.answer?.recommendation
              ? `<div class="recommendation general">
                  <strong>Recomendación General:</strong>
                  <ul>
                    ${this.getRecommendationList(
                      this.result.methodology.answer.recommendation
                    )
                      .map((rec) => `<li>${rec}</li>`)
                      .join('')}
                  </ul>
                 </div>`
              : ''
          }
        </div>
      `;
    }

    return `
      <div class="header">
        <h1>Evaluación</h1>

        <div class="summary">
          <h2>${this.getNodeDisplayName()}</h2>
          <p><strong>Descripción:</strong> ${this.getNodeDescription()}</p>
          ${this.getNodeProperties()
            .map((elem) => `<p><strong>${elem.key}:</strong> ${elem.value}</p>`)
            .join('')}
        </div>

        <div class="summary">
          <h2>${this.result.methodology.name} v${
      this.result.methodology.version
    }</h2>
          <p><strong>Descripción:</strong> ${
            this.result.methodology.description
          }</p>
          <p><strong>Evaluado por:</strong> ${
            this.evaluation()?.user?.full_name || '—'
          } (${this.evaluation()?.user?.email || '—'})</p>
          <p><strong>Fecha:</strong> ${formatDate(this.result?.timestamp)}</p>
          <p><strong>Entidad:</strong> ${this.result.methodology.entity}</p>
          <p><strong>Estructura:</strong> ${
            this.result.methodology.sections.length
          } secciones, ${this.getTotalCategories()} categorías, ${this.getAnsweredQuestions()} preguntas</p>
        </div>

        ${generalResultBlock}
      </div>

      ${this.result.methodology.sections
        .map(
          (section) => `
          <div class="section">
            <h3>Sección: ${section.title}</h3>
            <p><strong>Descripción:</strong> ${section.description}</p>
            ${
              section.answer?.result
                ? `<p><strong>Resultado:</strong> ${section.answer.result}</p>`
                : ''
            }
            ${
              section.answer?.recommendation
                ? `<div class="recommendation">
                    <strong>Recomendación de Sección:</strong>
                    <ul>
                      ${this.getRecommendationList(
                        section.answer.recommendation
                      )
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
                      ? `<div class="recommendation">
                          <strong>Recomendación de Categoría:</strong>
                          <ul>
                            ${this.getRecommendationList(
                              category.answer.recommendation
                            )
                              .map((rec) => `<li>${rec}</li>`)
                              .join('')}
                          </ul>
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
                        ${
                          question.answer?.recommendation
                            ? `<div class="recommendation">
                                <strong>Recomendación:</strong>
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
    const nodeData = this.nodeData();
    if (nodeData) {
      return (
        nodeData.name ||
        nodeData.title ||
        nodeData.label ||
        nodeData.iroko_uuid
      );
    }
    return this.result.node_id;
  }

  getNodeDescription(): string {
    const nodeData = this.nodeData();
    if (nodeData?.description) {
      return nodeData.description;
    }
    return 'Nodo ' + this.result.node_id;
  }

  getNodeProperties(): { key: string; value: any }[] {
    const nodeData = this.nodeData();
    if (!nodeData) return [];

    const excludedKeys = [
      '_',
      'id',
      'labels',
      'elementId',
      'identity',
      'description',
    ];
    return Object.entries(nodeData)
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
  showRecommendations(answer: Answer | undefined) {
    if (answer) {
      return (
        answer.recommendation !== undefined &&
        answer.recommendation !== null &&
        answer.recommendation.length > 0
      );
    }
    return false;
  }
}
