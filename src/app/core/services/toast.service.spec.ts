import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
    let toastService: ToastService;
    beforeEach(() => {
        toastService = new ToastService();
    });
    it('should have 0 notification', () => {
        expect(toastService.notifications().length).toBe(0);
    });
    it('should have only one notification', () => {
        toastService.add({ message: 'text', type: 'info' } as Toast);
        expect(toastService.notifications().length).toBe(1);
    });
    it('should accept to add one toast', () => {
        const added = toastService.add({ message: 'text', type: 'info' } as Toast);
        expect(added).toBe(true);
    });
    it('should have less than 6 toasts at the same time', () => {
        for (let i = 0; i < 6; i++) {
            toastService.add({ message: 'text', type: 'info' } as Toast);
        }
        expect(toastService.notifications().length).toBe(5);
    });
    it('should refuse to add the sixth toast', () => {
        for (let i = 0; i < 5; i++) {
            toastService.add({ message: 'text', type: 'info' } as Toast);
        }
        const added = toastService.add({ message: 'text', type: 'info' } as Toast);
        expect(added).toBe(false);
    });
    it('should remove toast after duration', () => {
        vi.useFakeTimers();

        toastService.add({ message: 'text', type: 'info', duration: 3000 });

        // Avant 3 secondes
        expect(toastService.notifications().length).toBe(1);

        // On avance le temps de 3 secondes
        vi.advanceTimersByTime(3000);

        // Après 3 secondes ?
        expect(toastService.notifications().length).toBe(0);

        vi.useRealTimers();
    });
});