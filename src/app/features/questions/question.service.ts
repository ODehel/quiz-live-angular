import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

interface QuestionListResponse {
    total: number;
}

@Injectable({ providedIn: 'root' })
export class QuestionService {
    private readonly http = inject(HttpClient);

    count(): Observable<number> {
        return this.http
            .get<QuestionListResponse>('/api/v1/questions', { params: { limit: 1 } })
            .pipe(map(response => response.total));
    }
}
