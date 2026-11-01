import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { firstValueFrom, timeout, TimeoutError } from "rxjs";
import { environment } from "../../../environments/environment";
import { ErrorService } from "../error/error.service";

const TOKEN_REQUEST_TIMEOUT_MS = 10_000;

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
                }).pipe(timeout(TOKEN_REQUEST_TIMEOUT_MS)));
            this._token.set(response.token);
        } catch (error) {
            this.reportFailure(error);
        }
    }

    private reportFailure(error: unknown): void {
        const status = error instanceof HttpErrorResponse ? error.status : null;
        if (error instanceof TimeoutError || status === 0) {
            this.errorService.connectionLost();
        } else if (status === 401) {
            this.errorService.invalidCredentials();
        } else {
            this.errorService.serverError();
        }
    }
}