import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { ConfirmationService } from './confirmation.service';
import { Mock } from 'vitest';
import { ConfirmDialogComponent, ConfirmOptions } from './confirm-dialog';

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
            cancelLabel: "any-cancel-label",
            variant: 'info'
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

    it ("resolves to false when the dialog closes with undefined", async () => {
        fakeDialog.open.mockReturnValue({ closed: of(undefined) });
        const result = await confirmationService.ask(confirmOptions);
        expect(result).toBe(false);
    });

    it.each<{ label: string; override: Partial<ConfirmOptions> }>([
        { label: "passes the title to the dialog", override: { title: 'Quelle est la réponse à la question ?' } },
        { label: "passes the confirm button label to the dialog", override: { confirmLabel: "Confirmer" }},
        { label: "passes the cancel button label to the dialog", override: { cancelLabel: "Annuler tout" }},
        { label: "passes the message to the dialog", override: { message: "Juste un message en passant" }},
        { label: "passes the variant to the dialog", override: { variant: 'destructive' } }
    ])('$label', async ({ override }) => {
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask({ ...confirmOptions, ...override });
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { ...confirmOptions, ...override } });
    });
});