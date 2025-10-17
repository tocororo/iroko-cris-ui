import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationshipGroupComponent } from './relationship-group.component';

describe('RelationshipGroupComponent', () => {
  let component: RelationshipGroupComponent;
  let fixture: ComponentFixture<RelationshipGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelationshipGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelationshipGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
