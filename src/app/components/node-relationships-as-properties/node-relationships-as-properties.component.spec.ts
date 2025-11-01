import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeRelationshipsAsPropertiesComponent } from './node-relationships-as-properties.component';

describe('NodeRelationshipsAsPropertiesComponent', () => {
  let component: NodeRelationshipsAsPropertiesComponent;
  let fixture: ComponentFixture<NodeRelationshipsAsPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeRelationshipsAsPropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeRelationshipsAsPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
