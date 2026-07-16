import { describe, expect, it } from 'vitest';
import { ApiRequestError } from './api.ts';

describe('ApiRequestError', () => {
  it('exposes status and message', () => {
    const err = new ApiRequestError('Email already registered', 409);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiRequestError');
    expect(err.message).toBe('Email already registered');
    expect(err.status).toBe(409);
  });
});
