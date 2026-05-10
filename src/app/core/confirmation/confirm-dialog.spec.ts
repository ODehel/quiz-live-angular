import { DIALOG_DATA } from "@angular/cdk/dialog";
import { TestBed } from "@angular/core/testing";
import { ConfirmDialogComponent } from "./confirm-dialog";

describe("Confirm Dialog", () => {
    it("renders the title 'Titre'", async () => {
        const title = "Titre";
        const fixture = await createConfirmComponent(title);

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain(title);
    });
    it("renders the title 'Question'", async () => {
        const title = "Question";
        const fixture = await createConfirmComponent(title);

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain(title);
    });
    it("renders the 'Confirmer' button", async () => {
        const fixture = await createConfirmComponent("Confirmez-vous ?");

        const root = fixture.nativeElement as HTMLElement;
        const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
        const confirmButton = buttons.find(b => b.textContent === 'Confirmer');

        expect(confirmButton).not.toBeUndefined();
    });
    it("renders the 'Annuler' button", async () => {
        const fixture = await createConfirmComponent("Confirmez-vous ?");

        const root = fixture.nativeElement as HTMLElement;
        const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
        const cancelButton = buttons.find(b => b.textContent === 'Annuler');

        expect(cancelButton).not.toBeUndefined();
    });
    async function createConfirmComponent(title: string) {
        await TestBed.configureTestingModule({
            providers: [
                { provide: DIALOG_DATA, useValue: { title } }
            ]
        }).compileComponents();
        const fixture = TestBed.createComponent(ConfirmDialogComponent);
        await fixture.whenStable();
        return fixture;
    }
});