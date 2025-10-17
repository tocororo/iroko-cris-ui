import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationshipSearchComponent } from './relationship-search.component';

describe('RelationshipSearchComponent', () => {
  let component: RelationshipSearchComponent;
  let fixture: ComponentFixture<RelationshipSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelationshipSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelationshipSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
