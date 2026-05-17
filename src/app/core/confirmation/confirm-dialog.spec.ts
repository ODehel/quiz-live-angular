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

    it("renders the optional context rows", async () => {
        const { fixture } = await createConfirmComponent({
            title: "Titre",
            contextRows: [
                { key: "KeyA", value: "Value A" }
            ]
        });
        const contextRowsField = fixture.nativeElement.querySelector('[data-testid="context-rows"]');
        expect(contextRowsField).not.toBeNull();
    });

    it.each<{ label: string; contextRows: ConfirmOptions['contextRows'] }>([
        { label: "missing", contextRows: undefined },
        { label: "empty", contextRows: [] }
    ])
        ("doesn't render the context rows when data is $label", async ({ contextRows }) => {
            const { fixture } = await createConfirmComponent({ title: "Titre", contextRows });
            const contextRowField = fixture.nativeElement.querySelector('[data-testid="context-rows"]');
            expect(contextRowField).toBeNull();
        });

    it("renders a context row when one row is provided", async () => {
        const { fixture } = await createConfirmComponent({
            title: "any-title",
            contextRows: [
                { key: "any-key", value: "any-value" }
            ]
        });
        const contextRowField = fixture.nativeElement.querySelector('[data-testid="context-row"]');
        expect(contextRowField).not.toBeNull();
    });

    it("renders two rows when two rows are provided", async () => {
        const { fixture } = await createConfirmComponent({
            title: "any-title",
            contextRows: [
                { key: "any-key-one", value: "any-value-one" },
                { key: "any-key-two", value: "any-value-two" }
            ]
        });
        const contextRowFields = fixture.nativeElement.querySelectorAll('[data-testid="context-row"]');
        expect(contextRowFields.length).toBe(2);
    });

    it.each<{ variant: ConfirmOptions['variant'], iconName: string }>
        ([
            { variant: "info", iconName: "circle-play" },
            { variant: "destructive", iconName: "triangle-alert" },
            { variant: "warning", iconName: "circle-alert" }])
        ('renders the $variant icon when variant is $variant', async ({ variant, iconName }) => {
            const { fixture } = await createConfirmComponent({ title: "Titre", variant });
            const variantIcon = fixture.debugElement.query(By.css('[data-testid="variant-icon"]'));
            const iconInstance: IconStub = variantIcon.componentInstance;
            expect(iconInstance.name()).toBe(iconName);
        });

    it.each<{ variant: ConfirmOptions['variant'], iconName: string }>([
        { variant: "info", iconName: "play" },
        { variant: "destructive", iconName: "trash-2" },
        { variant: "warning", iconName: "log-out" }
    ])
        ("renders the $iconName icon in the confirm button when variant is $variant", async ({ iconName, variant }) => {
            const { fixture } = await createConfirmComponent({ title: "Titre", variant });
            const iconConfirmButton = fixture.debugElement.query(By.css('[data-testid="confirm-icon"]'));
            const iconInstance: IconStub = iconConfirmButton.componentInstance;
            expect(iconInstance.name()).toBe(iconName);
        });

    it.each<{ variant: ConfirmOptions['variant'] }>([
        { variant: "info" },
        { variant: "destructive" },
        { variant: "warning" }
    ])
        ("sets the $variant variant to the root element", async ({ variant }) => {
            const { fixture } = await createConfirmComponent({ title: "Titre", variant });
            const rootElement = fixture.nativeElement as HTMLElement;
            const variantAttribute = rootElement.getAttribute('data-variant');
            expect(variantAttribute).toBe(variant);
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
        getButtonByTestId(fixture, "confirm").click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(true);
    });

    it("calls DialogRef.close(false) when clicking on cancel button", async () => {
        const { fixture, fakeDialogRef } = await createConfirmComponent({});
        getButtonByTestId(fixture, "cancel").click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(false);
    });

    it("calls DialogRef.close(false) when clicking on close button", async () => {
        const { fixture, fakeDialogRef } = await createConfirmComponent({});
        getButtonByTestId(fixture, "close").click();
        expect(fakeDialogRef.close).toHaveBeenCalledWith(false);
    });

    async function createConfirmComponent(data: Partial<ConfirmOptions>) {
        const defaults: ConfirmOptions = { title: "any-title", confirmLabel: "any-confirm-label", cancelLabel: "any-cancel-label", variant: "info" };
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
        const root = fixture.nativeElement as HTMLElement;
        const button = root.querySelector<HTMLButtonElement>(`[data-testid="${buttonTestId}"]`);
        if (button === null) {
            throw new Error(`Button not found: ${buttonTestId}`);
        }
        return button;
    }
});