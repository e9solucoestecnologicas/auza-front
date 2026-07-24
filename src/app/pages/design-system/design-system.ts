import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Design System da AUZA — portado do protótipo HTML (base visual: faux.moni).
 * Mantém layout, cores e animações originais. Usa ViewEncapsulation.None com
 * todos os estilos escopados sob `.ds-root` para não vazar para o resto do app.
 * Os assets (runtime do Tailwind, fontes, three.js, Lucide) vivem em /ds-assets
 * e são injetados sob demanda apenas quando esta rota é aberta.
 */
@Component({
  selector: 'app-design-system',
  templateUrl: './design-system.html',
  styleUrl: './design-system.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DesignSystem implements AfterViewInit {
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  /** Controla a navbar fixa do topo: escondida no início, aparece ao rolar. */
  readonly showTopNav = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showTopNav.set(window.scrollY > 140);
  }

  ngAfterViewInit(): void {
    // Fontes (Geist / Geist Mono / Inter)
    this.injectCss('/ds-assets/css2_19fd9cc6b396.css', 'ds-font-1');
    this.injectCss('/ds-assets/css2_62759cd015bd.css', 'ds-font-2');
    this.injectCss('/ds-assets/css2_86e10c4bcbd4.css', 'ds-font-3');

    // Runtime do Tailwind (gera as classes utilitárias em runtime)
    this.injectScript('/ds-assets/tailwind-runtime.js', 'ds-tailwind');

    // three.js -> inicializa o fundo 3D do hero
    this.injectScript('/ds-assets/three.lib.js', 'ds-three').then(() => this.initThree());

    // Lucide -> renderiza os ícones
    this.injectScript('/ds-assets/lucide.lib.js', 'ds-lucide').then(() => {
      const lucide = (window as unknown as { lucide?: { createIcons: () => void } }).lucide;
      lucide?.createIcons();
    });
  }

  scrollToId(id: string): void {
    this.host.nativeElement.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Intercepta cliques em âncoras internas (href="#secao"). Necessário porque o
   * <base href="/"> do Angular resolve fragmentos contra a raiz, o que dispararia
   * a rota coringa e levaria para a landing. Aqui fazemos o scroll sem navegar.
   */
  onAnchorClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
    if (!anchor) {
      return;
    }
    const id = anchor.getAttribute('href')?.slice(1);
    if (!id) {
      return;
    }
    event.preventDefault();
    this.host.nativeElement.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private injectCss(href: string, id: string): void {
    if (document.getElementById(id)) {
      return;
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  private injectScript(src: string, id: string): Promise<void> {
    return new Promise((resolve) => {
      const existing = document.getElementById(id) as (HTMLScriptElement & { dataset: DOMStringMap }) | null;
      if (existing) {
        if (existing.dataset['loaded']) {
          resolve();
        } else {
          existing.addEventListener('load', () => resolve());
        }
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.addEventListener('load', () => {
        script.dataset['loaded'] = '1';
        resolve();
      });
      script.addEventListener('error', () => resolve());
      document.body.appendChild(script);
    });
  }

  /** Fundo 3D do hero — mesmo comportamento do protótipo original. */
  private initThree(): void {
    const THREE = (window as unknown as { THREE?: any }).THREE;
    const container = this.host.nativeElement.querySelector<HTMLElement>('#canvas-container');
    if (!THREE || !container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfff8ea, 0.002);

    let width = container.clientWidth;
    let height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xfff8ea, 1);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(9, 2.5, 120, 16);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x4a1d06,
      emissive: 0x000000,
      metalness: 0.5,
      roughness: 0.1,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const torusKnot = new THREE.Mesh(geometry, material);
    scene.add(torusKnot);

    const sparkCount = 100;
    const sparkGeo = new THREE.CircleGeometry(0.15, 3);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0x4a1d06,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      transparent: true,
      opacity: 1,
      depthTest: false,
    });
    const sparks = new THREE.InstancedMesh(sparkGeo, sparkMat, sparkCount);
    torusKnot.add(sparks);

    const dummy = new THREE.Object3D();
    const sparkData: { speed: number; progress: number; pathIndex: number }[] = [];
    const radialSegments = 16;
    const tubularSegments = 120;

    for (let i = 0; i < sparkCount; i++) {
      sparkData.push({
        speed: 0.001 + Math.random() * 0.002,
        progress: Math.random(),
        pathIndex: Math.floor(Math.random() * radialSegments),
      });
    }

    const posAttribute = geometry.attributes.position;
    const stride = radialSegments + 1;
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();

    const updateSparks = (): void => {
      sparkData.forEach((spark, i) => {
        spark.progress += spark.speed;
        if (spark.progress >= 1) spark.progress = 0;
        const exactInd = spark.progress * tubularSegments;
        const u = Math.floor(exactInd);
        const nextU = (u + 1) % tubularSegments;
        const v = spark.pathIndex;
        const idx1 = (u * stride + v) * 3;
        const idx2 = (nextU * stride + v) * 3;
        v1.fromArray(posAttribute.array, idx1);
        v2.fromArray(posAttribute.array, idx2);
        v1.lerp(v2, exactInd - u);
        dummy.position.copy(v1);
        dummy.lookAt(v2);
        dummy.updateMatrix();
        sparks.setMatrixAt(i, dummy.matrix);
      });
      sparks.instanceMatrix.needsUpdate = true;
    };

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const pLight1 = new THREE.PointLight(0x4a1d06, 1, 50);
    pLight1.position.set(10, 10, 10);
    scene.add(pLight1);

    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - windowHalfX) * 0.0005;
      mouseY = (e.clientY - windowHalfY) * 0.0005;
    });

    const animate = (): void => {
      requestAnimationFrame(animate);
      const targetX = mouseX * 0.5;
      const targetY = mouseY * 0.5;
      torusKnot.rotation.y += 0.05 * (targetX - torusKnot.rotation.y) + 0.002;
      torusKnot.rotation.x += 0.05 * (targetY - torusKnot.rotation.x) + 0.001;
      updateSparks();
      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
  }
}
