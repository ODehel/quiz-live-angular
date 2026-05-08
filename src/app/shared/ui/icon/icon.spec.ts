import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Icon } from './icon';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

describe('Icon', () => {
    let fixture: ComponentFixture<Icon>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [Icon], providers: [importProvidersFrom(LucideAngularModule.pick({ X }))] }).compileComponents();
        fixture = TestBed.createComponent(Icon);
    });

    describe('Icon rendering', () => {
        it('renders the icon in the DOM', async () => {
            fixture.componentRef.setInput('name', "x");
            fixture.detectChanges();
            await fixture.whenStable();

            const icon = fixture.nativeElement.querySelector('lucide-icon');
            expect(icon).not.toBeNull();

            const svg = icon!.querySelector('svg');
            expect(svg?.classList.contains('lucide-x')).toBe(true);
        });
    });
}); 