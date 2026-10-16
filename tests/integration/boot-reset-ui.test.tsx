// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BootScreen } from '@app/BootScreen';
import { readResetBackupForRecovery, recoverFromFile } from '@app/recovery';
import { SaveReadError } from '@platform/storage/save-codec';
import resetSave from '../fixtures/saves/v7.json';
import type { SaveEnvelope } from '@core/state/game-state';

vi.mock('@app/recovery', () => ({
  readResetBackupForRecovery: vi.fn(),
  recoverFromFile: vi.fn(),
  readRecoveryFile: vi.fn(),
  exportRecoverableSave: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('requires a separate confirmation before restoring the pre-reset backup on boot failure', async () => {
  const candidate = resetSave as SaveEnvelope;
  vi.mocked(readResetBackupForRecovery).mockResolvedValue(candidate);
  vi.mocked(recoverFromFile).mockResolvedValue(undefined);
  const retry = vi.fn().mockResolvedValue(undefined);
  render(<BootScreen error={new SaveReadError('invalid')} onRetry={retry} />);
  expect(readResetBackupForRecovery).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Xem bản trước reset' }));
  const confirm = await screen.findByRole('button', { name: 'Khôi phục tiến trình này' });
  expect(recoverFromFile).not.toHaveBeenCalled();
  fireEvent.click(confirm);
  await waitFor(() => expect(recoverFromFile).toHaveBeenCalledWith(candidate));
  await waitFor(() => expect(retry).toHaveBeenCalledOnce());
});

it('does not offer reset-backup replacement over a newer save format', () => {
  render(<BootScreen error={new SaveReadError('future-version')} />);
  expect(screen.queryByRole('button', { name: 'Xem bản trước reset' })).toBeNull();
  expect(readResetBackupForRecovery).not.toHaveBeenCalled();
});
