import { TestBed } from '@angular/core/testing';

import { CypherBuilderService } from './cypher-builder.service';

describe('CypherBuilderService', () => {
  let service: CypherBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CypherBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
