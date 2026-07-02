import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    initialize(): void {
        this.http.post("/api/v1/token", "").subscribe();
    }       
}