import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationshipAttributeFilterComponent } from './relationship-attribute-filter.component';

describe('RelationshipAttributeFilterComponent', () => {
  let component: RelationshipAttributeFilterComponent;
  let fixture: ComponentFixture<RelationshipAttributeFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelationshipAttributeFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelationshipAttributeFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
