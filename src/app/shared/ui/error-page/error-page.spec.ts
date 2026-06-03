import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ErrorPage, ErrorVariantConfig } from "./error-page";
import { ErrorContext, ErrorService } from "../../../core/error/error.service";
import { stubIconIn } from "../icon/icon.test-helpers";
import { By } from "@angular/platform-browser";
import { IconStub } from "../icon/icon.stub";
import { Router } from "@angular/router";
import { Mock } from "vitest";
import { VariantConfigurationService } from "./variant-configuration.service";

describe("ErrorPage", () => {
    let fixture: ComponentFixture<ErrorPage>;
    let mockRouter: { navigate: Mock };

    beforeEach(async () => {
        mockRouter = { navigate: vi.fn() };
        await TestBed.configureTestingModule({
            providers: [{ provide: Router, useValue: mockRouter }]
        }).compileComponents();
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
        { variant: 'not-found', call: s => s.notFound(), iconName: "map-pin-off" },
        { variant: 'connection-lost', call: s => s.connectionLost(), iconName: "wifi-off" },
        { variant: 'server-error', call: s => s.serverError(), iconName: "server-crash" },
        { variant: 'game-corrupted', call: s => s.gameCorrupted(), iconName: "octagon-alert" }
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
        expect(titleField.textContent.replace(/\s+/g, ' ').trim()).toContain(title);
    });

    it.each<{ variant: ErrorContext['variant'], call: (s: ErrorService) => void, message: string }>([
        { variant: 'not-found', call: s => s.notFound(), message: "Le lien que vous avez suivi est cassé ou la ressource a été supprimée. Vérifiez l'URL ou retournez à l'accueil pour repartir d'un endroit connu." },
        { variant: 'connection-lost', call: s => s.connectionLost(), message: "L'application n'arrive plus à communiquer avec le serveur Quiz Buzzer. Cela peut être un problème temporaire de réseau ou un redémarrage du hub. Nous tentons une reconnexion automatique." },
        { variant: 'server-error', call: s => s.serverError(), message: "Une erreur inattendue s'est produite côté hub. Ce n'est pas un problème lié à votre action — l'incident a été enregistré dans les logs et peut être consulté pour diagnostic." },
        { variant: 'game-corrupted', call: s => s.gameCorrupted(), message: "L'état de la partie « Soirée découverte du monde » est devenu incohérent et ne peut pas être restauré. Cela peut arriver suite à un crash du hub ou une déconnexion prolongée. Les scores enregistrés jusqu'ici sont conservés en sécurité." }
    ])("renders the message when error is $variant", async ({ variant, call, message }) => {
        const service = TestBed.inject(ErrorService);
        call(service);
        await fixture.whenStable();
        const messageField = fixture.nativeElement.querySelector('[data-testid="message"]');
        expect(messageField.textContent).toContain(message);
    });

    it("renders a label for Home button", async () => {
        const service = TestBed.inject(ErrorService);
        service.notFound();
        await fixture.whenStable();
        const homeButtonField = fixture.nativeElement.querySelector('[data-testid="home-button"]');
        expect(homeButtonField.textContent).not.toBe("");
    });

    it("navigate to Home when clicking on Home button", async () => {
        const service = TestBed.inject(ErrorService);
        service.notFound();
        await fixture.whenStable();
        const homeButtonField: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="home-button"]');
        homeButtonField.click();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    
});

describe("Tag colors", async () => {
    it("renders at least a em tag when a colored title is required", async () => {
        let fixture: ComponentFixture<ErrorPage>;
        let mockRouter: { navigate: Mock } = { navigate: vi.fn() };
        let context: ErrorContext = { variant: "connection-lost" };
        let mockService: { currentError: Mock } = { currentError: vi.fn().mockReturnValue(context) };
        let variantConfig: ErrorVariantConfig = {
            icon: "any-icon",
            eyebrow: "any-eyebrow",
            titleSegments: [
                { content: "Any title " },
                { content: "(for sure)", colored: true },
                { content: "!!!" }
            ],
            message: "any-message"
        };
        let mockConfigurationService: { configFor: Mock } = { configFor: vi.fn().mockReturnValue(variantConfig) };
        await TestBed.configureTestingModule({
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: ErrorService, useValue: mockService },
                { provide: VariantConfigurationService, useValue: mockConfigurationService }
            ]
        }).compileComponents();
        stubIconIn(ErrorPage);
        fixture = TestBed.createComponent(ErrorPage);
        await fixture.whenStable();
        const titleField: HTMLElement = fixture.nativeElement.querySelector('[data-testid="title"]');
        expect(titleField.innerHTML).toContain("<em ");
    });
});