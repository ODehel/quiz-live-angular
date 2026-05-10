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
        const result = await confirmationService.ask();
        expect(result).toBe(true);
    });
    it('resolves to false when the user cancels', async () => {
        fakeDialog.open.mockReturnValue({ closed: of(false) });
        const result = await confirmationService.ask();
        expect(result).toBe(false);
    });
    it("passes the title to the dialog", async () => {
        const title = "Confirmez-vous la suppression de cette question ?";
        fakeDialog.open.mockReturnValue({ closed: of(true) });
        await confirmationService.ask(title);
        expect(fakeDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, { data: { title } });
    });
    
});