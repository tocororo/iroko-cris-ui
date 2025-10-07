import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeEvaluationPageComponent } from './node-evaluation-page.component';

describe('NodeEvaluationPageComponent', () => {
  let component: NodeEvaluationPageComponent;
  let fixture: ComponentFixture<NodeEvaluationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeEvaluationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeEvaluationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
