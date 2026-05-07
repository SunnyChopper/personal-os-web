/**
 * Typed errors for assistant WebSocket handshake failures.
 * Browsers hide HTTP upgrade status on `WebSocket.onerror`; distinct `name` values
 * let the UI map to SESSION_EXPIRED / WS_BACKEND_REJECTED / WS_NETWORK_FAILURE.
 */

export const WS_NO_TOKEN_ERROR_NAME = 'WsNoTokenError';
export const WS_HANDSHAKE_REFUSED_ERROR_NAME = 'WsHandshakeRefusedError';
export const WS_HANDSHAKE_CLOSED_ERROR_NAME = 'WsHandshakeClosedError';

export class WsNoTokenError extends Error {
  override readonly name = WS_NO_TOKEN_ERROR_NAME;

  constructor(message = 'No access token available for WebSocket authentication') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WsHandshakeRefusedError extends Error {
  override readonly name = WS_HANDSHAKE_REFUSED_ERROR_NAME;

  constructor(message = 'WebSocket handshake refused (browser error event)') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WsHandshakeClosedError extends Error {
  override readonly name = WS_HANDSHAKE_CLOSED_ERROR_NAME;

  readonly closeCode: number;

  readonly closeReason: string;

  readonly wasClean: boolean;

  constructor(
    message: string,
    closeCode: number,
    closeReason: string,
    wasClean: boolean
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.closeCode = closeCode;
    this.closeReason = closeReason;
    this.wasClean = wasClean;
  }
}

export function isWsNoTokenError(err: unknown): err is WsNoTokenError {
  return err instanceof Error && err.name === WS_NO_TOKEN_ERROR_NAME;
}

export function isWsHandshakeRefusedError(err: unknown): err is WsHandshakeRefusedError {
  return err instanceof Error && err.name === WS_HANDSHAKE_REFUSED_ERROR_NAME;
}

export function isWsHandshakeClosedError(err: unknown): err is WsHandshakeClosedError {
  return err instanceof Error && err.name === WS_HANDSHAKE_CLOSED_ERROR_NAME;
}

const ASSISTANT_WS_PREFLIGHT_ERROR_NAME = 'AssistantWsPreflightError';

export type AssistantWsPreflightCode = 'SESSION_EXPIRED' | 'WS_NETWORK_FAILURE';

export class AssistantWsPreflightError extends Error {
  override readonly name = ASSISTANT_WS_PREFLIGHT_ERROR_NAME;

  readonly preflightCode: AssistantWsPreflightCode;

  readonly preflightDetails?: Record<string, unknown>;

  constructor(
    preflightCode: AssistantWsPreflightCode,
    message: string,
    preflightDetails?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.preflightCode = preflightCode;
    this.preflightDetails = preflightDetails;
  }
}

export function isAssistantWsPreflightError(err: unknown): err is AssistantWsPreflightError {
  return err instanceof Error && err.name === ASSISTANT_WS_PREFLIGHT_ERROR_NAME;
}
