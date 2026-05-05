import { InjectionToken } from "@angular/core";
import { BrowserTimer } from "./browser-timer";

export interface Timer {
    schedule(callback: () => void, delay: number): void;
}

export const TIMER = new InjectionToken<Timer>('Timer', {
    providedIn: 'root',
    factory: () => new BrowserTimer()
});