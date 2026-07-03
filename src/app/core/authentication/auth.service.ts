import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environment } from "../../../environments/environment";
import { ErrorService } from "../error/error.service";

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly errorService = inject(ErrorService);
    private readonly _token = signal<string | null>(null);
    readonly token = this._token.asReadonly();

    initialize(): void {
        this.http.post<{ token: string }>("/api/v1/token",
            {
                username: environment.username,
                password: environment.password
            }).subscribe({
                next: (response) => this._token.set(response.token),
                error: () => this.errorService.invalidCredentials()
            });
    }
}