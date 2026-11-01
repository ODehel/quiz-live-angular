import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { ErrorPage } from './shared/ui/error-page/error-page';
import { ErrorService } from './core/error/error.service';
import { stubIconIn } from './shared/ui/icon/icon.test-helpers';

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    stubIconIn(ErrorPage);
  });

  it('renders the error page on /error', async () => {
    TestBed.inject(ErrorService).notFound();

    const harness = await RouterTestingHarness.create('/error');

    const page = (harness.fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="error-screen"]');
    expect(page).not.toBeNull();
  });
});
