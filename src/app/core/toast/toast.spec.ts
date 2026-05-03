import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import { ToastNotification } from './toast.service';

describe('Toast', () => {
    let fixture: ComponentFixture<Toast>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [Toast] }).compileComponents();
        fixture = TestBed.createComponent(Toast);
    });

    describe('message rendering', () => {
        it('renders the message in the DOM', async () => {
            await renderToast("Le buzzer 01 a moins de 10% de batterie", 'info');

            const text = (fixture.nativeElement as HTMLElement).textContent;
            expect(text).toContain('Le buzzer 01 a moins de 10% de batterie');
        });
    });

    describe('host class by type', () => {
        it('applies toast-success class to a success toast', async () => {
            await renderToast("Le buzzer 01 a réussi à se connecter", 'success');

            const host = fixture.nativeElement as HTMLElement;
            expect(host.classList.contains('toast-success')).toBe(true);
        });

        it('applies toast-error class to an error toast', async () => {
            await renderToast("Impossible de se connecter au buzzer 01", 'error');

            const host = fixture.nativeElement as HTMLElement;
            expect(host.classList.contains('toast-error')).toBe(true);
        });

        it('applies toast-info class to an info toast', async () => {
            await renderToast("Le jeu va pouvoir commencer", 'info');

            const host = fixture.nativeElement as HTMLElement;
            expect(host.classList.contains('toast-info')).toBe(true);
        });
    });

    describe('close button', () => {
        beforeEach(async () => {
            await renderToast("Juste une notification", 'info');
        });
        it('renders the close button in the DOM', () => {
            const host = fixture.nativeElement as HTMLElement;
            expect(host.querySelector('[data-testid="close"]')).not.toBeNull();
        });
        it('emits close when clicked', async () => {
            let emitCount = 0;
            fixture.componentInstance.close.subscribe(() => emitCount++);

            // ACT : on simule un click sur le bouton
            const button = fixture.nativeElement.querySelector('[data-testid="close"]') as HTMLButtonElement;
            button.click();
            await fixture.whenStable();

            // ASSERT
            expect(emitCount).toBe(1);
        });
    });

    async function renderToast(message: string, type: ToastNotification['type']): Promise<void> {
        const notification: ToastNotification = { message, type };
        fixture.componentRef.setInput('notification', notification);
        await fixture.whenStable();
    }
}); 