import { PageReloader } from "./page-reloader";

export class BrowserPageReloader implements PageReloader {
    reloadFromRoot(): void {
        window.location.assign('/');
    }
}
