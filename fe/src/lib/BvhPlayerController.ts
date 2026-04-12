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
  private skeletonBonePairs: Array<[THREE.Bone, THREE.Bone]> = [];
  private skeletonLines: THREE.LineSegments | null = null;

  constructor(container: HTMLElement, assetUrl: string) {
    this.container = container;
    this.assetUrl = assetUrl;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 2000);
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
    // Orbit limits are set dynamically in frameCharacter() once scale is known.
    this.controls.minDistance = 0.01;
    this.controls.maxDistance = 10000;

    // Grid proportioned for a ~1.8-unit normalised character.
    const grid = new THREE.GridHelper(4, 8, 0x171717, 0x6f6f6f);
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

    this.updateSkeletonLines();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private updateSkeletonLines() {
    if (!this.skeletonLines || this.skeletonBonePairs.length === 0) {
      return;
    }

    const attr = this.skeletonLines.geometry.attributes.position as THREE.Float32BufferAttribute;
    const arr = attr.array as Float32Array;
    const _p = new THREE.Vector3();

    for (let i = 0; i < this.skeletonBonePairs.length; i++) {
      const [bone, parent] = this.skeletonBonePairs[i];
      bone.getWorldPosition(_p);
      arr[i * 6 + 0] = _p.x;
      arr[i * 6 + 1] = _p.y;
      arr[i * 6 + 2] = _p.z;
      parent.getWorldPosition(_p);
      arr[i * 6 + 3] = _p.x;
      arr[i * 6 + 4] = _p.y;
      arr[i * 6 + 5] = _p.z;
    }

    attr.needsUpdate = true;
    this.skeletonLines.geometry.computeBoundingSphere();
  }

  private disposeCharacter() {
    if (this.skeletonLines) {
      this.skeletonLines.geometry.dispose();
      (this.skeletonLines.material as THREE.Material).dispose();
      this.scene.remove(this.skeletonLines);
      this.skeletonLines = null;
    }
    this.skeletonBonePairs = [];

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
    // size is already normalised to ~1.8 units by the auto-scale in load().
    const height = size.y > 0 ? size.y : 1;
    const depth  = size.z > 0 ? size.z : size.x > 0 ? size.x : height * 0.5;
    const distance = Math.max(height * 1.3, depth * 2.0);

    this.controls.target.set(0, height * 0.55, 0);
    this.camera.position.set(distance * 0.36, height * 0.85, distance);
    this.camera.near = distance * 0.005;
    this.camera.far  = distance * 20;
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = distance * 0.25;
    this.controls.maxDistance = distance * 10;
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

        const boneContainer = new THREE.Group();
        boneContainer.add(skeletonRoot);

        this.characterGroup = new THREE.Group();
        this.characterGroup.add(boneContainer);
        this.scene.add(this.characterGroup);

        this.mixer = new THREE.AnimationMixer(skeletonRoot);
        this.mixer.clipAction(result.clip).play();

        this.duration = result.clip.duration;
        this.currentTime = 0;
        this.error = null;

        // Sample bounding box across the full animation so that one unusual
        // pose at t=0 (crouching, leaping, etc.) cannot skew the framing.
        // Read bone world positions directly — Box3.setFromObject() skips
        // THREE.Bone nodes (no geometry) and would return an empty box.
        const sampleCount = 10;
        const unionBounds = new THREE.Box3();
        const _bp = new THREE.Vector3();
        for (let i = 0; i <= sampleCount; i++) {
          this.mixer.setTime((i / sampleCount) * this.duration);
          for (const bone of result.skeleton.bones) {
            unionBounds.expandByPoint(bone.getWorldPosition(_bp));
          }
        }
        this.mixer.setTime(0);

        const rawSize   = unionBounds.getSize(new THREE.Vector3());
        const rawCenter = unionBounds.getCenter(new THREE.Vector3());

        // Normalise to ~1.8 units so the camera framing works regardless of
        // whether the BVH uses metres, centimetres, or arbitrary units.
        const TARGET_HEIGHT = 1.8;
        const scale = rawSize.y > 0.001 ? TARGET_HEIGHT / rawSize.y : 1;
        this.characterGroup.scale.setScalar(scale);
        this.characterGroup.position.set(
          -rawCenter.x * scale,
          -unionBounds.min.y * scale,
          -rawCenter.z * scale,
        );
        const scaledSize = rawSize.clone().multiplyScalar(scale);
        this.frameCharacter(scaledSize);

        // Build custom world-space skeleton LineSegments.
        // SkeletonHelper is unreliable when characterGroup has a large scale factor,
        // so we manage bone-pair geometry ourselves and update it every frame.
        this.skeletonBonePairs = [];
        for (const bone of result.skeleton.bones) {
          if (bone.parent instanceof THREE.Bone) {
            this.skeletonBonePairs.push([bone, bone.parent as THREE.Bone]);
          }
        }
        const linePositions = new Float32Array(this.skeletonBonePairs.length * 6);
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.skeletonLines = new THREE.LineSegments(
          lineGeo,
          new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.95 }),
        );
        this.skeletonLines.frustumCulled = false;
        this.scene.add(this.skeletonLines);

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
