import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from './AppShell.tsx';

function renderShell(props: Partial<Parameters<typeof AppShell>[0]> = {}) {
  return render(
    <MemoryRouter>
      <AppShell {...props}>
        <p>Contenido</p>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders Hogar nav links under /hogar/* by default', () => {
    renderShell({ activePath: '/hogar/dashboard' });

    expect(screen.getAllByRole('link', { name: /Apuntes/i })[0]).toHaveAttribute(
      'href',
      '/hogar/entries',
    );
    expect(screen.getAllByRole('link', { name: 'TADOR' })[0]).toHaveAttribute(
      'href',
      '/hogar/dashboard',
    );
  });

  it('renders PRO nav links under /pro/* when mode="pro"', () => {
    renderShell({ mode: 'pro', activePath: '/pro/dashboard' });

    expect(screen.getAllByRole('link', { name: /Apuntes/i })[0]).toHaveAttribute(
      'href',
      '/pro/entries',
    );
    expect(screen.getAllByRole('link', { name: 'TADOR' })[0]).toHaveAttribute(
      'href',
      '/pro/dashboard',
    );
  });
});
