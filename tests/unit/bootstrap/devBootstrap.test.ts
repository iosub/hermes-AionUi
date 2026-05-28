/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { createElectronViteDevLaunchOptions, hasGraphicalDisplay } from '../../../scripts/dev-bootstrap.mjs';

describe('dev-bootstrap electron-dev', () => {
  it('adds the electron-vite noSandbox flag for root launches', () => {
    const { args } = createElectronViteDevLaunchOptions({ env: {}, uid: 0 });

    expect(args).toEqual([
      'x',
      'electron-vite',
      'dev',
      '--config',
      'packages/desktop/electron.vite.config.ts',
      '--noSandbox',
    ]);
  });

  it('keeps sandboxing enabled for non-root launches', () => {
    const { args } = createElectronViteDevLaunchOptions({ env: {}, uid: 1000 });

    expect(args).toEqual(['x', 'electron-vite', 'dev', '--config', 'packages/desktop/electron.vite.config.ts']);
  });

  it('sets the multi-instance environment flag when requested', () => {
    const { env } = createElectronViteDevLaunchOptions({ env: { EXISTING: '1' }, uid: 1000, multiInstance: true });

    expect(env).toMatchObject({
      EXISTING: '1',
      AIONUI_MULTI_INSTANCE: '1',
    });
  });

  it('treats Linux without DISPLAY or WAYLAND_DISPLAY as headless', () => {
    expect(hasGraphicalDisplay({ platform: 'linux', env: {} })).toBe(false);
  });

  it('accepts Linux sessions with an available display server', () => {
    expect(hasGraphicalDisplay({ platform: 'linux', env: { DISPLAY: ':99' } })).toBe(true);
    expect(hasGraphicalDisplay({ platform: 'linux', env: { WAYLAND_DISPLAY: 'wayland-0' } })).toBe(true);
  });
});