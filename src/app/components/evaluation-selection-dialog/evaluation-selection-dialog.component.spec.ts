import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationSelectionDialogComponent } from './evaluation-selection-dialog.component';

describe('EvaluationSelectionDialogComponent', () => {
  let component: EvaluationSelectionDialogComponent;
  let fixture: ComponentFixture<EvaluationSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluationSelectionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluationSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
