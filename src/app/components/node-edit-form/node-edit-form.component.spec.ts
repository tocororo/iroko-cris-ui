// src/app/components/node-edit-form/node-edit-form.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodeEditFormComponent } from './node-edit-form.component';

describe('NodeEditFormComponent', () => {
  let component: NodeEditFormComponent;
  let fixture: ComponentFixture<NodeEditFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeEditFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeEditFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
