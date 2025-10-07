import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeEvaluationsComponent } from './node-evaluations.component';

describe('NodeEvaluationsComponent', () => {
  let component: NodeEvaluationsComponent;
  let fixture: ComponentFixture<NodeEvaluationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeEvaluationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeEvaluationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
