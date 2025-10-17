import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeRelationshipsComponent } from './node-relationships.component';

describe('NodeRelationshipsComponent', () => {
  let component: NodeRelationshipsComponent;
  let fixture: ComponentFixture<NodeRelationshipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeRelationshipsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeRelationshipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
