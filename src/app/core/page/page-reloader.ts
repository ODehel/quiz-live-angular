import { InjectionToken } from "@angular/core";
import { BrowserPageReloader } from "./browser-page-reloader";

export interface PageReloader {
    reloadFromRoot(): void;
}

export const PAGE_RELOADER = new InjectionToken<PageReloader>('PageReloader', {
    providedIn: 'root',
    factory: () => new BrowserPageReloader()
});
