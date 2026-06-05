import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

@Component({
    selector: 'app-player-avatar',
    templateUrl: 'player-avatar.html',
    host: { '[attr.data-buzzer]': 'buzzerNumber()' },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerAvatar {
    readonly playerName = input.required<string>();
    readonly buzzerNumber = input.required<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>();
    readonly firstLetter = computed(() => this.playerName()[0] ?? "");
}