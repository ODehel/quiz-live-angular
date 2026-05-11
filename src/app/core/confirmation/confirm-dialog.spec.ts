import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfirmDialogComponent } from "./confirm-dialog";
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
    it("renders the 'Confirmer' button", async () => {
        const { fixture } = await createConfirmComponent("Confirmez-vous ?");

        const confirmButton = getButton(fixture, "Confirmer");
        expect(confirmButton).not.toBeUndefined();
    });
    it("renders the 'Annuler' button", async () => {
        const { fixture } = await createConfirmComponent("Confirmez-vous ?");

        const cancelButton = getButton(fixture, "Annuler");
        expect(cancelButton).not.toBeUndefined();
    });
    it("calls DialogRef.close(true) when clicking on 'Confirmer' button", async () => {
        const { fixture, fakeDialogRef } = await createConfirmComponent("Confirmez-vous ?");

        const confirmButton = getButton(fixture, "Confirmer");
        confirmButton?.click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(true);

    });
    it("calls DialogRef.close(false) when clicking on 'Annuler' button", async () => {
        const { fixture, fakeDialogRef } = await createConfirmComponent("Confirmez-vous ?");

        const cancelButton = getButton(fixture, "Annuler");
        cancelButton?.click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(false);
    });
    async function createConfirmComponent(title: string) {
        let fakeDialogRef: { close: Mock };
        fakeDialogRef = { close: vi.fn() }
        await TestBed.configureTestingModule({
            providers: [
                { provide: DIALOG_DATA, useValue: { title } },
                { provide: DialogRef, useValue: fakeDialogRef }
            ]
        }).compileComponents();
        const fixture = TestBed.createComponent(ConfirmDialogComponent);
        await fixture.whenStable();
        return { fixture, fakeDialogRef };
    }

    function getButton(fixture: ComponentFixture<ConfirmDialogComponent>, buttonContent: string) {
        const root = fixture.nativeElement as HTMLElement;
        const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
        return buttons.find(b => b.textContent === buttonContent);
    }
});