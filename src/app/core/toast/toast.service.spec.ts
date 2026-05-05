import { TestBed } from '@angular/core/testing';
import { TIMER, Timer } from '../timer/timer';
import { ToastService, ToastNotification } from './toast.service';
import { Mocked } from 'vitest';

describe('ToastService', () => {
    let toastService: ToastService;
    let fakeTimer: Mocked<Timer>;
    beforeEach(() => {
        fakeTimer = { schedule: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                ToastService,
                { provide: TIMER, useValue: fakeTimer }
            ]
        });
        toastService = TestBed.inject(ToastService);
    });
    it('starts with no notification', () => {
        expect(toastService.notifications().length).toBe(0);
    });
    it('adds a notification when add is called', () => {
        toastService.add({ message: 'text', type: 'info' });
        expect(toastService.notifications().length).toBe(1);
    });
    it('returns true when adding a notification is a success', () => {
        const added = toastService.add({ message: 'text', type: 'info' });
        expect(added).toBe(true);
    });
    it('caps the list at 5 notifications when more are added', () => {
        for (let i = 0; i < 6; i++) {
            toastService.add({ message: 'text', type: 'info' });
        }
        expect(toastService.notifications().length).toBe(5);
    });
    it('returns false when the capacity is reached', () => {
        for (let i = 0; i < 5; i++) {
            toastService.add({ message: 'text', type: 'info' });
        }
        const added = toastService.add({ message: 'text', type: 'info' });
        expect(added).toBe(false);
    });
    describe("removing a notification", () => {
        it('does nothing when removing a notification from an empty list', () => {
            toastService.remove({ message: 'unuseful alert', type: 'warning', duration: 300 });

            expect(toastService.notifications().length).toBe(0);
        });
        describe("With three notifications", () => {
            const notificationA: ToastNotification = { message: 'Notification A', type: 'success' };
            const notificationB: ToastNotification = { message: 'Notification B', type: 'warning' };
            const notificationC: ToastNotification = { message: 'Notification C', type: 'info' };
            beforeEach(() => {
                toastService.add(notificationA);
                toastService.add(notificationB);
                toastService.add(notificationC);
            });
            it('removes only the targeted notification', () => {
                toastService.remove(notificationB);
                expect(toastService.notifications()).toEqual([notificationA, notificationC]);
            });
            it('does nothing when the notification is not in the list', () => {
                toastService.remove({ message: 'Fake', type: 'error' });
                expect(toastService.notifications()).toEqual([notificationA, notificationB, notificationC]);
            });
        });
    });
    describe('automatic removing after parameterized duration', () => {
        it('removes the notification when the scheduled callback fires', () => {
            fakeTimer.schedule.mockImplementation(callback => callback());
            toastService.add({ message: 'text', type: 'info', duration: 3000 });
            expect(toastService.notifications().length).toBe(0);
        });
        it('schedules the notification removal when a duration is provided', () => {
            toastService.add({ message: 'text', type: "info", duration: 30 });
            expect(fakeTimer.schedule).toHaveBeenCalledWith(expect.any(Function), 30);
        });
    })
});