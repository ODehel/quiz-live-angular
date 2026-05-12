import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { ConfirmationService } from './confirmation.service';
import { Mock } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmationService', () => {
    let fakeDialog: { open: Mock };
    let confirmationService: ConfirmationService;
    beforeEach(() => {
        fakeDialog = {
            open: vi.fn()
        };
        TestBed.configureTestingModule({
            providers: [
                ConfirmationService,
                { provide: Dialog, useValue: fakeDialog }
            ]
        });
        confirmationService = TestBed.inject(ConfirmationService);
    });
    it('resolves to true when the user confirms', async () => {
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        const result = await confirmationService.ask("any-title", "any-confirm-label", "any-cancel-label");
        expect(result).toBe(true);
    });
    it('resolves to false when the user cancels', async () => {
        fakeDialog.open.mockReturnValue({ closed: of(false) });
        const result = await confirmationService.ask("any-title", "any-confirm-label", "any-cancel-label");
        expect(result).toBe(false);
    });
    it("passes the title to the dialog", async () => {
        const title = "Quelle est la réponse à la question ?";
        const confirmLabel = "any-confirm-label";
        const cancelLabel = "any-cancel-label";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask(title, confirmLabel, cancelLabel);
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title, confirmLabel, cancelLabel } });
    });
    it("passes the confirm button label to the dialog", async () => {
        const title = "Confirmez-vous la suppression de cette question ?";
        const confirmLabel = "Confirmer";
        const cancelLabel = "any-cancel-label";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask(title, confirmLabel, cancelLabel);
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title, confirmLabel, cancelLabel } });
    });
    it("passes the cancel button label to the dialog", async () => {
        const title = "Confirmez-vous la décision ?";
        const confirmLabel = "any-confirm-label";
        const cancelLabel = "Annuler tout";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask(title, confirmLabel, cancelLabel);
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title, confirmLabel, cancelLabel } });
    });
});