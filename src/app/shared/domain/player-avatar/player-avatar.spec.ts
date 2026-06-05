import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PlayerAvatar } from './player-avatar';

describe("PlayerAvatar", () => {
    let fixture: ComponentFixture<PlayerAvatar>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({}).compileComponents();
        fixture = TestBed.createComponent(PlayerAvatar);
        fixture.componentRef.setInput("buzzerNumber", 1);
    });

    it("exists as a component", async () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it("renders the first letter of the player in the avatar", async () => {
        fixture.componentRef.setInput("playerName", "Armelle");
        fixture.detectChanges();
        await fixture.whenStable();

        const firstLetterField: HTMLElement = fixture.nativeElement.querySelector('[data-testid="first-letter"]');
        expect(firstLetterField.textContent).toBe("A");
    });

    it("renders an empty string in the avatar when the player name is empty", async () => {
        fixture.componentRef.setInput("playerName", "");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.firstLetter()).toBe("");
    });

    it("applies the number of the buzzer as defined as input", async () => {
        const buzzerNumber = 8;
        fixture.componentRef.setInput("playerName", "Armelle");
        fixture.componentRef.setInput("buzzerNumber", buzzerNumber);
        fixture.detectChanges();
        await fixture.whenStable();

        const nativeElement: HTMLElement = fixture.nativeElement;
        expect(nativeElement.getAttribute("data-buzzer")).toBe(buzzerNumber.toString());
    });
});