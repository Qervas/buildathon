import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';

export type BvhPlayerSnapshot = {
  currentTime: number;
  duration: number;
  error: string | null;
  isPlaying: boolean;
  ready: boolean;
};

type SnapshotListener = (snapshot: BvhPlayerSnapshot) => void;

export class BvhPlayerController {
  private readonly assetUrl: string;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly container: HTMLElement;
  private readonly controls: OrbitControls;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly resizeObserver: ResizeObserver;
  private readonly scene: THREE.Scene;
  private animationFrame = 0;
  private characterGroup: THREE.Group | null = null;
  private currentTime = 0;
  private duration = 0;
  private error: string | null = null;
  private isDestroyed = false;
  private isPlaying = false;
  private lastFrameAt = 0;
  private listeners = new Set<SnapshotListener>();
  private mixer: THREE.AnimationMixer | null = null;

  constructor(container: HTMLElement, assetUrl: string) {
    this.container = container;
    this.assetUrl = assetUrl;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 2000);
    this.camera.position.set(85, 90, 160);
    this.camera.up.set(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'viewer__canvas';
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 40;
    this.controls.maxDistance = 420;

    const grid = new THREE.GridHelper(320, 20, 0x171717, 0x6f6f6f);
    grid.material.opacity = 0.32;
    grid.material.transparent = true;
    this.scene.add(grid);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.8));

    const keyLight = new THREE.DirectionalLight(0xfff4de, 2.1);
    keyLight.position.set(80, 150, 110);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xb2d5ff, 1.1);
    rimLight.position.set(-90, 70, -60);
    this.scene.add(rimLight);

    this.resizeObserver = new ResizeObserver(() => {
      this.syncSize();
    });
    this.resizeObserver.observe(this.container);
    this.syncSize();

    this.load();
    this.animate();
  }

  subscribe(listener: SnapshotListener) {
    this.listeners.add(listener);
    listener(this.snapshot());

    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.disposeCharacter();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.listeners.clear();
  }

  pause() {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    this.emit();
  }

  play() {
    if (!this.duration || this.error) {
      return;
    }

    this.isPlaying = true;
    this.lastFrameAt = performance.now();
    this.emit();
  }

  seekTo(seconds: number) {
    if (!this.duration || !this.mixer) {
      return;
    }

    this.currentTime = THREE.MathUtils.clamp(seconds, 0, this.duration);
    this.mixer.setTime(this.currentTime);
    this.renderer.render(this.scene, this.camera);
    this.emit();
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
      return;
    }

    this.play();
  }

  private animate = (timestamp = 0) => {
    if (this.isDestroyed) {
      return;
    }

    this.animationFrame = window.requestAnimationFrame(this.animate);

    const delta = this.lastFrameAt ? (timestamp - this.lastFrameAt) / 1000 : 0;
    this.lastFrameAt = timestamp;

    if (this.isPlaying && this.duration && this.mixer) {
      const nextTime = (this.currentTime + delta) % this.duration;
      this.currentTime = nextTime;
      this.mixer.setTime(nextTime);
      this.emit();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private disposeCharacter() {
    if (!this.characterGroup) {
      return;
    }

    this.characterGroup.traverse((object) => {
      const geometry = (object as THREE.Mesh).geometry;
      if (geometry && 'dispose' in geometry) {
        geometry.dispose();
      }

      const material = (object as THREE.Mesh).material;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else if (material && 'dispose' in material) {
        material.dispose();
      }
    });

    this.scene.remove(this.characterGroup);
    this.characterGroup = null;
    this.mixer = null;
  }

  private emit() {
    const next = this.snapshot();
    this.listeners.forEach((listener) => listener(next));
  }

  private frameCharacter(size: THREE.Vector3) {
    const height = Math.max(size.y, 32);
    const depth = Math.max(size.z, 24);
    const distance = Math.max(height * 1.15, depth * 2.1);

    this.controls.target.set(0, height * 0.44, 0);
    this.camera.position.set(distance * 0.42, height * 0.76, distance);
    this.camera.near = 0.1;
    this.camera.far = distance * 8;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  private load() {
    const loader = new BVHLoader();

    loader.load(
      this.assetUrl,
      (result) => {
        if (this.isDestroyed) {
          return;
        }

        this.disposeCharacter();

        const skeletonRoot = result.skeleton.bones[0];
        const skeletonHelper = new THREE.SkeletonHelper(skeletonRoot);
        skeletonHelper.material = new THREE.LineBasicMaterial({
          color: 0x111111,
          transparent: true,
          opacity: 0.95,
        });

        const boneContainer = new THREE.Group();
        boneContainer.add(skeletonRoot);

        this.characterGroup = new THREE.Group();
        this.characterGroup.add(boneContainer);
        this.characterGroup.add(skeletonHelper);
        this.scene.add(this.characterGroup);

        this.mixer = new THREE.AnimationMixer(skeletonRoot);
        this.mixer.clipAction(result.clip).play();

        this.duration = result.clip.duration;
        this.currentTime = 0;
        this.error = null;

        this.mixer.setTime(0);

        const bounds = new THREE.Box3().setFromObject(this.characterGroup);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());

        this.characterGroup.position.set(-center.x, -bounds.min.y, -center.z);
        this.frameCharacter(size);
        this.play();
        this.emit();
      },
      undefined,
      () => {
        this.error = 'Failed to load the bundled BVH asset.';
        this.isPlaying = false;
        this.emit();
      },
    );
  }

  private snapshot(): BvhPlayerSnapshot {
    return {
      currentTime: this.currentTime,
      duration: this.duration,
      error: this.error,
      isPlaying: this.isPlaying,
      ready: Boolean(this.duration) && !this.error,
    };
  }

  private syncSize() {
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.render(this.scene, this.camera);
  }
}
