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
        const result = await confirmationService.ask("any-title", "any-confirm-label");
        expect(result).toBe(true);
    });
    it('resolves to false when the user cancels', async () => {
        fakeDialog.open.mockReturnValue({ closed: of(false) });
        const result = await confirmationService.ask("any-title", "any-confirm-label");
        expect(result).toBe(false);
    });
    it("passes the title to the dialog", async () => {
        const title = "Quelle est la réponse à la question ?";
        const confirmLabel = "any-confirm-label";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask(title, confirmLabel);
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title, confirmLabel } });
    });
    it("passes the confirm button label to the dialog", async () => {
        const title = "Confirmez-vous la suppression de cette question ?";
        const confirmLabel = "Confirmer";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask(title, confirmLabel);
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title, confirmLabel } });
    });
});