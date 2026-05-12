import { Dialog } from "@angular/cdk/dialog";
import { inject, Injectable } from "@angular/core";
import { ConfirmDialogComponent } from "./confirm-dialog";
import { firstValueFrom } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
    private readonly dialog = inject(Dialog);
    async ask(title: string, confirmLabel: string, cancelLabel: string): Promise<boolean> {
        const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, { data : { title, confirmLabel, cancelLabel }});
        const result = await firstValueFrom(dialogRef.closed);
        return result ?? false;
    }
}