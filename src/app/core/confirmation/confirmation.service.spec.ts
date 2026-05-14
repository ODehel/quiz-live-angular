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

    it.each<{ label: string; closedValue: boolean | undefined; expected: boolean; }>([
        { label: "resolves to true when the user confirms", closedValue: true, expected: true },
        { label: "resolves to false when the user cancels", closedValue: false, expected: false },
        { label: "resolves to false when the dialog closes with undefined", closedValue: undefined, expected: false }
    ])('$label', async ({ closedValue, expected }) => {
        fakeDialog.open.mockReturnValue({ closed: of(closedValue) });
        const result = await confirmationService.ask(confirmOptions);
        expect(result).toBe(expected);
    });

    it.each<{ label: string; override: Partial<ConfirmOptions> }>([
        { label: "passes the title to the dialog", override: { title: 'Quelle est la réponse à la question ?' } },
        { label: "passes the confirm button label to the dialog", override: { confirmLabel: "Confirmer" } },
        { label: "passes the cancel button label to the dialog", override: { cancelLabel: "Annuler tout" } },
        { label: "passes the message to the dialog", override: { message: "Juste un message en passant" } },
        { label: "passes the variant to the dialog", override: { variant: 'destructive' } }
    ])('$label', async ({ override }) => {
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask({ ...confirmOptions, ...override });
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { ...confirmOptions, ...override } });
    });
});