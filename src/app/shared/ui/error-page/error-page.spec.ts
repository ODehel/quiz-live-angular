import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ErrorPage } from "./error-page";
import { ErrorService } from "../../../core/error/error.service";

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
});