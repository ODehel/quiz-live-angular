import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { config } from 'rxjs';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { FakeSocket } from './core/websocket/websocket.test-helpers';

/**
 * Démarre l'application câblée par `appConfig` dans le `TestBed` de la spec appelante.
 * `TestBed` rend toujours les mêmes instances : la spec peut aussi les injecter elle-même.
 */
export const startApplication = () => ({
  initStatus: TestBed.inject(ApplicationInitStatus),
  httpMock: TestBed.inject(HttpTestingController),
});

const sendFrom = (socket: FakeSocket, type: string): void =>
  socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify({ type }) }));

/** Démarre, répond à la demande de token du démarrage, attend la fin de l'initialisation, ouvre la socket câblée. */
export const startAndOpenSocket = async (): Promise<FakeSocket> => {
  const { initStatus, httpMock } = startApplication();
  httpMock.expectOne('/api/v1/token')
    .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
  await initStatus.donePromise;
  const [socket] = FakeSocket.instances;
  socket.onopen?.(new Event('open'));
  return socket;
};

const startAndAnnounce = async (announcement: string): Promise<FakeSocket> => {
  const socket = await startAndOpenSocket();
  sendFrom(socket, 'auth_success');
  sendFrom(socket, announcement);
  return socket;
};

/** Socket ouverte et authentifiée, puis le hub annonce `token_expiring_soon`. */
export const startAndAnnounceExpiry = (): Promise<FakeSocket> => startAndAnnounce('token_expiring_soon');

/** Socket ouverte et authentifiée, puis le hub annonce `token_expired`. */
export const startAndAnnounceExpired = (): Promise<FakeSocket> => startAndAnnounce('token_expired');

/**
 * Garde-fou à poser dans un `describe` : toute erreur non gérée d'un observable fait échouer le test
 * (`config.onUnhandledError`). Avec `simulatedTime`, le `describe` tourne sous temps simulé et
 * le temps réel est rendu à la fin.
 */
export const guardAgainstUnhandledErrors = ({ simulatedTime }: { simulatedTime: boolean }): void => {
  let unhandledErrors: unknown[];

  beforeEach(() => {
    unhandledErrors = [];
    config.onUnhandledError = error => unhandledErrors.push(error);
    if (simulatedTime) {
      vi.useFakeTimers();
    }
  });
  afterEach(async () => {
    if (simulatedTime) {
      await vi.advanceTimersByTimeAsync(0);
      vi.useRealTimers();
    }
    await new Promise(resolve => setTimeout(resolve));
    config.onUnhandledError = null;

    expect(unhandledErrors).toEqual([]);
  });
};
