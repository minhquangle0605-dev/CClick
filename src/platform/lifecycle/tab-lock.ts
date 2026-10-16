/** One writer from the first real save. No takeover or multi-device sync. */
export function acquireTabLock(): Promise<() => void> {
  if (!navigator.locks)
    return Promise.reject(
      new Error('Trình duyệt chưa hỗ trợ khóa save. Hãy dùng Chrome hoặc Edge mới.'),
    );
  return new Promise((resolve, reject) => {
    void navigator.locks
      .request('coin-clicker-save-writer', { ifAvailable: true }, async (lock) => {
        if (!lock) {
          reject(new Error('Game đang mở ở tab khác. Hãy đóng tab đó rồi thử lại.'));
          return;
        }
        await new Promise<void>((release) => resolve(release));
      })
      .catch(reject);
  });
}
