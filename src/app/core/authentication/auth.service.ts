import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    initialize(): void {
        this.http.post("/api/v1/token",
            {
                username: environment.username,
                password: environment.password
            }).subscribe();
    }
}