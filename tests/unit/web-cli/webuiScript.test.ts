/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { resolveBackendBinary, startWebHostWithPortFallback } from '../../../scripts/webui.ts';

describe('scripts/webui resolveBackendBinary', () => {
  it('returns the prepared bundled backend after auto-prepare runs', () => {
    const bundledPath = '/repo/resources/bundled-aioncore/linux-x64/aioncore';
    let bundledExists = false;
    const prepare = vi.fn(() => {
      bundledExists = true;
    });

    const resolved = resolveBackendBinary({
      env: {},
      projectRoot: '/repo',
      platform: 'linux',
      arch: 'x64',
      existsSync: (candidate) => String(candidate) === bundledPath && bundledExists,
      execCommand: vi.fn(() => {
        throw new Error('not on PATH');
      }) as unknown as typeof import('child_process').execSync,
      prepare,
    });

    expect(resolved).toBe(bundledPath);
    expect(prepare).toHaveBeenCalledWith('/repo');
  });

  it('throws an actionable error when auto-prepare does not produce a backend binary', () => {
    expect(() =>
      resolveBackendBinary({
        env: {},
        projectRoot: '/repo',
        platform: 'linux',
        arch: 'x64',
        existsSync: () => false,
        execCommand: vi.fn(() => {
          throw new Error('not on PATH');
        }) as unknown as typeof import('child_process').execSync,
        prepare: vi.fn(),
      })
    ).toThrow('Tried system PATH and auto-prepare');
  });
});

describe('scripts/webui startWebHostWithPortFallback', () => {
  it('retries on a free port when the default port is already in use', async () => {
    const start = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('busy'), { code: 'EADDRINUSE' }))
      .mockResolvedValueOnce({
        port: 30001,
        backendPort: 37167,
        url: 'http://127.0.0.1:30001',
        localUrl: 'http://127.0.0.1:30001',
        stop: async () => {},
      });
    const warn = vi.fn();

    const handle = await startWebHostWithPortFallback({
      portExplicit: false,
      options: {
        app: {
          version: '0.0.0',
          isPackaged: false,
          resourcesPath: '/repo',
          userDataPath: '/tmp/data',
        },
        staticDir: '/repo/out/renderer',
        port: 25809,
        allowRemote: false,
        dataDir: '/tmp/data',
        logDir: '/tmp/data/logs',
        dirs: {
          cacheDir: '/tmp/data',
          workDir: '/tmp/data',
          logDir: '/tmp/data/logs',
        },
        backend: {
          kind: 'ownBackend',
          resolveBackend: () => '/repo/resources/bundled-aioncore/linux-x64/aioncore',
        },
      },
      start,
      findPort: async () => 30001,
      warn,
    });

    expect(handle.port).toBe(30001);
    expect(start).toHaveBeenCalledTimes(2);
    expect(start.mock.calls[1][0].port).toBe(30001);
    expect(warn).toHaveBeenCalledWith('[webui] port 25809 is in use; retrying on 30001');
  });

  it('does not retry when the port was explicitly configured', async () => {
    const start = vi.fn().mockRejectedValue(Object.assign(new Error('busy'), { code: 'EADDRINUSE' }));

    await expect(
      startWebHostWithPortFallback({
        portExplicit: true,
        options: {
          app: {
            version: '0.0.0',
            isPackaged: false,
            resourcesPath: '/repo',
            userDataPath: '/tmp/data',
          },
          staticDir: '/repo/out/renderer',
          port: 25809,
          allowRemote: false,
          dataDir: '/tmp/data',
          logDir: '/tmp/data/logs',
          dirs: {
            cacheDir: '/tmp/data',
            workDir: '/tmp/data',
            logDir: '/tmp/data/logs',
          },
          backend: {
            kind: 'ownBackend',
            resolveBackend: () => '/repo/resources/bundled-aioncore/linux-x64/aioncore',
          },
        },
        start,
        findPort: async () => 30001,
      })
    ).rejects.toMatchObject({ code: 'EADDRINUSE' });
  });
});