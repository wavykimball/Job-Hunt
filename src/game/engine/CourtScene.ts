import * as THREE from 'three';
import { Company, CharacterAppearance } from '@/types/game';
import { SEEDED_COMPANIES } from '@/services/seedData';
import { CharacterMesh } from './CharacterMesh';
import { ShotEvaluation, ShotEvaluator } from './ShotEvaluator';
import { TrajectoryCalculator } from './TrajectoryCalculator';

export type ThrownObjectType = 'CV' | 'DELIVERABLE';

export class CourtScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public character: CharacterMesh;

  private container: HTMLElement;
  private animFrameId = 0;
  private clock = new THREE.Clock();

  // Hoops
  private hoopMeshes: Map<string, THREE.Group> = new Map();
  private selectedCompanyId: string = SEEDED_COMPANIES[0].id;
  private hoopTargetRing: THREE.Mesh;
  private hoopsVisible = true;
  private visibleCompanyIds?: string[] = undefined;

  // Home Screen Title & Suitcase
  private titleBillboard: THREE.Group;
  private suitcaseMesh: THREE.Group;

  // Projectile
  private projectile: THREE.Group;
  private projectileType: ThrownObjectType = 'CV';
  private isThrowing = false;
  private throwElapsed = 0;
  private currentFlightTime = 1.0;
  private throwStartPos = new THREE.Vector3(0.5, 1.6, 0.4);
  private throwVelocity = new THREE.Vector3();
  private onImpactCallback: ((result: ShotEvaluation) => void) | null = null;

  // Trajectory preview
  private trajectoryPointsMesh: THREE.Group;
  private static readonly MAX_TRAJECTORY_POINTS = 30;

  // Particle systems
  private swishParticles: THREE.Points;
  private swishParticleVelocities: THREE.Vector3[] = [];
  private swishActive = false;
  private swishTimer = 0;

  constructor(container: HTMLElement, initialAppearance?: CharacterAppearance) {
    this.container = container;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfff3d6); // Warm golden sunset sky
    this.scene.fog = new THREE.FogExp2(0xffeed0, 0.022);

    // 2. Camera & Dimension setup
    const width = (container.clientWidth > 0) ? container.clientWidth : (window.innerWidth || 1280);
    const height = (container.clientHeight > 0) ? container.clientHeight : (window.innerHeight || 800);
    const aspect = height > 0 ? width / height : 1.77;
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    this.updateCameraForViewport();

    // 3. Renderer setup with fallback
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      // Fallback without antialiasing if MSAA is unsupported
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      });
    }
    this.renderer = renderer;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    try {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch {
      this.renderer.shadowMap.enabled = false;
    }

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.zIndex = '0';

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Environment & Court
    this.setupEnvironment();

    // 6. Character
    this.character = new CharacterMesh(initialAppearance);
    this.character.group.position.set(0, 0, 0.5);
    this.character.group.rotation.y = Math.PI; // Face forward towards company hoops
    this.scene.add(this.character.group);

    // 7. Hoops
    this.setupHoops();

    // 8. Projectile (CV / Deliverable)
    this.projectile = new THREE.Group();
    this.scene.add(this.projectile);
    this.createProjectileMesh('CV');
    this.throwStartPos.set(0.48, 1.35, 0.5);
    this.resetProjectileToHand();

    // 9. Aiming Trajectory Preview (Robust Group)
    this.trajectoryPointsMesh = this.setupTrajectoryPreview();
    this.scene.add(this.trajectoryPointsMesh);

    // 10. Selected hoop indicator
    const ringGeo = new THREE.RingGeometry(0.55, 0.72, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffc629,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.hoopTargetRing = new THREE.Mesh(ringGeo, ringMat);
    this.scene.add(this.hoopTargetRing);
    this.updateTargetRing();

    // 11. Celebration Particles
    this.swishParticles = this.setupParticles();
    this.scene.add(this.swishParticles);

    // 12. Large "JOB HUNT" Title Billboard (shown when hoops are hidden)
    this.titleBillboard = this.createTitleBillboard();
    this.scene.add(this.titleBillboard);
    this.titleBillboard.visible = false;

    // 13. Suitcase Mesh (shown on floor beside character when employed)
    this.suitcaseMesh = this.createSuitcaseMesh();
    this.scene.add(this.suitcaseMesh);

    // Start loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private updateCameraForViewport() {
    const isMobile = (this.container?.clientWidth || window.innerWidth) < 640;
    if (isMobile) {
      // Pull back slightly higher to frame vertical field of view on mobile
      this.camera.position.set(0, 2.9, 5.2);
      this.camera.lookAt(0, 1.8, -4.5);
    } else {
      // Desktop: Wide court view showing character and all 4 company hoops
      this.camera.position.set(0, 2.6, 4.8);
      this.camera.lookAt(0, 1.7, -4.5);
    }
  }

  private setupLighting() {
    // Ambient warmth
    const hemiLight = new THREE.HemisphereLight(0xfff5db, 0x193a46, 0.85);
    this.scene.add(hemiLight);

    // Main golden sun
    const dirLight = new THREE.DirectionalLight(0xffe899, 1.2);
    dirLight.position.set(8, 14, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -5;
    this.scene.add(dirLight);

    // Soft rim fill light
    const fillLight = new THREE.PointLight(0x08bfe8, 0.6, 20);
    fillLight.position.set(-6, 4, -4);
    this.scene.add(fillLight);
  }

  private setupEnvironment() {
    // 1. Basketball Court Floor
    const courtGeo = new THREE.PlaneGeometry(24, 30);
    const courtMat = new THREE.MeshStandardMaterial({
      color: 0xdb8e4d, // warm arcade hardwood
      roughness: 0.35,
    });
    const court = new THREE.Mesh(courtGeo, courtMat);
    court.rotation.x = -Math.PI / 2;
    court.position.set(0, 0, -8);
    court.receiveShadow = true;
    this.scene.add(court);

    // 2. Court Painted Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });

    // Center arc / free throw ring
    const freeThrowCircle = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.72, 32), lineMat);
    freeThrowCircle.rotation.x = -Math.PI / 2;
    freeThrowCircle.position.set(0, 0.01, 0.3);
    this.scene.add(freeThrowCircle);

    // 3-point painted key border
    const keyGeo = new THREE.PlaneGeometry(3.6, 6.0);
    const keyMat = new THREE.MeshBasicMaterial({ color: 0x08bfe8, transparent: true, opacity: 0.25 });
    const keyMesh = new THREE.Mesh(keyGeo, keyMat);
    keyMesh.rotation.x = -Math.PI / 2;
    keyMesh.position.set(0, 0.005, -5.5);
    this.scene.add(keyMesh);

    // 3. Stadium Arena Wall in background running plain from left to right
    const wallGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x193a46, roughness: 0.85 });
    const wallGeo = new THREE.BoxGeometry(42, 12, 1.5);
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 6, -20);
    wallGroup.add(wallMesh);

    // Top golden accent runner
    const goldTrimGeo = new THREE.BoxGeometry(42, 0.35, 1.6);
    const goldTrimMat = new THREE.MeshBasicMaterial({ color: 0xffe85a });
    const goldTrim = new THREE.Mesh(goldTrimGeo, goldTrimMat);
    goldTrim.position.set(0, 12, -20);
    wallGroup.add(goldTrim);

    // Cyan court boundary trim
    const cyanTrimGeo = new THREE.BoxGeometry(42, 0.4, 1.6);
    const cyanTrimMat = new THREE.MeshBasicMaterial({ color: 0x08bfe8 });
    const cyanTrim = new THREE.Mesh(cyanTrimGeo, cyanTrimMat);
    cyanTrim.position.set(0, 0.5, -20);
    wallGroup.add(cyanTrim);

    this.scene.add(wallGroup);
  }

  private setupHoops() {
    SEEDED_COMPANIES.forEach((comp) => {
      const hoopGroup = new THREE.Group();
      hoopGroup.position.set(...comp.hoop_position);

      // Support post
      const postGeo = new THREE.CylinderGeometry(0.12, 0.14, comp.hoop_position[1], 16);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x102f3a, metalness: 0.6, roughness: 0.3 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(0, -comp.hoop_position[1] / 2, -0.6);
      post.castShadow = true;
      hoopGroup.add(post);

      // Backboard
      const bbGeo = new THREE.BoxGeometry(2.0, 1.4, 0.08);
      const bbMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        transparent: true,
        opacity: 0.88,
      });
      const backboard = new THREE.Mesh(bbGeo, bbMat);
      backboard.position.set(0, 0.4, -0.55);
      backboard.castShadow = true;
      hoopGroup.add(backboard);

      // Backboard inner target square
      const targetEdgeGeo = new THREE.RingGeometry(0.4, 0.44, 4);
      targetEdgeGeo.rotateZ(Math.PI / 4);
      const targetEdgeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(comp.accent_color) });
      const targetSquare = new THREE.Mesh(targetEdgeGeo, targetEdgeMat);
      targetSquare.position.set(0, 0.35, -0.5);
      hoopGroup.add(targetSquare);

      // Rim
      const rimRadius = 0.55;
      const rimGeo = new THREE.TorusGeometry(rimRadius, 0.05, 12, 32);
      rimGeo.rotateX(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(comp.accent_color),
        roughness: 0.2,
        emissive: new THREE.Color(comp.accent_color),
        emissiveIntensity: 0.45,
      });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(0, 0, 0);
      hoopGroup.add(rim);

      // Net (Bright white, double-sided, clearly visible)
      const netGeo = new THREE.CylinderGeometry(rimRadius, 0.32, 0.8, 16, 6, true);
      const netMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        side: THREE.DoubleSide,
      });
      const net = new THREE.Mesh(netGeo, netMat);
      net.position.set(0, -0.4, 0);
      hoopGroup.add(net);

      // Billboard header above backboard
      const billboard = this.createCompanyBillboard(comp);
      billboard.position.set(0, 1.45, -0.55);
      hoopGroup.add(billboard);

      this.scene.add(hoopGroup);
      this.hoopMeshes.set(comp.id, hoopGroup);
    });
  }

  public getHoopMesh(companyId: string): THREE.Group | undefined {
    return this.hoopMeshes.get(companyId);
  }

  public checkHoopClick(screenX: number, screenY: number): string | null {
    if (!this.hoopsVisible || !this.container || !this.camera) return null;
    const rect = this.container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    for (const [compId, hoopGroup] of this.hoopMeshes.entries()) {
      if (this.visibleCompanyIds && !this.visibleCompanyIds.includes(compId)) continue;
      const intersects = raycaster.intersectObjects(hoopGroup.children, true);
      if (intersects.length > 0) {
        return compId;
      }
    }
    return null;
  }

  public setHoopsVisible(visible: boolean) {
    this.hoopsVisible = visible;
    this.updateHoopsVisibility();
    if (this.hoopTargetRing) {
      this.hoopTargetRing.visible = visible;
    }
    if (this.titleBillboard) {
      this.titleBillboard.visible = false;
    }
  }

  public setVisibleCompanyIds(ids?: string[]) {
    this.visibleCompanyIds = ids;
    this.updateHoopsVisibility();
  }

  private updateHoopsVisibility() {
    this.hoopMeshes.forEach((mesh, compId) => {
      const isVisible = this.hoopsVisible && (!this.visibleCompanyIds || this.visibleCompanyIds.includes(compId));
      mesh.visible = isVisible;
    });
  }

  public setSuitcaseVisible(visible: boolean) {
    if (this.suitcaseMesh) {
      this.suitcaseMesh.visible = visible;
    }
  }

  public getProjectileType(): ThrownObjectType {
    return this.projectileType;
  }

  private createTitleBillboard(): THREE.Group {
    const group = new THREE.Group();
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 3D Shadow
      for (let s = 12; s >= 1; s--) {
        ctx.fillStyle = '#102F3A';
        ctx.font = '900 120px Nunito, "Arial Black", sans-serif';
        ctx.fillText('JOB HUNT', 512, 160 + s);
      }

      // Outer stroke
      ctx.strokeStyle = '#102F3A';
      ctx.lineWidth = 18;
      ctx.lineJoin = 'round';
      ctx.strokeText('JOB HUNT', 512, 160);

      // Gold-orange gradient
      const grad = ctx.createLinearGradient(0, 80, 0, 240);
      grad.addColorStop(0, '#FFF59D');
      grad.addColorStop(0.5, '#FFC629');
      grad.addColorStop(1, '#FF7A00');
      ctx.fillStyle = grad;
      ctx.fillText('JOB HUNT', 512, 160);

      // Subtitle
      ctx.font = '800 32px Nunito, sans-serif';
      ctx.fillStyle = '#0A1D24';
      ctx.fillText('★ 3D BASKETBALL CAREER ARCADE ★', 512, 267);
      ctx.fillStyle = '#FFE85A';
      ctx.fillText('★ 3D BASKETBALL CAREER ARCADE ★', 512, 265);

      const texture = new THREE.CanvasTexture(canvas);
      const geo = new THREE.PlaneGeometry(8, 2.8);
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
    }
    group.position.set(0, 3.2, -6);
    return group;
  }

  private createSuitcaseMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.35, 0.26, 0.16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.13;
    body.castShadow = true;
    group.add(body);

    // Leather straps / corners
    const strapGeo = new THREE.BoxGeometry(0.36, 0.27, 0.04);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x5a2d0c, roughness: 0.6 });
    const strapL = new THREE.Mesh(strapGeo, strapMat);
    strapL.position.set(-0.09, 0.13, 0);
    const strapR = new THREE.Mesh(strapGeo, strapMat);
    strapR.position.set(0.09, 0.13, 0);
    group.add(strapL, strapR);

    // Golden buckles
    const buckleGeo = new THREE.BoxGeometry(0.04, 0.05, 0.17);
    const buckleMat = new THREE.MeshStandardMaterial({ color: 0xffc629, metalness: 0.8, roughness: 0.2 });
    const buckleL = new THREE.Mesh(buckleGeo, buckleMat);
    buckleL.position.set(-0.09, 0.16, 0);
    const buckleR = new THREE.Mesh(buckleGeo, buckleMat);
    buckleR.position.set(0.09, 0.16, 0);
    group.add(buckleL, buckleR);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.05, 0.015, 8, 16, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x3d1d07 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 0.26, 0);
    group.add(handle);

    group.position.set(0.48, 0, 0.5);
    group.visible = false;
    return group;
  }

  private createCompanyBillboard(comp: Company): THREE.Group {
    const group = new THREE.Group();

    // Canvas texture for crisp readable text
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Rounded background with fallback
      ctx.fillStyle = '#193A46';
      ctx.beginPath();
      const ctxAny = ctx as unknown as { roundRect?: Function };
      if (typeof ctxAny.roundRect === 'function') {
        ctxAny.roundRect(8, 8, 496, 144, 24);
      } else {
        ctx.rect(8, 8, 496, 144);
      }
      ctx.fill();

      // Accent line
      ctx.fillStyle = comp.accent_color;
      ctx.fillRect(16, 134, 480, 8);

      // Text: Company Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 42px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(comp.name, 256, 64);

      // Text: Role Title
      ctx.fillStyle = comp.accent_color;
      ctx.font = 'bold 28px Nunito, sans-serif';
      ctx.fillText(comp.role_title, 256, 110);

      const texture = new THREE.CanvasTexture(canvas);
      const boardGeo = new THREE.PlaneGeometry(2.2, 0.7);
      const boardMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const boardMesh = new THREE.Mesh(boardGeo, boardMat);
      group.add(boardMesh);
    } else {
      // Direct color fallback if 2D context fails
      const boardGeo = new THREE.PlaneGeometry(2.2, 0.7);
      const boardMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(comp.accent_color) });
      const boardMesh = new THREE.Mesh(boardGeo, boardMat);
      group.add(boardMesh);
    }

    return group;
  }

  private setupTrajectoryPreview(): THREE.Group {
    const group = new THREE.Group();
    const beadGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const beadMat = new THREE.MeshBasicMaterial({
      color: 0xffe85a,
      transparent: true,
      opacity: 0.9,
    });
    for (let i = 0; i < CourtScene.MAX_TRAJECTORY_POINTS; i++) {
      const mesh = new THREE.Mesh(beadGeo, beadMat);
      mesh.visible = false;
      group.add(mesh);
    }
    return group;
  }

  private setupParticles(): THREE.Points {
    const count = 40;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      this.swishParticleVelocities.push(new THREE.Vector3());
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffc629,
      size: 0.18,
      transparent: true,
      opacity: 0,
    });

    return new THREE.Points(geo, mat);
  }

  // --- PROJECTILE CREATION ---

  public createProjectileMesh(type: ThrownObjectType) {
    this.projectileType = type;
    while (this.projectile.children.length > 0) {
      this.projectile.remove(this.projectile.children[0]);
    }

    if (type === 'CV') {
      // Stylized CV Document / Folder
      const docGeo = new THREE.BoxGeometry(0.42, 0.55, 0.04);
      const docMat = new THREE.MeshStandardMaterial({
        color: 0xf4f7f7, // crisp paper
        roughness: 0.3,
      });
      const docMesh = new THREE.Mesh(docGeo, docMat);
      docMesh.castShadow = true;
      this.projectile.add(docMesh);

      // Gold seal stamp
      const sealGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
      sealGeo.rotateX(Math.PI / 2);
      const sealMat = new THREE.MeshBasicMaterial({ color: 0xffc629 });
      const seal = new THREE.Mesh(sealGeo, sealMat);
      seal.position.set(0.1, -0.16, 0.025);
      this.projectile.add(seal);

      // Text lines on CV
      const lineGeo = new THREE.BoxGeometry(0.28, 0.03, 0.042);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x08bfe8 });
      for (let y = 0.14; y >= -0.06; y -= 0.08) {
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(-0.02, y, 0.005);
        this.projectile.add(line);
      }
    } else {
      // Stylized Deliverable Package
      const boxGeo = new THREE.BoxGeometry(0.44, 0.44, 0.44);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x39cf61, // Green deliverable
        roughness: 0.3,
        emissive: 0x197a3b,
        emissiveIntensity: 0.3,
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.castShadow = true;
      this.projectile.add(boxMesh);

      // Digital circuit band
      const bandGeo = new THREE.BoxGeometry(0.46, 0.1, 0.46);
      const bandMat = new THREE.MeshBasicMaterial({ color: 0xffe85a });
      const band = new THREE.Mesh(bandGeo, bandMat);
      this.projectile.add(band);
    }
  }

  public resetProjectileToHand() {
    this.isThrowing = false;
    this.throwElapsed = 0;
    this.character.setAnimationState('idle');
    this.projectile.position.copy(this.throwStartPos);
    this.projectile.rotation.set(0, 0, 0);
    this.projectile.visible = true;
    this.hideTrajectoryPreview();
  }

  // --- AIMING & THROWING ---

  public updateAiming(dragDx: number, dragDy: number) {
    if (this.isThrowing) return;

    this.character.setAnimationState('aiming');
    const targetCompany = SEEDED_COMPANIES.find((c) => c.id === this.selectedCompanyId) || SEEDED_COMPANIES[0];
    const targetHoopPos = new THREE.Vector3(...targetCompany.hoop_position);

    const { velocity } = TrajectoryCalculator.computeLaunchVelocity(
      this.throwStartPos,
      targetHoopPos,
      dragDx,
      dragDy
    );

    // Compute trajectory points
    const points = TrajectoryCalculator.computeTrajectoryPoints(this.throwStartPos, velocity);
    this.showTrajectoryPreview(points);
  }

  public showTrajectoryPreview(points: THREE.Vector3[]) {
    this.trajectoryPointsMesh.visible = true;
    const count = Math.min(points.length, CourtScene.MAX_TRAJECTORY_POINTS);
    for (let i = 0; i < CourtScene.MAX_TRAJECTORY_POINTS; i++) {
      const child = this.trajectoryPointsMesh.children[i];
      if (child) {
        if (i < count) {
          child.position.copy(points[i]);
          const scale = Math.max(0.3, 1.0 - (i / count) * 0.6);
          child.scale.set(scale, scale, scale);
          child.visible = true;
        } else {
          child.visible = false;
        }
      }
    }
  }

  public hideTrajectoryPreview() {
    this.trajectoryPointsMesh.visible = false;
    for (const child of this.trajectoryPointsMesh.children) {
      child.visible = false;
    }
  }

  public throwObject(
    dragDx: number,
    dragDy: number,
    onImpact: (result: ShotEvaluation) => void
  ) {
    if (this.isThrowing) return;

    this.hideTrajectoryPreview();
    const targetCompany = SEEDED_COMPANIES.find((c) => c.id === this.selectedCompanyId) || SEEDED_COMPANIES[0];
    const targetHoopPos = new THREE.Vector3(...targetCompany.hoop_position);

    const { velocity, flightTime } = TrajectoryCalculator.computeLaunchVelocity(
      this.throwStartPos,
      targetHoopPos,
      dragDx,
      dragDy
    );

    this.throwVelocity = velocity;
    this.currentFlightTime = flightTime;
    this.throwElapsed = 0;
    this.isThrowing = true;
    this.onImpactCallback = onImpact;

    this.character.setAnimationState('throw');
  }

  public selectCompany(companyId: string) {
    this.selectedCompanyId = companyId;
    this.updateTargetRing();
  }

  private updateTargetRing() {
    const comp = SEEDED_COMPANIES.find((c) => c.id === this.selectedCompanyId);
    if (comp) {
      this.hoopTargetRing.position.set(comp.hoop_position[0], 0.02, comp.hoop_position[2]);
      (this.hoopTargetRing.material as THREE.MeshBasicMaterial).color.set(comp.accent_color);
    }
  }

  private triggerSwishCelebration(pos: THREE.Vector3) {
    this.swishActive = true;
    this.swishTimer = 0;
    (this.swishParticles.material as THREE.PointsMaterial).opacity = 1;

    const positions = this.swishParticles.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 40; i++) {
      positions.setXYZ(i, pos.x, pos.y, pos.z);
      this.swishParticleVelocities[i].set(
        (Math.random() - 0.5) * 4.5,
        Math.random() * 4.0 + 1.5,
        (Math.random() - 0.5) * 4.5
      );
    }
    positions.needsUpdate = true;
  }

  public handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = (this.container.clientWidth > 0) ? this.container.clientWidth : (window.innerWidth || 1280);
    const height = (this.container.clientHeight > 0) ? this.container.clientHeight : (window.innerHeight || 800);
    const aspect = height > 0 ? width / height : 1.77;
    this.camera.aspect = aspect;
    this.updateCameraForViewport();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // --- ANIMATION TICK ---

  private animate() {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update character
    this.character.update(delta);

    // Handle projectile flight
    if (this.isThrowing) {
      this.throwElapsed += delta;
      const t = this.throwElapsed;

      // New position
      const pos = TrajectoryCalculator.getPositionAtTime(this.throwStartPos, this.throwVelocity, t);
      this.projectile.position.copy(pos);

      // Tumble / rotate in air
      this.projectile.rotation.x += delta * 6;
      this.projectile.rotation.y += delta * 4;

      // Check arrival at hoop target or ground
      const targetCompany = SEEDED_COMPANIES.find((c) => c.id === this.selectedCompanyId) || SEEDED_COMPANIES[0];
      const hoopPos = new THREE.Vector3(...targetCompany.hoop_position);

      const reachedHoop = Math.abs(pos.z - hoopPos.z) < 0.4 && pos.y <= hoopPos.y + 0.3;
      const hitGround = pos.y <= 0.2;

      if (reachedHoop || hitGround || t >= this.currentFlightTime * 1.25) {
        this.isThrowing = false;

        // Evaluate shot
        const evaluation = ShotEvaluator.evaluate(this.projectile.position, hoopPos);

        if (evaluation.success) {
          this.character.setAnimationState('celebrate');
          this.triggerSwishCelebration(hoopPos);
        } else {
          this.character.setAnimationState('disappointed');
        }

        if (this.onImpactCallback) {
          this.onImpactCallback(evaluation);
          this.onImpactCallback = null;
        }
      }
    }

    // Swish particle animation
    if (this.swishActive) {
      this.swishTimer += delta;
      const positions = this.swishParticles.geometry.attributes.position as THREE.BufferAttribute;
      const mat = this.swishParticles.material as THREE.PointsMaterial;

      for (let i = 0; i < 40; i++) {
        const vel = this.swishParticleVelocities[i];
        vel.y -= 9.8 * delta;
        positions.setXYZ(
          i,
          positions.getX(i) + vel.x * delta,
          positions.getY(i) + vel.y * delta,
          positions.getZ(i) + vel.z * delta
        );
      }
      positions.needsUpdate = true;
      mat.opacity = Math.max(0, 1.0 - this.swishTimer / 1.2);

      if (this.swishTimer >= 1.2) {
        this.swishActive = false;
        mat.opacity = 0;
      }
    }

    // Pulse target ring
    if (this.hoopTargetRing) {
      const pulse = 1.0 + Math.sin(this.clock.getElapsedTime() * 4) * 0.08;
      this.hoopTargetRing.scale.set(pulse, pulse, pulse);
    }

    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
