import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfirmDialogComponent, ConfirmDialogData } from "./confirm-dialog";
import { Mock } from "vitest";

describe("Confirm Dialog", () => {
    it("renders the title 'Titre'", async () => {
        const title = "Titre";
        const { fixture } = await createConfirmComponent(title);

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain(title);
    });
    it("renders the title 'Question'", async () => {
        const title = "Question";
        const { fixture } = await createConfirmComponent(title);

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain(title);
    });
    it("renders the 'Valider' button", async () => {
        const { fixture } = await createConfirmComponent("Validation", "Valider");

        const validateButton = getButtonByContent(fixture, "Valider");
        expect(validateButton).not.toBeUndefined();
    });
    it("renders the 'Annuler tout' button", async () => {
        const {fixture} = await createConfirmComponent("Validation", "any-confirm-label", "Annuler tout");

        const cancelButton = getButtonByContent(fixture, "Annuler tout");
        expect(cancelButton).not.toBeUndefined();
    });
    it("calls DialogRef.close(true) when clicking on 'Confirmer' button", async () => {
        const { fixture, fakeDialogRef } = await createConfirmComponent("Confirmez-vous ?", "Confirmer");

        const confirmButton = getButtonByTestId(fixture, "confirm");
        confirmButton?.click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(true);
    });
    it("calls DialogRef.close(false) when clicking on 'Annuler' button", async () => {
        const { fixture, fakeDialogRef } = await createConfirmComponent("Confirmez-vous ?");

        const cancelButton = getButtonByTestId(fixture, "cancel");
        cancelButton?.click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(false);
    });
    async function createConfirmComponent(title: string, confirmLabel: string = "test-confirm-label", cancelLabel: string = "test-cancel-label") {
        let fakeDialogRef: { close: Mock };
        fakeDialogRef = { close: vi.fn() }
        await TestBed.configureTestingModule({
            providers: [
                { provide: DIALOG_DATA, useValue: { title, confirmLabel, cancelLabel } satisfies ConfirmDialogData },
                { provide: DialogRef, useValue: fakeDialogRef }
            ]
        }).compileComponents();
        const fixture = TestBed.createComponent(ConfirmDialogComponent);
        await fixture.whenStable();
        return { fixture, fakeDialogRef };
    }

    function getButtonByContent(fixture: ComponentFixture<ConfirmDialogComponent>, buttonContent: string) {
        const root = fixture.nativeElement as HTMLElement;
        const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
        return buttons.find(b => b.textContent === buttonContent);
    }

    function getButtonByTestId(fixture: ComponentFixture<ConfirmDialogComponent>, buttonTestId: string) {
        return fixture.nativeElement.querySelector('[data-testid="' + buttonTestId + '"]');
    }
});