import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export type QuestionType = 'MCQ' | 'SPEED';

export interface Question {
    id: string;
    themeId: string;
    title: string;
    type: QuestionType;
    level: number;
    timeLimit: number;
    points: number;
    imagePath: string | null;
    audioPath: string | null;
}

export interface QuestionList {
    questions: Question[];
    total: number;
}

interface QuestionListResponse {
    data: {
        id: string;
        theme_id: string;
        title: string;
        type: QuestionType;
        level: number;
        time_limit: number;
        points: number;
        image_path: string | null;
        audio_path: string | null;
    }[];
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

    list(): Observable<QuestionList> {
        return this.http
            .get<QuestionListResponse>('/api/v1/questions', { params: { page: 1, limit: 20 } })
            .pipe(map(response => ({
                questions: response.data.map(({ id, theme_id, title, type, level, time_limit, points, image_path, audio_path }) => ({
                    id,
                    themeId: theme_id,
                    title,
                    type,
                    level,
                    timeLimit: time_limit,
                    points,
                    imagePath: image_path,
                    audioPath: audio_path
                })),
                total: response.total
            })));
    }
}
