import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnhancedNodeViewerComponent } from './enhanced-node-viewer.component';

describe('EnhancedNodeViewerComponent', () => {
  let component: EnhancedNodeViewerComponent;
  let fixture: ComponentFixture<EnhancedNodeViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnhancedNodeViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnhancedNodeViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
