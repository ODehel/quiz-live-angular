import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ErrorPage } from "./error-page";
import { ErrorContext, ErrorService } from "../../../core/error/error.service";
import { stubIconIn } from "../icon/icon.test-helpers";
import { By } from "@angular/platform-browser";
import { IconStub } from "../icon/icon.stub";

describe("ErrorPage", () => {
    let fixture: ComponentFixture<ErrorPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({}).compileComponents();
        stubIconIn(ErrorPage);
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
        const service = TestBed.inject(ErrorService);
        service.notFound();
        await fixture.whenStable();
        const homeButton: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="home-button"]');
        homeButton.click();
        expect(service.currentError()).toBeNull();
    });

    it.each<{ variant: ErrorContext['variant'], call: (s: ErrorService) => void, iconName: string }>([
        { variant: 'not-found', call: s => s.notFound(), iconName: "map-off" },
        { variant: 'connection-lost', call: s => s.connectionLost(), iconName: "wifi-off" },
        { variant: 'server-error', call: s => s.serverError(), iconName: "server-crash" },
        { variant: 'game-corrupted', call: s => s.gameCorrupted(), iconName: "alert-octagon" }
    ])("renders the main icon when error is $variant", async ({ variant, call, iconName }) => {
        const service = TestBed.inject(ErrorService);
        call(service);
        await fixture.whenStable();
        const mainIcon = fixture.debugElement.query(By.css('[data-testid="main-icon"]'));
        const iconInstance: IconStub = mainIcon.componentInstance;
        expect(iconInstance.name()).toBe(iconName);
    });

    it.each<{ variant: ErrorContext['variant'], call: (s: ErrorService) => void, content: string }>([
        { variant: 'not-found', call: s => s.notFound(), content: "Erreur 404" },
        { variant: 'connection-lost', call: s => s.connectionLost(), content: "Connexion perdue" },
        { variant: 'server-error', call: s => s.serverError(), content: "Erreur 500 · Serveur" },
        { variant: 'game-corrupted', call: s => s.gameCorrupted(), content: "Incident critique" }
    ])("renders the eyebrow when error is $variant", async ({ variant, call, content }) => {
        const service = TestBed.inject(ErrorService);
        call(service);
        await fixture.whenStable();
        const eyebrow = fixture.nativeElement.querySelector('[data-testid="eyebrow"]');
        expect(eyebrow.textContent).toContain(content);
    });

    it.each<{ variant: ErrorContext['variant'], call: (s: ErrorService) => void, title: string }>([
        { variant: 'not-found', call: s => s.notFound(), title: "Cette page n'existe pas (encore)" },
        { variant: 'connection-lost', call: s => s.connectionLost(), title: "Le hub ne répond plus" },
        { variant: 'server-error', call: s => s.serverError(), title: "Le serveur a rencontré un problème" },
        { variant: 'game-corrupted', call: s => s.gameCorrupted(), title: "Cette partie est corrompue" }
    ])("renders the title when error is $variant", async ({ variant, call, title }) => {
        const service = TestBed.inject(ErrorService);
        call(service);
        await fixture.whenStable();
        const titleField = fixture.nativeElement.querySelector('[data-testid="title"]');
        expect(titleField.textContent).toContain(title);
    });

    it.each<{ variant: ErrorContext['variant'], call: (s: ErrorService) => void, message: string }>([
        { variant: 'not-found', call: s => s.notFound(), message: "Le lien est cassé ou la ressource a été supprimée." },
        { variant: 'connection-lost', call: s => s.connectionLost(), message: "L'application n'arrive plus à communiquer avec le serveur. Tentative de reconnexion auto en cours." },
        { variant: 'server-error', call: s => s.serverError(), message: "Une erreur inattendue s'est produite côté hub. L'incident a été enregistré dans les logs." },
        { variant: 'game-corrupted', call: s => s.gameCorrupted(), message: "L'état de la partie est devenu incohérent et ne peut pas être restauré. Les scores jusqu'ici sont conservés." }
    ])("renders the message when error is $variant", async ({ variant, call, message }) => {
        const service = TestBed.inject(ErrorService);
        call(service);
        await fixture.whenStable();
        const messageField = fixture.nativeElement.querySelector('[data-testid="message"]');
        expect(messageField.textContent).toContain(message);
    });
});