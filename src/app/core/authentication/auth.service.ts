import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { ErrorService } from "../error/error.service";

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly errorService = inject(ErrorService);
    private readonly _token = signal<string | null>(null);
    readonly token = this._token.asReadonly();

    async initialize(): Promise<void> {
        try {
            const response = await firstValueFrom(this.http.post<{ token: string }>("/api/v1/token",
                {
                    username: environment.username,
                    password: environment.password
                }));
            this._token.set(response.token);
        } catch {
            this.errorService.invalidCredentials();
        }
    }
}