import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@ui/styles/fonts.css';
import { bootstrapGame } from '@app/bootstrap';
import { BootScreen } from '@app/BootScreen';
import '@ui/styles/tokens.css';
import '@ui/styles/global.css';

const App = lazy(() => import('@app/App').then((module) => ({ default: module.App })));

const element = document.getElementById('root');
if (!element) throw new Error('Không tìm thấy điểm khởi động ứng dụng.');
const root = createRoot(element);
let session: Awaited<ReturnType<typeof bootstrapGame>> | undefined;
let disposed = false;
async function start() {
  root.render(<BootScreen />);
  try {
    const next = await bootstrapGame();
    if (disposed) {
      next.dispose();
      return;
    }
    session = next;
    root.render(
      <StrictMode>
        <Suspense fallback={<BootScreen />}>
          <App session={session} />
        </Suspense>
      </StrictMode>,
    );
  } catch (error) {
    if (!disposed) root.render(<BootScreen error={error} onRetry={start} />);
  }
}
void start();
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    disposed = true;
    root.unmount();
    session?.dispose();
  });
