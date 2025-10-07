import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeEvaluationViewerComponent } from './node-evaluation-viewer.component';

describe('NodeEvaluationViewerComponent', () => {
  let component: NodeEvaluationViewerComponent;
  let fixture: ComponentFixture<NodeEvaluationViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeEvaluationViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeEvaluationViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
