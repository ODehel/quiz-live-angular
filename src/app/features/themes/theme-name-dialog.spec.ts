import { DialogRef } from "@angular/cdk/dialog";
import { TestBed } from "@angular/core/testing";
import { Mock } from "vitest";
import { stubIconIn } from "../../shared/ui/icon/icon.test-helpers";
import { ThemeNameDialog } from "./theme-name-dialog";

describe("Theme Name Dialog", () => {
    describe("Title", () => {
        it("renders the title 'Nouveau thème'", async () => {
            const { element } = await createThemeNameDialog();

            expect(element.querySelector('[data-testid="title"]')?.textContent?.trim()).toBe("Nouveau thème");
        });
    });

    describe("Name field", () => {
        it("renders the field labelled 'Nom du thème'", async () => {
            const { element } = await createThemeNameDialog();

            const input = element.querySelector<HTMLInputElement>('[data-testid="name-field"]');
            expect(input?.labels?.[0]?.textContent?.trim()).toBe("Nom du thème");
        });

        it("renders a single text input and nothing else to fill in", async () => {
            const { element } = await createThemeNameDialog();

            const fields = Array.from(element.querySelectorAll('input, textarea, select'));
            expect(fields.map(field => field.getAttribute('type'))).toEqual(['text']);
        });
    });

    describe("Closing", () => {
        it.each(["cancel", "close"])("closes the dialog without a result from the '%s' button", async (testId) => {
            const { element, fakeDialogRef } = await createThemeNameDialog();

            element.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)?.click();

            expect(fakeDialogRef.close).toHaveBeenCalledExactlyOnceWith();
        });

        it("labels the cancel button 'Annuler'", async () => {
            const { element } = await createThemeNameDialog();

            expect(element.querySelector('[data-testid="cancel"]')?.textContent?.trim()).toBe("Annuler");
        });

        it("offers no way to submit yet", async () => {
            const { element } = await createThemeNameDialog();

            const labels = Array.from(element.querySelectorAll('button')).map(button => button.textContent?.trim());
            expect(labels).toEqual(["", "Annuler"]);
        });
    });

    async function createThemeNameDialog() {
        const fakeDialogRef: { close: Mock } = { close: vi.fn() };
        await TestBed.configureTestingModule({
            providers: [{ provide: DialogRef, useValue: fakeDialogRef }]
        }).compileComponents();
        stubIconIn(ThemeNameDialog);
        const fixture = TestBed.createComponent(ThemeNameDialog);
        await fixture.whenStable();
        return { fixture, element: fixture.nativeElement as HTMLElement, fakeDialogRef };
    }
});
