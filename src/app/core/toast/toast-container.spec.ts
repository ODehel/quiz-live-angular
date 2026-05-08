import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainer } from './toast-container';
import { ToastService } from './toast.service';
import { Icon } from '../../shared/ui/icon/icon';
import { IconStub } from '../../shared/ui/icon/icon.stub';
import { Toast } from './toast';

describe('ToastContainer', () => {
  let fixture: ComponentFixture<ToastContainer>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToastContainer] }).overrideComponent(Toast, {
      remove: { imports: [Icon] },
      add: { imports: [IconStub] }
    }).compileComponents();
    fixture = TestBed.createComponent(ToastContainer);
    toastService = TestBed.inject(ToastService);
  });

  it('renders no toast when notifications is empty', async () => {
    await expectRenderedToastsCount(0);
  });


  it('renders one toast when notifications has 1 element', async () => {
    toastService.add({ type: 'info', message: 'just one notification for test' });
    await expectRenderedToastsCount(1);
  });

  it('renders three toasts when notifications has 3 elements', async () => {
    toastService.add({ type: 'success', message: 'Great win from Olivier !!!' });
    toastService.add({ type: 'error', message: 'Disconnected from server' });
    toastService.add({ type: 'success', message: 'Connected again to the server' });
    await expectRenderedToastsCount(3);
  });

  it('displays a new toast when one is added after rendering', async () => {
    await expectRenderedToastsCount(0);
    toastService.add({ type: 'info', message: 'just one notification for test' });
    await expectRenderedToastsCount(1);
  });

  it('close the notification when clicking on close button', async () => {
    toastService.add({ type: 'success', message: 'Great win from Olivier !!!' });
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('[data-testid="close"]') as HTMLButtonElement;
    button.click();
    await expectRenderedToastsCount(0);
  });

  async function expectRenderedToastsCount(expected: number): Promise<void> {
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('app-toast').length).toBe(expected);
  }
});