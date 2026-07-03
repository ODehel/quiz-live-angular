import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly _token = signal<string | null>(null);
    readonly token = this._token.asReadonly();
    
    initialize(): void {
        this.http.post<{ token: string }>("/api/v1/token",
            {
                username: environment.username,
                password: environment.password
            }).subscribe((response) => this._token.set(response.token));
    }
}