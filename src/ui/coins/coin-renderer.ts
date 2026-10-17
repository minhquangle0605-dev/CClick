import {
  ACESFilmicToneMapping,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCoinModel } from './coin-model';
import type { CoinKind, CoinViewHandle, CoinViewOptions } from './coin-types';

interface View {
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  options: CoinViewOptions;
  visible: boolean;
  size: number;
  dirty: boolean;
}
interface Motion {
  time: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  punch: number;
}

/** One shared WebGL context, one draw per coin kind, copied to visible DOM canvases.
 * No React state updates or gameplay callbacks in this render loop.
 */
function createRenderer() {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const pmrem = new PMREMGenerator(renderer);
  function studio() {
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 128 });
    room.dispose();
    return environment;
  }
  let environment = studio();
  const scene = new Scene();
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.1;
  scene.add(new HemisphereLight(0xddefff, 0x263a61, 1.1));
  const key = new DirectionalLight(0xecf7ff, 2.6);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const fill = new DirectionalLight(0x83b9ff, 1.5);
  fill.position.set(4, -1, 3);
  scene.add(fill);
  const camera = new PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.z = 4.1;
  const views = new Set<View>();
  const models = new Map<CoinKind, ReturnType<typeof createCoinModel>>();
  const motions = new Map<CoinKind, Motion>();
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let previous = 0;
  let bufferSize = 0;
  let lost = false;
  let disposed = false;
  const moving = (view: View) =>
    !view.options.paused && !view.options.reducedMotion && !systemMotion.matches;
  function schedule() {
    if (!frame && !document.hidden && !lost && !disposed) frame = requestAnimationFrame(render);
  }
  function invalidate() {
    for (const view of views) view.dirty = true;
    schedule();
  }
  function modelFor(kind: CoinKind) {
    let model = models.get(kind);
    if (!model) {
      model = createCoinModel(kind, invalidate);
      models.set(kind, model);
      motions.set(kind, { time: 0, x: 0, y: 0, targetX: 0, targetY: 0, punch: 0 });
      scene.add(model.root);
    }
    return model;
  }
  function render(now: number) {
    frame = 0;
    if (disposed || lost || document.hidden) {
      previous = 0;
      return;
    }
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    const visible = [...views].filter((view) => view.visible && view.size > 0);
    const drawable = visible.filter((view) => view.dirty || moving(view));
    if (!drawable.length) {
      previous = 0;
      return;
    }
    // Cap the large coin at 720 px. Small coins share one render at their largest visible size.
    const resolution = (view: View) =>
      Math.max(
        16,
        Math.min(720, Math.ceil(view.size * Math.min(2, Math.max(1.5, devicePixelRatio || 1)))),
      );
    const required = Math.max(...drawable.map(resolution));
    if (required > bufferSize) {
      bufferSize = required;
      renderer.setSize(bufferSize, bufferSize, false);
    }
    renderer.setScissorTest(true);
    try {
      for (const kind of new Set(drawable.map((view) => view.options.kind))) {
        const targets = drawable.filter((view) => view.options.kind === kind);
        const model = modelFor(kind);
        const motion = motions.get(kind)!;
        const active = targets.some(moving);
        const reduced = targets.every((view) => view.options.reducedMotion || systemMotion.matches);
        if (active) {
          motion.time += delta;
          const ease = 1 - Math.exp(-delta * 9);
          motion.x += (motion.targetX - motion.x) * ease;
          motion.y += (motion.targetY - motion.y) * ease;
          motion.punch *= Math.exp(-delta * 10);
        }
        const time = reduced ? 0 : motion.time;
        const punch = reduced ? 0 : motion.punch;
        if (kind === 'silver') {
          model.root.rotation.set(
            -0.13 + Math.sin(time * 0.57) * 0.13 + (reduced ? 0 : motion.y * 0.2),
            0.22 + Math.sin(time * 0.48) * 0.25 + (reduced ? 0 : motion.x * 0.25) + punch * 0.12,
            -0.1 + Math.sin(time * 0.35) * 0.055,
          );
        } else {
          model.root.rotation.set(
            0.12 + Math.sin(time * 0.6) * 0.08,
            0.28 + time * (kind === 'gold' ? 0.46 : 0.56),
            -0.06,
          );
        }
        model.root.position.y = Math.sin(time * 0.9) * 0.025;
        model.root.scale.setScalar(1 - punch * 0.075);
        for (const [id, other] of models) other.root.visible = id === kind;
        const size = Math.max(...targets.map(resolution));
        renderer.setViewport(0, 0, size, size);
        renderer.setScissor(0, 0, size, size);
        renderer.render(scene, camera);
        for (const view of targets) {
          const targetSize = resolution(view);
          if (view.canvas.width !== targetSize || view.canvas.height !== targetSize) {
            view.canvas.width = targetSize;
            view.canvas.height = targetSize;
          }
          view.context.clearRect(0, 0, targetSize, targetSize);
          view.context.drawImage(
            renderer.domElement,
            0,
            bufferSize - size,
            size,
            size,
            0,
            0,
            targetSize,
            targetSize,
          );
          if (view.host.dataset.renderer !== 'webgl') view.host.dataset.renderer = 'webgl';
          view.dirty = false;
        }
      }
    } catch {
      // Presentation failure must not break Coin input or progression.
      lost = true;
      for (const view of views) view.host.dataset.renderer = 'fallback';
    }
    if (!lost && visible.some(moving)) schedule();
    else previous = 0;
  }
  function visibility() {
    previous = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else invalidate();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    for (const view of views) view.host.dataset.renderer = 'fallback';
  }
  function contextRestored() {
    try {
      environment.dispose();
      environment = studio();
      scene.environment = environment.texture;
      lost = false;
      invalidate();
    } catch {
      /* Supplied image stays visible until the next game load. */
    }
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', visibility);
  systemMotion.addEventListener('change', invalidate);
  return {
    attach(host: HTMLElement, canvas: HTMLCanvasElement, options: CoinViewOptions): CoinViewHandle {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      const view: View = { host, canvas, context, options, visible: false, size: 0, dirty: true };
      views.add(view);
      const resize = new ResizeObserver(([entry]) => {
        view.size = Math.min(entry?.contentRect.width ?? 0, entry?.contentRect.height ?? 0);
        view.dirty = true;
        schedule();
      });
      resize.observe(host);
      const intersection = new IntersectionObserver(([entry]) => {
        view.visible = entry?.isIntersecting ?? false;
        view.dirty = true;
        schedule();
      });
      intersection.observe(host);
      const button = options.hero ? host.closest('button') : null;
      const pointer = (event: PointerEvent) => {
        const motion = motions.get(view.options.kind);
        if (!motion || !moving(view)) return;
        const rect = host.getBoundingClientRect();
        motion.targetX = Math.max(
          -1,
          Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
        );
        motion.targetY = Math.max(
          -1,
          Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
        );
      };
      const leave = () => {
        const motion = motions.get(view.options.kind);
        if (motion) {
          motion.targetX = 0;
          motion.targetY = 0;
        }
      };
      const press = () => {
        const motion = motions.get(view.options.kind);
        if (motion && moving(view) && !button?.disabled)
          motion.punch = Math.min(1.2, motion.punch + 0.8);
      };
      const keyboardClick = (event: MouseEvent) => {
        if (event.detail === 0) press();
      };
      button?.addEventListener('pointermove', pointer);
      button?.addEventListener('pointerleave', leave);
      button?.addEventListener('pointerdown', press);
      button?.addEventListener('click', keyboardClick);
      schedule();
      return {
        update(next) {
          view.options = next;
          view.dirty = true;
          schedule();
        },
        dispose() {
          resize.disconnect();
          intersection.disconnect();
          button?.removeEventListener('pointermove', pointer);
          button?.removeEventListener('pointerleave', leave);
          button?.removeEventListener('pointerdown', press);
          button?.removeEventListener('click', keyboardClick);
          views.delete(view);
          host.dataset.renderer = 'fallback';
          if (!views.size) {
            disposed = true;
            cancelAnimationFrame(frame);
            document.removeEventListener('visibilitychange', visibility);
            systemMotion.removeEventListener('change', invalidate);
            renderer.domElement.removeEventListener('webglcontextlost', contextLost);
            renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
            for (const model of models.values()) model.dispose();
            environment.dispose();
            pmrem.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            singleton = null;
          }
        },
      };
    },
  };
}
let singleton: ReturnType<typeof createRenderer> | null = null;
export function attachCoin(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  options: CoinViewOptions,
): CoinViewHandle | null {
  try {
    singleton ??= createRenderer();
    return singleton.attach(host, canvas, options);
  } catch {
    return null;
  }
}
