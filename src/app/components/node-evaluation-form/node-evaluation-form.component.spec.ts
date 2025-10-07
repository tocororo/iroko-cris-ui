import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeEvaluationFormComponent } from './node-evaluation-form.component';

describe('NodeEvaluationFormComponent', () => {
  let component: NodeEvaluationFormComponent;
  let fixture: ComponentFixture<NodeEvaluationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeEvaluationFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeEvaluationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
