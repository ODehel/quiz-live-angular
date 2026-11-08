import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ThemeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('GETs the first page of 100 themes', () => {
    service.list().subscribe();

    const req = httpMock.expectOne('/api/v1/themes?page=1&limit=100');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, limit: 100, total: 0, total_pages: 0 });
  });

  it('gives the themes with their id, name and dates, and the total counted by the hub', () => {
    let result: unknown;
    service.list().subscribe(list => result = list);

    httpMock.expectOne('/api/v1/themes?page=1&limit=100').flush({
      data: [
        { id: 'theme-1', name: 'Géographie', created_at: '2026-10-14T09:00:00.000Z', last_updated_at: null },
        { id: 'theme-2', name: 'Histoire', created_at: '2026-10-15T09:00:00.000Z', last_updated_at: '2026-11-05T10:00:00.000Z' },
      ],
      page: 1,
      limit: 100,
      total: 12,
      total_pages: 1,
    });

    expect(result).toEqual({
      themes: [
        { id: 'theme-1', name: 'Géographie', createdAt: '2026-10-14T09:00:00.000Z', lastUpdatedAt: null },
        { id: 'theme-2', name: 'Histoire', createdAt: '2026-10-15T09:00:00.000Z', lastUpdatedAt: '2026-11-05T10:00:00.000Z' },
      ],
      total: 12,
    });
  });
});
