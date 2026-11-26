import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { QuestionList, QuestionService } from './question.service';

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
  describe('list', () => {
    const hubQuestion = {
      id: 'question-1',
      theme_id: 'theme-1',
      title: 'Quelle est la capitale de l\'Australie ?',
      type: 'MCQ',
      correct_answer: 'Canberra',
      choices: ['Sydney', 'Canberra', 'Melbourne', 'Perth'],
      level: 3,
      time_limit: 30,
      points: 200,
      image_path: '/uploads/questions/question-1-image.jpg',
      audio_path: null,
      created_at: '2026-10-14T12:00:00.000Z',
      last_updated_at: null,
    };

    it('GETs the first page of 20 questions', () => {
      service.list().subscribe();

      const req = httpMock.expectOne('/api/v1/questions?page=1&limit=20');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], page: 1, limit: 20, total: 0, total_pages: 0 });
    });

    it('gives each question with the fields the list shows, in the hub order', () => {
      let result: QuestionList | undefined;
      service.list().subscribe(list => result = list);

      httpMock.expectOne('/api/v1/questions?page=1&limit=20').flush({
        data: [
          hubQuestion,
          { ...hubQuestion, id: 'question-2', theme_id: 'theme-2', title: 'Reconnaissez ce morceau', type: 'SPEED', choices: undefined, level: 4, time_limit: 15, points: 300, image_path: null, audio_path: '/uploads/questions/question-2-audio.mp3' },
        ],
        page: 1,
        limit: 20,
        total: 2,
        total_pages: 1,
      });

      expect(result?.questions).toEqual([
        { id: 'question-1', themeId: 'theme-1', title: 'Quelle est la capitale de l\'Australie ?', type: 'MCQ', level: 3, timeLimit: 30, points: 200, imagePath: '/uploads/questions/question-1-image.jpg', audioPath: null },
        { id: 'question-2', themeId: 'theme-2', title: 'Reconnaissez ce morceau', type: 'SPEED', level: 4, timeLimit: 15, points: 300, imagePath: null, audioPath: '/uploads/questions/question-2-audio.mp3' },
      ]);
    });

    it('gives the total counted by the hub, not the number of questions in the page', () => {
      let result: QuestionList | undefined;
      service.list().subscribe(list => result = list);

      httpMock.expectOne('/api/v1/questions?page=1&limit=20').flush({
        data: [hubQuestion],
        page: 1,
        limit: 20,
        total: 147,
        total_pages: 8,
      });

      expect(result?.total).toBe(147);
    });

    it('fails when the hub fails', () => {
      let failed = false;
      service.list().subscribe({ error: () => failed = true });

      httpMock.expectOne('/api/v1/questions?page=1&limit=20').flush('boom', { status: 500, statusText: 'Server Error' });

      expect(failed).toBe(true);
    });
  });
});
