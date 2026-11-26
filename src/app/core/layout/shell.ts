import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

@Component({
    selector: 'app-shell',
    templateUrl: './shell.html',
    styleUrl: './shell.scss',
    imports: [RouterOutlet, Sidebar, TopBar],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Shell { }
