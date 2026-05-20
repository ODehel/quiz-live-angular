import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfirmDialogComponent, ContextRow } from "./confirm-dialog";
import { Mock } from "vitest";
import { stubIconIn } from "../../shared/ui/icon/icon.test-helpers";
import { ConfirmOptions } from "./confirm-dialog";
import { By } from "@angular/platform-browser";
import { IconStub } from "../../shared/ui/icon/icon.stub";

describe("Confirm Dialog", () => {
    describe("Title", () => {
        it("renders the title 'Question'", async () => {
            const title = "Question";
            const { fixture } = await createConfirmComponent({ title });
            const text = (fixture.nativeElement as HTMLElement).textContent;
            expect(text).toContain(title);
        });
    });

    describe("Button labels", () => {
        it("renders the 'Valider' button", async () => {
            const { fixture } = await createConfirmComponent({ confirmLabel: "Valider" });

            const validateButton = getButtonByContent(fixture, "Valider");
            expect(validateButton).not.toBeUndefined();
        });

        it("renders the 'Annuler tout' button", async () => {
            const { fixture } = await createConfirmComponent({ cancelLabel: "Annuler tout" });
            const cancelButton = getButtonByContent(fixture, "Annuler tout");
            expect(cancelButton).not.toBeUndefined();
        });
    });

    describe("Optional message", () => {
        it("renders the optional message", async () => {
            const { fixture } = await createConfirmComponent({ message: "Un message optionnel à afficher" });
            const messageField = fixture.nativeElement.querySelector('[data-testid="message"]');
            expect(messageField).not.toBeNull();
        });

        it.each<{ label: string; message: string | undefined }>([
            { label: "empty", message: "" },
            { label: "missing", message: undefined }
        ])("doesn't render the $label message", async ({ message }) => {
            const { fixture } = await createConfirmComponent({ message });
            const messageField = fixture.nativeElement.querySelector('[data-testid="message"]');
            expect(messageField).toBeNull();
        });
    });

    describe("Context rows", () => {
        it("renders the optional context rows", async () => {
            const { fixture } = await createConfirmComponent({
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
                const { fixture } = await createConfirmComponent({ contextRows });
                const contextRowField = fixture.nativeElement.querySelector('[data-testid="context-rows"]');
                expect(contextRowField).toBeNull();
            });

        it("renders two rows when two rows are provided", async () => {
            const { fixture } = await createConfirmComponent({
                contextRows: [
                    { key: "any-key-one", value: "any-value-one" },
                    { key: "any-key-two", value: "any-value-two" }
                ]
            });
            const contextRowFields = fixture.nativeElement.querySelectorAll('[data-testid="context-row"]');
            expect(contextRowFields.length).toBe(2);
        });

        it.each<{ field: string, testValues: string[] }>([
            { field: "key", testValues: ["k1", "k2"] },
            { field: "value", testValues: ["v1", "v2"] }
        ])
            ("renders the context $field in the DOM", async ({ field, testValues }) => {
                const rows: ContextRow[] = testValues.map<ContextRow>(r => ({ key: "any-key", value: "any-value", [field]: r }));
                const { fixture } = await createConfirmComponent({ contextRows: rows });
                const fields: HTMLElement[] = fixture.nativeElement.querySelectorAll(`[data-testid="context-${field}"]`);
                fields.forEach((element, index) => {
                    expect(element.textContent).toBe(testValues[index]);
                });
            });

        it.each<{ tone: ContextRow['tone'] }>([
            { tone: "normal" },
            { tone: "warning" },
            { tone: "danger" }
        ])("renders the $tone for a row", async ({ tone }) => {
            const { fixture } = await createConfirmComponent({
                contextRows: [
                    { key: "any-key", value: "any-value", tone }
                ]
            });
            const contextRowField = fixture.nativeElement.querySelector('[data-testid="context-row"]') as HTMLElement;
            expect(contextRowField.getAttribute("data-tone")).toBe(tone);
        });
    });

    describe("Variant", () => {
        it.each<{ variant: ConfirmOptions['variant'], iconName: string }>
            ([
                { variant: "info", iconName: "circle-play" },
                { variant: "destructive", iconName: "triangle-alert" },
                { variant: "warning", iconName: "circle-alert" }])
            ('renders the $variant icon when variant is $variant', async ({ variant, iconName }) => {
                const { fixture } = await createConfirmComponent({ variant });
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
                const { fixture } = await createConfirmComponent({ variant });
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
                const { fixture } = await createConfirmComponent({ variant });
                const rootElement = fixture.nativeElement as HTMLElement;
                const variantAttribute = rootElement.getAttribute('data-variant');
                expect(variantAttribute).toBe(variant);
            });
    });

    describe("Closing the dialog", () => {
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

        it("calls DialogRef.close(false) when typing on Esc key", async () => {
            const { fakeDialogRef } = await createConfirmComponent({});
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(fakeDialogRef.close).toHaveBeenCalledWith(false);
        });

        it("never calls DialogRef.close when typing on a different key than Esc", async () => {
            const { fakeDialogRef } = await createConfirmComponent({});
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(fakeDialogRef.close).not.toHaveBeenCalled();
        });
    });

    describe("Confirm action workflow", () => {
        it("renders the input field when requireTyping is defined", async () => {
            const { fixture } = await createConfirmComponent({ requireTyping: "ANNULER" });
            const confirmActionInput = fixture.nativeElement.querySelector('[data-testid="confirm-action-input"]');
            expect(confirmActionInput).not.toBeNull();
        });

        it("never renders the input field when requireTyping is not defined", async () => {
            const { fixture } = await createConfirmComponent({});
            const confirmActionInput = fixture.nativeElement.querySelector('[data-testid="confirm-action-input"]');
            expect(confirmActionInput).toBeNull();
        });

        it("disables the confirm button at loading when requireTyping is defined", async () => {
            const { fixture } = await createConfirmComponent({ requireTyping: "ANNULER" });
            const confirmButton = getButtonByTestId(fixture, "confirm");
            expect(confirmButton.disabled).toBe(true);
        });

        it("still disables the confirm button while requireTyping is not completed", async () => {
            const { fixture } = await createConfirmComponent({ requireTyping: "ANNULER" });
            const input = fixture.nativeElement.querySelector('[data-testid="confirm-action-input"]') as HTMLInputElement;
            input.value = "ANNULE";
            input.dispatchEvent(new Event("input"));
            await fixture.whenStable();
            const confirmButton = getButtonByTestId(fixture, "confirm");
            expect(confirmButton.disabled).toBe(true);
        });

        it("enables the confirm button when requireTyping is completed", async () => {
            const { fixture } = await createConfirmComponent({ requireTyping: "ANNULER" });
            const input = fixture.nativeElement.querySelector('[data-testid="confirm-action-input"]') as HTMLInputElement;
            input.value = "ANNULER";
            input.dispatchEvent(new Event("input"));
            await fixture.whenStable();
            const confirmButton = getButtonByTestId(fixture, "confirm");
            expect(confirmButton.disabled).toBe(false);
        });
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