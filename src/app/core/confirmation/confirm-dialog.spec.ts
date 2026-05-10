import { DIALOG_DATA } from "@angular/cdk/dialog";
import { TestBed } from "@angular/core/testing";
import { ConfirmDialogComponent } from "./confirm-dialog";

describe("Confirm Dialog", () => {
    it("renders the title 'Titre'", async () => {
        const title = "Titre";
        await TestBed.configureTestingModule({
            providers: [
                { provide: DIALOG_DATA, useValue: { title } }
            ]
        }).compileComponents();
        let fixture = TestBed.createComponent(ConfirmDialogComponent);
        await fixture.whenStable();

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain(title);
    });
    it("renders the title 'Question'", async () => {
        const title = "Question";
        await TestBed.configureTestingModule({
            providers: [
                { provide: DIALOG_DATA, useValue: { title } }
            ]
        }).compileComponents();
        let fixture = TestBed.createComponent(ConfirmDialogComponent);
        await fixture.whenStable();

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain(title);
    });
});