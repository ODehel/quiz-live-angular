import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface Theme {
    id: string;
    name: string;
    createdAt: string;
    lastUpdatedAt: string | null;
}

export interface ThemeList {
    themes: Theme[];
    total: number;
}

interface ThemeListResponse {
    data: { id: string; name: string; created_at: string; last_updated_at: string | null }[];
    total: number;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly http = inject(HttpClient);

    list(): Observable<ThemeList> {
        return this.http
            .get<ThemeListResponse>('/api/v1/themes', { params: { page: 1, limit: 100 } })
            .pipe(map(response => ({
                themes: response.data.map(({ id, name, created_at, last_updated_at }) => ({
                    id,
                    name,
                    createdAt: created_at,
                    lastUpdatedAt: last_updated_at
                })),
                total: response.total
            })));
    }
}
