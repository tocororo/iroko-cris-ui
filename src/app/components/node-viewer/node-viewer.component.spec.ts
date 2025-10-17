import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeViewerComponent } from './node-viewer.component';

describe('EnhancedNodeViewerComponent', () => {
  let component: NodeViewerComponent;
  let fixture: ComponentFixture<NodeViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
