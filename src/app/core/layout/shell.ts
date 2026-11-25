import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopBar } from './top-bar';

@Component({
    selector: 'app-shell',
    templateUrl: './shell.html',
    imports: [RouterOutlet, TopBar],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Shell { }
