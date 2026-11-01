import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { ErrorPage } from './shared/ui/error-page/error-page';
import { ErrorService } from './core/error/error.service';
import { stubIconIn } from './shared/ui/icon/icon.test-helpers';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the error page once when an error is shown', async () => {
    stubIconIn(ErrorPage);
    const fixture = TestBed.createComponent(App);
    TestBed.inject(ErrorService).notFound();
    await TestBed.inject(Router).navigateByUrl('/error');
    await fixture.whenStable();

    const screens = (fixture.nativeElement as HTMLElement)
      .querySelectorAll('[data-testid="error-screen"]');
    expect(screens.length).toBe(1);
  });
});
