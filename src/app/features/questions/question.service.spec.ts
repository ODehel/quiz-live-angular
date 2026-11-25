import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { QuestionService } from './question.service';

describe('QuestionService', () => {
  let service: QuestionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(QuestionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('GETs a single question, without a page, to count them', () => {
    service.count().subscribe();

    const req = httpMock.expectOne('/api/v1/questions?limit=1');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, limit: 1, total: 0, total_pages: 0 });
  });

  it('gives the total counted by the hub, not the number of questions in the page', () => {
    let result: number | undefined;
    service.count().subscribe(total => result = total);

    httpMock.expectOne('/api/v1/questions?limit=1').flush({
      data: [{ id: 'question-1' }],
      page: 1,
      limit: 1,
      total: 147,
      total_pages: 147,
    });

    expect(result).toBe(147);
  });

  it('fails when the hub fails', () => {
    let failed = false;
    service.count().subscribe({ error: () => failed = true });

    httpMock.expectOne('/api/v1/questions?limit=1').flush('boom', { status: 500, statusText: 'Server Error' });

    expect(failed).toBe(true);
  });
});
