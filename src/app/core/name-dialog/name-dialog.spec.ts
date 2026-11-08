import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { TestBed } from "@angular/core/testing";
import { Mock } from "vitest";
import { stubIconIn } from "../../shared/ui/icon/icon.test-helpers";
import { NameDialogComponent, NameDialogOptions } from "./name-dialog";

describe("Name Dialog", () => {
    describe("Title", () => {
        it("renders the title 'Nouveau thème'", async () => {
            const { element } = await createNameDialog({ title: "Nouveau thème" });

            expect(element.querySelector('[data-testid="title"]')?.textContent?.trim()).toBe("Nouveau thème");
        });

        it("renders another title", async () => {
            const { element } = await createNameDialog({ title: "Nouvelle catégorie" });

            expect(element.querySelector('[data-testid="title"]')?.textContent?.trim()).toBe("Nouvelle catégorie");
        });
    });

    describe("Name field", () => {
        it.each(["Nom du thème", "Nom de la catégorie"])("renders the field labelled '%s'", async (fieldLabel) => {
            const { element } = await createNameDialog({ fieldLabel });

            const input = element.querySelector<HTMLInputElement>('[data-testid="name-field"]');
            expect(input?.labels?.[0]?.textContent?.trim()).toBe(fieldLabel);
        });

        it("renders a single text input and nothing else to fill in", async () => {
            const { element } = await createNameDialog({});

            const fields = Array.from(element.querySelectorAll('input, textarea, select'));
            expect(fields.map(field => field.getAttribute('type'))).toEqual(['text']);
        });
    });

    describe("Closing", () => {
        it.each(["cancel", "close"])("closes the dialog without a result from the '%s' button", async (testId) => {
            const { element, fakeDialogRef } = await createNameDialog({});

            element.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)?.click();

            expect(fakeDialogRef.close).toHaveBeenCalledExactlyOnceWith();
        });

        it("labels the cancel button 'Annuler'", async () => {
            const { element } = await createNameDialog({});

            expect(element.querySelector('[data-testid="cancel"]')?.textContent?.trim()).toBe("Annuler");
        });

        it("offers no way to submit yet", async () => {
            const { element } = await createNameDialog({});

            const labels = Array.from(element.querySelectorAll('button')).map(button => button.textContent?.trim());
            expect(labels).toEqual(["", "Annuler"]);
        });
    });

    async function createNameDialog(data: Partial<NameDialogOptions>) {
        const defaults: NameDialogOptions = { title: "any-title", fieldLabel: "any-field-label" };
        const fakeDialogRef: { close: Mock } = { close: vi.fn() };
        await TestBed.configureTestingModule({
            providers: [
                { provide: DIALOG_DATA, useValue: { ...defaults, ...data } },
                { provide: DialogRef, useValue: fakeDialogRef }
            ]
        }).compileComponents();
        stubIconIn(NameDialogComponent);
        const fixture = TestBed.createComponent(NameDialogComponent);
        await fixture.whenStable();
        return { fixture, element: fixture.nativeElement as HTMLElement, fakeDialogRef };
    }
});
