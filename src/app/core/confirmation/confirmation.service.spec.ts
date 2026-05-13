import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { ConfirmationService, ConfirmOptions } from './confirmation.service';
import { Mock } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmationService', () => {
    let fakeDialog: { open: Mock };
    let confirmationService: ConfirmationService;
    let confirmOptions: ConfirmOptions;
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
        confirmOptions = {
            title: "any-title",
            confirmLabel: "any-confirm-label",
            cancelLabel: "any-cancel-label"
        }
    });
    it('resolves to true when the user confirms', async () => {
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        const result = await confirmationService.ask(confirmOptions);
        expect(result).toBe(true);
    });
    it('resolves to false when the user cancels', async () => {
        fakeDialog.open.mockReturnValue({ closed: of(false) });
        const result = await confirmationService.ask(confirmOptions);
        expect(result).toBe(false);
    });
    it("passes the title to the dialog", async () => {
        const title = "Quelle est la réponse à la question ?";
        const confirmLabel = "any-confirm-label";
        const cancelLabel = "any-cancel-label";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask({ title, confirmLabel, cancelLabel });
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title, confirmLabel, cancelLabel } });
    });
    it("passes the confirm button label to the dialog", async () => {
        const title = "any-title";
        const confirmLabel = "Confirmer";
        const cancelLabel = "any-cancel-label";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask({ title, confirmLabel, cancelLabel });
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title, confirmLabel, cancelLabel } });
    });
    it("passes the cancel button label to the dialog", async () => {
        const title = "any-title";
        const confirmLabel = "any-confirm-label";
        const cancelLabel = "Annuler tout";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask({ title, confirmLabel, cancelLabel });
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title, confirmLabel, cancelLabel } });
    });
    it("passes the message to the dialog", async () => {
        const title = "any-title";
        const confirmLabel = "any-confirm-label";
        const cancelLabel = "any-cancel-label";
        const message = "Juste un message en passant";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask({ title, confirmLabel, cancelLabel, message });
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title, confirmLabel, cancelLabel, message } });
    });
});