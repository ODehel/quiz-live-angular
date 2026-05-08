import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import { ToastNotification } from './toast.service';
import { By } from '@angular/platform-browser';
import { Icon } from '../../shared/ui/icon/icon';
import { IconStub } from '../../shared/ui/icon/icon.stub'

describe('Toast', () => {
    let fixture: ComponentFixture<Toast>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Toast]
        })
            .overrideComponent(Toast, {
                remove: { imports: [Icon] },
                add: { imports: [IconStub] }
            })
            .compileComponents();
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
        it('renders an icon in the close button', () => {
            const iconDebugEl = fixture.debugElement.query(By.directive(IconStub));
            const iconInstance: IconStub = iconDebugEl.componentInstance;
            expect(iconInstance.name()).toBe('x');
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

    describe("Progress bar management", () => {
        it("doesn't show a progress bar if the toast has no duration", async () => {
            await renderToast("Toast with no progress bar", "info");
            expect(getProgressBar()).toBeNull();
        });
        it("shows a progress bar when the toast has a duration", async () => {
            await renderToast("Toast with progress bar", "info", 80);
            expect(getProgressBar()).not.toBeNull();
        });
        it("applies the duration as CSS animation-duration", async () => {
            await renderToast("Toast with progress bar", "info", 80);
            expect(getProgressBar()?.style.animationDuration).toBe("80ms");
        });
        function getProgressBar(): HTMLDivElement | null {
            const host = fixture.nativeElement as HTMLElement;
            return host.querySelector('[data-testid="progressBar"]');
        }
    });
    async function renderToast(message: string, type: ToastNotification['type'], duration?: number): Promise<void> {
        const notification: ToastNotification = { message, type, duration };
        fixture.componentRef.setInput('notification', notification);
        await fixture.whenStable();
    }
}); 