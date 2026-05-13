import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfirmDialogComponent } from "./confirm-dialog";
import { Mock } from "vitest";
import { stubIconIn } from "../../shared/ui/icon/icon.test-helpers";
import { ConfirmOptions } from "./confirm-dialog";
import { By } from "@angular/platform-browser";
import { IconStub } from "../../shared/ui/icon/icon.stub";

describe("Confirm Dialog", () => {
    it("renders the title 'Titre'", async () => {
        const title = "Titre";
        const { fixture } = await createConfirmComponent({ title });

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain(title);
    });

    it("renders the title 'Question'", async () => {
        const title = "Question";
        const { fixture } = await createConfirmComponent({ title });

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain(title);
    });

    it("renders the 'Valider' button", async () => {
        const { fixture } = await createConfirmComponent({ title: "Validation", confirmLabel: "Valider" });

        const validateButton = getButtonByContent(fixture, "Valider");
        expect(validateButton).not.toBeUndefined();
    });

    it("renders the 'Annuler tout' button", async () => {
        const { fixture } = await createConfirmComponent({ title: "Validation", cancelLabel: "Annuler tout" });
        const cancelButton = getButtonByContent(fixture, "Annuler tout");
        expect(cancelButton).not.toBeUndefined();
    });

    it("renders the optional message", async () => {
        const { fixture } = await createConfirmComponent({ title: "Un beau titre", message: "Un message optionnel à afficher" });
        const messageField = fixture.nativeElement.querySelector('[data-testid="message"]');
        expect(messageField).not.toBeNull();
    });

    it("renders the info icon when variant is info", async () => {
        const { fixture } = await createConfirmComponent({ title: "Une information", variant: "info" });
        const variantIcon = fixture.debugElement.query(By.css('[data-testid="variant-icon"]'));
        const iconInstance: IconStub = variantIcon.componentInstance;
        expect(iconInstance.name()).toBe('circle-play');
    });

    it("doesn't render the non-existing message", async () => {
        const { fixture } = await createConfirmComponent({ title: "Un beau titre à afficher" });
        const messageField = fixture.nativeElement.querySelector('[data-testid="message"]');
        expect(messageField).toBeNull();
    });

    it("doesn't render the message when message is empty string", async () => {
        const { fixture } = await createConfirmComponent({ title: "Un beau titre à afficher", message: "" });
        const messageField = fixture.nativeElement.querySelector('[data-testid="message"]');
        expect(messageField).toBeNull();
    });

    it("calls DialogRef.close(true) when clicking on confirm button", async () => {
        const { fixture, fakeDialogRef } = await createConfirmComponent({});

        const confirmButton = getButtonByTestId(fixture, "confirm");
        confirmButton?.click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(true);
    });

    it("calls DialogRef.close(false) when clicking on cancel button", async () => {
        const { fixture, fakeDialogRef } = await createConfirmComponent({});
        const cancelButton = getButtonByTestId(fixture, "cancel");
        cancelButton?.click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(false);
    });

    it("calls DialogRef.close(false) when clicking on close button", async () => {
        const { fixture, fakeDialogRef } = await createConfirmComponent({});
        const closeButton = getButtonByTestId(fixture, "close");
        closeButton?.click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(false);
    });

    async function createConfirmComponent(data: Partial<ConfirmOptions>) {
        const defaults = { title: "any-title", confirmLabel: "any-confirm-label", cancelLabel: "any-cancel-label", variant: "info" };
        const mergedData = { ...defaults, ...data };
        const fakeDialogRef: { close: Mock } = { close: vi.fn() };
        await TestBed.configureTestingModule({
            providers: [
                { provide: DIALOG_DATA, useValue: mergedData },
                { provide: DialogRef, useValue: fakeDialogRef }
            ]
        })
            .compileComponents();
        stubIconIn(ConfirmDialogComponent);
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