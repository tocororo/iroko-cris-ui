import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationshipPaginationComponent } from './relationship-pagination.component';

describe('RelationshipPaginationComponent', () => {
  let component: RelationshipPaginationComponent;
  let fixture: ComponentFixture<RelationshipPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelationshipPaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelationshipPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
