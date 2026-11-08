import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Icon } from "../../shared/ui/icon/icon";

export interface NameDialogOptions {
    title: string;
    fieldLabel: string;
}

@Component({
    templateUrl: './name-dialog.html',
    styleUrl: './name-dialog.scss',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NameDialogComponent {
    protected readonly dialogData = inject<NameDialogOptions>(DIALOG_DATA);
    private readonly dialogRef: DialogRef<void> = inject(DialogRef);

    protected cancel(): void { this.dialogRef.close(); }
}
