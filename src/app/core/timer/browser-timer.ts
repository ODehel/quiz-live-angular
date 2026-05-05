import { Timer } from "./timer";

export class BrowserTimer implements Timer {
    schedule(callback: () => void, delay: number): void {
        setTimeout(callback, delay);
    }
}