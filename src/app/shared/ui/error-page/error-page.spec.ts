import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ErrorPage } from "./error-page";
import { ErrorContext, ErrorService } from "../../../core/error/error.service";

describe("ErrorPage", () => {
    let fixture: ComponentFixture<ErrorPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({}).compileComponents();
        fixture = TestBed.createComponent(ErrorPage);
    });

    it("renders nothing when there is no error", async () => {
        await fixture.whenStable();
        const nativeEl = fixture.nativeElement as HTMLElement;
        expect(nativeEl.querySelector('[data-testid="error-screen"]')).toBeNull();
    });

    it("renders the error screen when there is an error", async () => {
        const errorService = TestBed.inject(ErrorService);
        errorService.notFound();
        await fixture.whenStable();
        const nativeEl = fixture.nativeElement as HTMLElement;
        expect(nativeEl.querySelector('[data-testid="error-screen"]')).not.toBeNull();
    });

    it.each<{ variant: ErrorContext['variant'], call: (s: ErrorService) => void }>([
        { variant: 'not-found', call: s => s.notFound() },
        { variant: 'connection-lost', call: s => s.connectionLost() },
        { variant: 'server-error', call: s => s.serverError() },
        { variant: 'game-corrupted', call: s => s.gameCorrupted() }
    ])("sets data-variant to '$variant' when error is $variant", async ({ variant, call }) => {
        const service = TestBed.inject(ErrorService)
        call(service);
        await fixture.whenStable();
        const page = fixture.nativeElement.querySelector('[data-testid="error-screen"]');
        expect(page?.getAttribute('data-variant')).toBe(variant);
    });

    it("clears the error when user asks to return on homepage", async () => {
        const service = TestBed.inject(ErrorService)
        service.notFound();
        await fixture.whenStable();
        const homeButton: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="home-button"]');
        homeButton.click();
        expect(service.currentError()).toBeNull();
    });
});