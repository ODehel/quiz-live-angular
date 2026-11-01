import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { firstValueFrom, timeout } from "rxjs";
import { environment } from "../../../environments/environment";
import { ErrorService } from "../error/error.service";

const TOKEN_REQUEST_TIMEOUT_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly errorService = inject(ErrorService);
    private readonly _token = signal<string | null>(null);

    getToken(): string | null {
        return this._token();
    }

    isReady(): boolean {
        return this._token() !== null;
    }

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
        if (error instanceof HttpErrorResponse && error.status === 401) {
            this.errorService.invalidCredentials();
        } else {
            this.errorService.connectionLost();
        }
    }
}