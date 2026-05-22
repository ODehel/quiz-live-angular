import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
    selector: 'host-test',
    imports: [Button],
    template: `<app-button (click)="addOccurrence()">Valider la réponse</app-button>`
})
class HostTest {
    emitCount = 0;

    addOccurrence(): void { this.emitCount++; }
}

describe("Button", () => {
    describe('Composition of the app-button', () => {
        let fixture: ComponentFixture<HostTest>;
        beforeEach(async () => {
            await TestBed.configureTestingModule({ imports: [HostTest] }).compileComponents();
            fixture = TestBed.createComponent(HostTest);
            await fixture.whenStable();
        });
        it('displays the text of the button', () => {
            const button = fixture.nativeElement.querySelector('button');
            expect(button?.textContent).contains("Valider la réponse");
        });
        it("throws an event on clicking the button", async () => {
            // simuler un vrai clic DOM → besoin de l'élément HTML
            const buttonElement = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
            buttonElement.click();

            await fixture.whenStable();
            expect(fixture.componentInstance.emitCount).toBe(1);
        });
    });
});
