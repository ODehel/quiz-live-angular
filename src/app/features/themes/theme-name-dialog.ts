import { DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Icon } from "../../shared/ui/icon/icon";

@Component({
    templateUrl: './theme-name-dialog.html',
    styleUrl: './theme-name-dialog.scss',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeNameDialog {
    private readonly dialogRef: DialogRef<void> = inject(DialogRef);

    protected cancel(): void { this.dialogRef.close(); }
}
