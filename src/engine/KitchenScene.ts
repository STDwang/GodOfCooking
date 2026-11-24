import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { IngredientShape, SeasoningCategory } from '../data/recipes';
import {
  createBambooSteamerTexture,
  createBlueWhiteBowlTexture,
  createContactShadowTexture,
  createDynamicCutCanvas,
  createFuPosterTexture,
  createKitchenTileTexture,
  createStoveDialTexture,
  createTerrazzoCounterTexture,
  createWoodBlockSideTexture,
  createWoodBlockTopTexture,
  type CutLineRecord,
  type DynamicCutCanvas,
} from './proceduralTextures';

export type SceneStationMode = 'title' | 'prep' | 'prep-summary' | 'cook' | 'result' | 'blitz';

export interface ActiveIngredientSpec {
  shape: IngredientShape;
  baseColor: string;
  innerColor: string;
  crumbColor: string;
  showGuides: boolean;
  directions: number;
  cutsPerDirection: number;
  activeDirection: number; // 0, 1, 2
  activeCutIndex: number; // 0..cutsPerDirection-1
  axis1Cuts: CutLineRecord[];
  axis2Cuts: CutLineRecord[];
  axis3Cuts: CutLineRecord[];
}

export interface BladeAlignmentSample {
  actualRatio: number; // 0..1 on active axis
  targetRatio: number; // 0..1 ideal guide line
  normalizedError: number; // 0 = dead on line, 1 = far off
}

interface CrumbParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  active: boolean;
}

interface SteamParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  active: boolean;
}

interface WokPiece {
  baseRadius: number;
  angle: number;
  yOffset: number;
  vy: number;
  y: number;
  rotSpeed: number;
  rx: number;
  ry: number;
  scale: number;
}

// Pre-allocated math helpers (zero GC inside render loop)
const _dummy = new THREE.Object3D();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 1.0, 0);
const _tmpColor = new THREE.Color();
const _targetSauceColor = new THREE.Color('#D99B26');
const _basePieceColor = new THREE.Color('#F5EFE2');
const _cookedPieceColor = new THREE.Color('#B8331B');
const _lhTargetPos = new THREE.Vector3();
const _lhTargetRot = new THREE.Vector3();
const _rhTargetPos = new THREE.Vector3();
const _rhTargetRot = new THREE.Vector3();

const WOK_X = 4.9;
const WOK_Z = 0.05;
const COUNTER_Y = 0;

// Stove knob position in world coordinates (front-left apron of the gas stove)
const KNOB_WORLD_X = WOK_X - 0.72;
const KNOB_WORLD_Y = COUNTER_Y + 0.14;
const KNOB_WORLD_Z = WOK_Z + 1.28;

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

/**
 * Stylized articulated 3D chef hand (9-part composite Group: sleeve cuff, wrist, palm, thumb, 4 curved fingers)
 */
function buildChefHandGroup(side: 'left' | 'right'): THREE.Group {
  const hand = new THREE.Group();
  const sign = side === 'left' ? 1 : -1;

  const skinMat = new THREE.MeshStandardMaterial({
    color: '#EAC0A0',
    roughness: 0.62,
    metalness: 0.02,
  });
  const knuckleMat = new THREE.MeshStandardMaterial({
    color: '#DFAD8A',
    roughness: 0.68,
    metalness: 0.02,
  });
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: '#F7F3EC',
    roughness: 0.78,
    metalness: 0.01,
  });
  const cuffTrimMat = new THREE.MeshStandardMaterial({
    color: '#B83D12',
    roughness: 0.65,
  });

  // White chef coat forearm sleeve extending behind wrist
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.135, 0.42, 14), sleeveMat);
  sleeve.rotation.x = Math.PI / 2;
  sleeve.position.set(0, 0.02, 0.36);
  sleeve.castShadow = true;

  const cuffTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.032, 14), cuffTrimMat);
  cuffTrim.rotation.x = Math.PI / 2;
  cuffTrim.position.set(0, 0.02, 0.17);

  // Wrist bridge
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.095, 0.12, 12), skinMat);
  wrist.rotation.x = Math.PI / 2;
  wrist.position.set(0, 0.01, 0.11);

  // Palm core
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.095, 0.22), skinMat);
  palm.position.set(0, 0.01, -0.02);
  palm.castShadow = true;

  // 4 curled fingers (cat-claw guard / grip ready silhouette)
  const fingerOffsets = [-0.075, -0.025, 0.025, 0.075];
  const fingerLengths = [0.13, 0.145, 0.14, 0.115];
  fingerOffsets.forEach((fx, idx) => {
    const fGroup = new THREE.Group();
    fGroup.position.set(fx, 0.01, -0.12);

    const prox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.024, fingerLengths[idx] * 0.65, 8),
      skinMat,
    );
    prox.rotation.x = Math.PI * 0.44;
    prox.position.set(0, -0.01, -0.04);

    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.021, fingerLengths[idx] * 0.6, 8),
      knuckleMat,
    );
    tip.rotation.x = Math.PI * 0.12;
    tip.position.set(0, -0.055, -0.078);

    fGroup.add(prox, tip);
    hand.add(fGroup);
  });

  // Opposing thumb
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.14, 8), knuckleMat);
  thumb.position.set(sign * 0.115, -0.02, -0.03);
  thumb.rotation.z = sign * 0.65;
  thumb.rotation.x = Math.PI * 0.35;

  hand.add(sleeve, cuffTrim, wrist, palm, thumb);
  return hand;
}

export class KitchenScene {
  private container: HTMLElement;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;
  private contextLost = false;

  // Dynamic lighting
  private stoveLight!: THREE.PointLight;

  // Articulated 3D Chef Hands & handheld props
  private leftHand!: THREE.Group;
  private rightHand!: THREE.Group;
  private pourBowlGroup!: THREE.Group;
  private pourBowlFoodMat!: THREE.MeshStandardMaterial;
  private seasoningPropGroup!: THREE.Group;
  private seasoningLiquidMat!: THREE.MeshStandardMaterial;
  private seasoningBottleMesh!: THREE.Group;
  private seasoningSpoonMesh!: THREE.Group;
  private wokSpatulaGroup!: THREE.Group;

  // Hand action choreography timers (0..1 decaying)
  private ingredientPourAnim = 0;
  private knobTurnAnim = 0;
  private seasoningPourAnim = 0;
  private seasoningPourKind: SeasoningCategory = 'liquid';
  private stoveKnobGroup!: THREE.Group;
  private targetKnobAngle = -Math.PI * 0.75;

  // Station 1: Chopping block, ingredient, cleaver & precision sightline
  private ingredientPivot!: THREE.Group;
  private ingredientMesh: THREE.Mesh | null = null;
  private ingredientAuxGroup = new THREE.Group();
  private ingredientWidthX = 1.18;
  private ingredientTopY = 0.72;
  private dynamicCut!: DynamicCutCanvas;
  private ingredientMat!: THREE.MeshStandardMaterial;
  private targetIngredientRotY = 0;
  private ingredientSquash = 0;

  private cleaverGroup!: THREE.Group;
  private bladeTrailMesh!: THREE.Mesh;
  private bladeTrailMat!: THREE.MeshBasicMaterial;
  private bladeSightLine!: THREE.Mesh;
  private bladeSightMat!: THREE.MeshBasicMaterial;
  private cleaverStrikeAnim = 0;
  private cleaverProgressX = 0.45;
  private hitstopTimer = 0;
  private shakeIntensity = 0;

  // Guided precision sweeping state for chopping
  private prepGuideActive = false;
  private prepTargetRatio = 0.2;
  private prepSweepPhase = 0;
  private prepSweepSpeed = 2.6;
  private prepCurrentRatio = 0.2;

  // Station 2: Gas stove, flames, cast-iron wok, sizzling food pieces
  private wokGroup!: THREE.Group;
  private wokTiltAnim = 0;
  private wokSauceMesh!: THREE.Mesh;
  private wokSauceMat!: THREE.MeshPhysicalMaterial;
  private flameCones: THREE.Mesh[] = [];
  private flameInnerCones: THREE.Mesh[] = [];
  private flameLevel: 0 | 1 | 2 | 3 = 0;
  private wokTemp = 22;
  private wokPiecesMesh!: THREE.InstancedMesh;
  private wokPieces: WokPiece[] = [];
  private wokPiecesVisible = false;

  // Result plating dish
  private platingGroup!: THREE.Group;
  private platingFoodMesh!: THREE.InstancedMesh;
  private platingGarnishMesh!: THREE.InstancedMesh;

  // Pooled particles
  private crumbsMesh!: THREE.InstancedMesh;
  private crumbsMat!: THREE.MeshStandardMaterial;
  private crumbs: CrumbParticle[] = [];
  private steamMesh!: THREE.InstancedMesh;
  private steamMat!: THREE.MeshBasicMaterial;
  private steamParticles: SteamParticle[] = [];
  private steamSpawnAcc = 0;

  private mode: SceneStationMode = 'title';
  private elapsed = 0;
  private texturesToDispose: THREE.Texture[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.isSoftwareGl = detectSoftwareGl();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#211914');
    this.scene.fog = new THREE.FogExp2('#211914', 0.032);

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    this.camera.position.set(0, 3.05, 4.9);
    this.camera.lookAt(0, 1.0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;
    this.texturesToDispose.push(envTexture);
    pmremGenerator.dispose();

    this.setupLighting();
    this.buildKitchenEnvironment();
    this.buildChoppingStation();
    this.buildCleaver();
    this.buildWokStation();
    this.buildChefHandsAndProps();
    this.buildPlatingDisplay();
    this.buildParticlePools();

    this.setIngredient({
      shape: 'tofu',
      baseColor: '#F5EFE2',
      innerColor: '#FFFDF7',
      crumbColor: '#F7F2E8',
      showGuides: false,
      directions: 3,
      cutsPerDirection: 4,
      activeDirection: 0,
      activeCutIndex: 0,
      axis1Cuts: [],
      axis2Cuts: [],
      axis3Cuts: [],
    });

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
    window.addEventListener('resize', this.handleResize);

    this.clock.start();
    this.tick();
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
  };

  private handleContextRestored = () => {
    this.contextLost = false;
  };

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, 320);
    const height = Math.max(this.container.clientHeight, 320);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private setupLighting(): void {
    const hemi = new THREE.HemisphereLight('#FFF0DC', '#3E2B1F', 0.88);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight('#FFEAD0', 1.85);
    keyLight.position.set(2.8, 7.2, 4.6);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.025;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#DCEBFF', 0.95);
    rimLight.position.set(-4.5, 5.2, -1.5);
    this.scene.add(rimLight);

    this.stoveLight = new THREE.PointLight('#FF7722', 0.0, 7, 1.8);
    this.stoveLight.position.set(WOK_X, 0.55, WOK_Z + 0.2);
    this.scene.add(this.stoveLight);
  }

  private buildKitchenEnvironment(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const tileTex = createKitchenTileTexture(maxAniso);
    const counterTex = createTerrazzoCounterTexture(maxAniso);
    const fuTex = createFuPosterTexture(maxAniso);
    const bambooTex = createBambooSteamerTexture(maxAniso);
    const bowlTex = createBlueWhiteBowlTexture(maxAniso);
    const shadowTex = createContactShadowTexture();
    this.texturesToDispose.push(tileTex, counterTex, fuTex, bambooTex, bowlTex, shadowTex);

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 12),
      new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.42, metalness: 0.08 }),
    );
    backWall.position.set(2.5, 4.5, -2.55);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.4, 8.5),
      new THREE.MeshStandardMaterial({ map: counterTex, roughness: 0.52, metalness: 0.06 }),
    );
    counter.position.set(2.5, COUNTER_Y - 0.2, 1.4);
    counter.receiveShadow = true;
    this.scene.add(counter);

    // Hanging bar & stainless steel utensils
    const railGroup = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: '#CFD6DC', metalness: 0.88, roughness: 0.22 });
    const handleWoodMat = new THREE.MeshStandardMaterial({ color: '#8C4E27', roughness: 0.65, metalness: 0.05 });

    const railBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 9.2, 16), steelMat);
    railBar.rotation.z = Math.PI / 2;
    railBar.position.set(2.2, 3.85, -2.32);
    railGroup.add(railBar);

    [-2.1, 2.2, 6.5].forEach((bx) => {
      const mount = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.25), steelMat);
      mount.position.set(bx, 3.85, -2.44);
      railGroup.add(mount);
    });

    const ladleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.55, 10), steelMat);
    ladleStem.position.set(0.42, 3.05, -2.3);
    const ladleBowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.65),
      steelMat,
    );
    ladleBowl.rotation.x = Math.PI * 0.45;
    ladleBowl.position.set(0.42, 2.22, -2.26);
    railGroup.add(ladleStem, ladleBowl);

    const spatHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.62, 12), handleWoodMat);
    spatHandle.position.set(1.48, 3.25, -2.3);
    const spatStem = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.72, 10), steelMat);
    spatStem.position.set(1.48, 2.6, -2.3);
    const spatBlade = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.025), steelMat);
    spatBlade.position.set(1.48, 2.15, -2.28);
    railGroup.add(spatHandle, spatStem, spatBlade);
    this.scene.add(railGroup);

    // Red diamond "福" sticker
    const fuSticker = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.68),
      new THREE.MeshStandardMaterial({
        map: fuTex,
        roughness: 0.72,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
    fuSticker.position.set(1.92, 1.92, -2.51);
    fuSticker.rotation.z = Math.PI / 4;
    this.scene.add(fuSticker);

    // Bamboo steamer on left
    const steamerGroup = new THREE.Group();
    const bambooMat = new THREE.MeshStandardMaterial({ map: bambooTex, roughness: 0.78, metalness: 0.02 });
    const steamerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.64, 0.68, 28), bambooMat);
    steamerBase.position.y = 0.34;
    steamerBase.castShadow = true;
    steamerBase.receiveShadow = true;
    const steamerRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.035, 10, 28),
      new THREE.MeshStandardMaterial({ color: '#6A4C22', roughness: 0.8 }),
    );
    steamerRim.rotation.x = Math.PI / 2;
    steamerRim.position.y = 0.68;
    const steamerLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.66, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
      bambooMat,
    );
    steamerLid.position.y = 0.56;
    steamerLid.scale.set(1, 0.58, 1);
    const lidHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.028, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: '#6A4C22', roughness: 0.75 }),
    );
    lidHandle.position.y = 0.94;
    steamerGroup.add(steamerBase, steamerRim, steamerLid, lidHandle);
    steamerGroup.position.set(-1.92, COUNTER_Y, -1.25);
    this.scene.add(steamerGroup);

    // Blue-and-white porcelain bowl on right
    const bowlProfile = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.24, 0),
      new THREE.Vector2(0.26, 0.06),
      new THREE.Vector2(0.46, 0.24),
      new THREE.Vector2(0.54, 0.44),
      new THREE.Vector2(0.5, 0.44),
      new THREE.Vector2(0.41, 0.24),
      new THREE.Vector2(0.21, 0.07),
      new THREE.Vector2(0.01, 0.07),
    ];
    const bowlMesh = new THREE.Mesh(
      new THREE.LatheGeometry(bowlProfile, 28),
      new THREE.MeshStandardMaterial({ map: bowlTex, roughness: 0.2, metalness: 0.04 }),
    );
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;
    bowlMesh.position.set(1.98, COUNTER_Y, -0.82);
    this.scene.add(bowlMesh);

    // Spice jars near back stove edge
    const jarColors = ['#EFEAE2', '#B53820', '#D9A441', '#4D3224'];
    jarColors.forEach((col, i) => {
      const jar = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.17, 0.34, 18),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.05 }),
      );
      body.position.y = 0.17;
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 0.07, 18),
        new THREE.MeshStandardMaterial({ color: '#9E6A3A', roughness: 0.65 }),
      );
      lid.position.y = 0.36;
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 10, 10),
        new THREE.MeshStandardMaterial({ color: '#855328', roughness: 0.6 }),
      );
      knob.position.y = 0.42;
      jar.add(body, lid, knob);
      jar.position.set(3.15 + i * 0.44, COUNTER_Y, -1.78);
      this.scene.add(jar);
    });

    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });
    const blockShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), shadowMat);
    blockShadow.rotation.x = -Math.PI / 2;
    blockShadow.position.set(0, COUNTER_Y + 0.008, 0);
    this.scene.add(blockShadow);

    const steamerShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.75), shadowMat);
    steamerShadow.rotation.x = -Math.PI / 2;
    steamerShadow.position.set(-1.92, COUNTER_Y + 0.008, -1.25);
    this.scene.add(steamerShadow);
  }

  private buildChoppingStation(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const woodTopTex = createWoodBlockTopTexture(maxAniso);
    const woodSideTex = createWoodBlockSideTexture(maxAniso);
    this.texturesToDispose.push(woodTopTex, woodSideTex);

    const blockGroup = new THREE.Group();
    const radius = 1.24;
    const height = 0.56;

    const sideMat = new THREE.MeshStandardMaterial({ map: woodSideTex, roughness: 0.72, metalness: 0.02 });
    const topMat = new THREE.MeshStandardMaterial({ map: woodTopTex, roughness: 0.64, metalness: 0.03 });

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.03, height, 40),
      [sideMat, topMat, sideMat],
    );
    body.position.y = height * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;

    const bevelRim = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.02, 0.038, 12, 40), sideMat);
    bevelRim.rotation.x = Math.PI / 2;
    bevelRim.position.y = height - 0.02;

    blockGroup.add(body, bevelRim);
    blockGroup.position.set(0, COUNTER_Y, 0);
    this.scene.add(blockGroup);

    this.ingredientPivot = new THREE.Group();
    this.ingredientPivot.position.set(0, height + 0.004, 0);
    this.scene.add(this.ingredientPivot);
    this.ingredientPivot.add(this.ingredientAuxGroup);

    this.dynamicCut = createDynamicCutCanvas(maxAniso);
    this.texturesToDispose.push(this.dynamicCut.texture);
    this.ingredientMat = new THREE.MeshStandardMaterial({
      map: this.dynamicCut.texture,
      roughness: 0.45,
      metalness: 0.02,
    });

    // Crisp luminous 3D blade alignment sightline directly under cleaver on top of ingredient
    this.bladeSightMat = new THREE.MeshBasicMaterial({
      color: '#FFFBEB',
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.bladeSightLine = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.012, 1.24), this.bladeSightMat);
    this.bladeSightLine.position.set(0, height + 0.74, 0);
    this.bladeSightLine.visible = false;
    this.scene.add(this.bladeSightLine);
  }

  private buildCleaver(): void {
    this.cleaverGroup = new THREE.Group();

    const forgedDarkMat = new THREE.MeshStandardMaterial({ color: '#202428', metalness: 0.72, roughness: 0.46 });
    const polishedSteelMat = new THREE.MeshStandardMaterial({ color: '#E5EBEF', metalness: 0.94, roughness: 0.14 });
    const glintEdgeMat = new THREE.MeshBasicMaterial({ color: '#EAF7FF', transparent: true, opacity: 0.72 });
    const rosewoodMat = new THREE.MeshStandardMaterial({ color: '#6E3921', roughness: 0.58, metalness: 0.05 });
    const redRingMat = new THREE.MeshStandardMaterial({ color: '#C8281D', roughness: 0.4, metalness: 0.12 });

    // Blade oriented along Z axis (pointing front-to-back) so player slices cleanly from right to left across the guide lines!
    // Keep handle extending toward right-front (+Z) so the right chef hand grips it naturally!
    const lowerBlade = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.46, 1.36), polishedSteelMat);
    lowerBlade.position.set(0, 0.25, -0.05);
    lowerBlade.castShadow = true;

    const upperSpine = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.22, 1.34), forgedDarkMat);
    upperSpine.position.set(0, 0.58, -0.05);
    upperSpine.castShadow = true;

    const spineGlint = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.022, 0.68), glintEdgeMat);
    spineGlint.position.set(0, 0.7, -0.18);

    const sharpEdge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.04, 1.36), polishedSteelMat);
    sharpEdge.position.set(0, 0.02, -0.05);

    const bolster = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.072, 0.14, 14), polishedSteelMat);
    bolster.rotation.x = Math.PI / 2;
    bolster.position.set(0, 0.56, 0.68);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.074, 0.6, 14), rosewoodMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.56, 1.04);
    handle.castShadow = true;

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.073, 0.073, 0.06, 14), redRingMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.56, 1.28);

    const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.064, 0.06, 14), forgedDarkMat);
    pommel.rotation.x = Math.PI / 2;
    pommel.position.set(0, 0.56, 1.34);

    const trailGeo = new THREE.RingGeometry(0.7, 1.28, 22, 1, -0.35, Math.PI * 0.62);
    this.bladeTrailMat = new THREE.MeshBasicMaterial({
      color: '#FFF7EB',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.bladeTrailMesh = new THREE.Mesh(trailGeo, this.bladeTrailMat);
    this.bladeTrailMesh.rotation.y = Math.PI / 2;
    this.bladeTrailMesh.position.set(0.05, 0.3, -0.05);

    this.cleaverGroup.add(
      lowerBlade,
      upperSpine,
      spineGlint,
      sharpEdge,
      bolster,
      handle,
      collar,
      pommel,
      this.bladeTrailMesh,
    );

    this.cleaverGroup.position.set(0.45, 1.48, 0.1);
    this.scene.add(this.cleaverGroup);
  }

  private buildWokStation(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const dialTex = createStoveDialTexture(maxAniso);
    this.texturesToDispose.push(dialTex);

    const stoveGroup = new THREE.Group();
    stoveGroup.position.set(WOK_X, COUNTER_Y, WOK_Z);

    const castIronMat = new THREE.MeshStandardMaterial({ color: '#202225', metalness: 0.68, roughness: 0.54 });
    const brassMat = new THREE.MeshStandardMaterial({ color: '#A57B3A', metalness: 0.84, roughness: 0.3 });
    const wokSurfaceMat = new THREE.MeshStandardMaterial({
      color: '#1C1E21',
      metalness: 0.78,
      roughness: 0.32,
      side: THREE.DoubleSide,
    });

    // Stove body
    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(2.85, 0.16, 2.75),
      new THREE.MeshStandardMaterial({ color: '#17171A', metalness: 0.48, roughness: 0.28 }),
    );
    basePlate.position.y = 0.08;
    basePlate.receiveShadow = true;
    stoveGroup.add(basePlate);

    // Front control bezel & rotary gas flame knob (visible in cook camera so left hand turns it!)
    const dialPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.03, 28),
      new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.32, metalness: 0.2 }),
    );
    dialPlate.rotation.x = Math.PI * 0.16;
    dialPlate.position.set(-0.72, 0.17, 1.24);
    stoveGroup.add(dialPlate);

    this.stoveKnobGroup = new THREE.Group();
    this.stoveKnobGroup.position.set(-0.72, 0.21, 1.25);
    this.stoveKnobGroup.rotation.x = Math.PI * 0.16;

    const knobBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.17, 0.11, 24),
      new THREE.MeshStandardMaterial({ color: '#2A2C30', metalness: 0.72, roughness: 0.28 }),
    );
    const knobFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.13, 0.26),
      new THREE.MeshStandardMaterial({ color: '#D4D9DF', metalness: 0.86, roughness: 0.22 }),
    );
    knobFin.position.y = 0.05;
    const knobDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 10),
      new THREE.MeshBasicMaterial({ color: '#EF4444' }),
    );
    knobDot.position.set(0, 0.12, -0.09);
    this.stoveKnobGroup.add(knobBase, knobFin, knobDot);
    stoveGroup.add(this.stoveKnobGroup);

    // Burner well & brass ring
    const burnerWell = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.68, 0.1, 32), castIronMat);
    burnerWell.position.y = 0.18;
    stoveGroup.add(burnerWell);

    const brassRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 10, 28), brassMat);
    brassRing.rotation.x = Math.PI / 2;
    brassRing.position.y = 0.24;
    stoveGroup.add(brassRing);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const prong = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.07), castIronMat);
      prong.position.set(Math.cos(a) * 0.68, 0.29, Math.sin(a) * 0.68);
      prong.rotation.y = -a;
      stoveGroup.add(prong);
    }

    // Animated gas flame cones
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: '#FF7A1A',
      transparent: true,
      opacity: 0.86,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: '#3CA4FF',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flameGeo = new THREE.ConeGeometry(0.085, 0.34, 8);
    flameGeo.translate(0, 0.17, 0);

    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = 0.42;
      const outer = new THREE.Mesh(flameGeo, outerFlameMat);
      outer.position.set(Math.cos(a) * r, 0.26, Math.sin(a) * r);
      outer.rotation.z = -Math.cos(a) * 0.32;
      outer.rotation.x = Math.sin(a) * 0.32;
      outer.scale.setScalar(0.001);
      stoveGroup.add(outer);
      this.flameCones.push(outer);

      const inner = new THREE.Mesh(flameGeo, innerFlameMat);
      inner.position.set(Math.cos(a) * (r * 0.9), 0.26, Math.sin(a) * (r * 0.9));
      inner.scale.setScalar(0.001);
      stoveGroup.add(inner);
      this.flameInnerCones.push(inner);
    }

    // Cast-iron Wok
    this.wokGroup = new THREE.Group();
    this.wokGroup.position.set(0, 0.4, 0);

    const wokPoints = [
      new THREE.Vector2(0.005, 0.0),
      new THREE.Vector2(0.36, 0.03),
      new THREE.Vector2(0.74, 0.14),
      new THREE.Vector2(1.06, 0.36),
      new THREE.Vector2(1.26, 0.64),
      new THREE.Vector2(1.31, 0.65),
      new THREE.Vector2(1.11, 0.33),
      new THREE.Vector2(0.78, 0.1),
      new THREE.Vector2(0.38, -0.02),
      new THREE.Vector2(0.005, -0.03),
    ];
    const wokMesh = new THREE.Mesh(new THREE.LatheGeometry(wokPoints, 42), wokSurfaceMat);
    wokMesh.castShadow = true;
    wokMesh.receiveShadow = true;
    this.wokGroup.add(wokMesh);

    const handleWoodMat = new THREE.MeshStandardMaterial({ color: '#744222', roughness: 0.65 });
    const handleMount = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), castIronMat);
    handleMount.position.set(1.36, 0.68, 0);
    handleMount.rotation.z = 0.24;
    const longHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.92, 14), handleWoodMat);
    longHandle.rotation.z = Math.PI / 2 - 0.24;
    longHandle.position.set(1.86, 0.8, 0);
    longHandle.castShadow = true;

    const earHandle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 8, 16, Math.PI), castIronMat);
    earHandle.position.set(-1.3, 0.65, 0);
    earHandle.rotation.z = Math.PI / 2;

    this.wokGroup.add(handleMount, longHandle, earHandle);

    // Glossy oil/sauce layer
    this.wokSauceMat = new THREE.MeshPhysicalMaterial({
      color: '#D99B26',
      roughness: 0.14,
      metalness: 0.05,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.88,
    });
    this.wokSauceMesh = new THREE.Mesh(new THREE.CircleGeometry(0.84, 32), this.wokSauceMat);
    this.wokSauceMesh.rotation.x = -Math.PI / 2;
    this.wokSauceMesh.position.y = 0.19;
    this.wokGroup.add(this.wokSauceMesh);

    // Tumbling 3D food chunks
    const count = 38;
    this.wokPiecesMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.18, 0.14, 0.18),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.35, metalness: 0.04 }),
      count,
    );
    this.wokPiecesMesh.frustumCulled = false;
    this.wokPiecesMesh.castShadow = true;

    for (let i = 0; i < count; i++) {
      const r = 0.12 + Math.sqrt((i + 0.5) / count) * 0.62;
      const angle = i * 2.39996;
      this.wokPieces.push({
        baseRadius: r,
        angle,
        yOffset: 0.16 + (i % 3) * 0.06,
        vy: 0,
        y: 0,
        rotSpeed: (Math.random() - 0.5) * 4,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        scale: 0.72 + Math.random() * 0.42,
      });
    }
    this.wokGroup.add(this.wokPiecesMesh);
    this.wokPiecesMesh.visible = false;

    stoveGroup.add(this.wokGroup);
    this.scene.add(stoveGroup);
  }

  private buildChefHandsAndProps(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const bowlTex = createBlueWhiteBowlTexture(maxAniso);
    this.texturesToDispose.push(bowlTex);

    this.leftHand = buildChefHandGroup('left');
    this.rightHand = buildChefHandGroup('right');
    this.leftHand.visible = false;
    this.rightHand.visible = false;
    this.scene.add(this.leftHand, this.rightHand);

    // 1. Blue-and-white bowl filled with prepped ingredients (attached to right hand during pour!)
    this.pourBowlGroup = new THREE.Group();
    const bowlProfile = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.22, 0),
      new THREE.Vector2(0.42, 0.22),
      new THREE.Vector2(0.48, 0.38),
      new THREE.Vector2(0.44, 0.38),
      new THREE.Vector2(0.37, 0.22),
      new THREE.Vector2(0.2, 0.06),
      new THREE.Vector2(0.01, 0.06),
    ];
    const pourBowlMesh = new THREE.Mesh(
      new THREE.LatheGeometry(bowlProfile, 24),
      new THREE.MeshStandardMaterial({ map: bowlTex, roughness: 0.22 }),
    );
    this.pourBowlFoodMat = new THREE.MeshStandardMaterial({ color: '#F5EFE2', roughness: 0.4 });
    const foodMound = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), this.pourBowlFoodMat);
    foodMound.scale.set(1, 0.55, 1);
    foodMound.position.y = 0.26;
    this.pourBowlGroup.add(pourBowlMesh, foodMound);
    this.pourBowlGroup.position.set(-0.32, -0.05, -0.18);
    this.pourBowlGroup.visible = false;
    this.rightHand.add(this.pourBowlGroup);

    // 2. Seasoning vessel held by right hand (bottle for liquids, ceramic spoon for pastes/powders)
    this.seasoningPropGroup = new THREE.Group();
    this.seasoningPropGroup.position.set(-0.18, -0.04, -0.14);
    this.seasoningPropGroup.visible = false;

    this.seasoningLiquidMat = new THREE.MeshStandardMaterial({
      color: '#C84B1D',
      roughness: 0.28,
      metalness: 0.08,
    });

    // Bottle variant (oil, soy sauce, vinegar, wine, water)
    this.seasoningBottleMesh = new THREE.Group();
    const bottleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.36, 16),
      new THREE.MeshStandardMaterial({ color: '#EFE8DC', roughness: 0.25 }),
    );
    const bottleLabel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.116, 0.122, 0.14, 16),
      this.seasoningLiquidMat,
    );
    const bottleNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.075, 0.14, 14),
      new THREE.MeshStandardMaterial({ color: '#EFE8DC', roughness: 0.25 }),
    );
    bottleNeck.position.y = 0.24;
    const bottleCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: '#8E4822', roughness: 0.5 }),
    );
    bottleCap.position.y = 0.32;
    this.seasoningBottleMesh.add(bottleBody, bottleLabel, bottleNeck, bottleCap);

    // Porcelain spoon variant (bean paste, salt, sugar, pepper, aromatics)
    this.seasoningSpoonMesh = new THREE.Group();
    const spoonStem = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.025, 0.36),
      new THREE.MeshStandardMaterial({ color: '#F5F1E8', roughness: 0.22 }),
    );
    spoonStem.position.z = -0.12;
    const spoonScoop = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 14, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: '#F5F1E8', roughness: 0.22, side: THREE.DoubleSide }),
    );
    spoonScoop.position.set(0, 0.02, -0.34);
    const scoopFill = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), this.seasoningLiquidMat);
    scoopFill.scale.set(1, 0.65, 1);
    scoopFill.position.set(0, 0.01, -0.34);
    this.seasoningSpoonMesh.add(spoonStem, spoonScoop, scoopFill);

    this.seasoningPropGroup.add(this.seasoningBottleMesh, this.seasoningSpoonMesh);
    this.rightHand.add(this.seasoningPropGroup);

    // 3. Chinese Wok Spatula held by left hand during stir-frying & tossing
    this.wokSpatulaGroup = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: '#D3D9DE', metalness: 0.88, roughness: 0.2 });
    const woodMat = new THREE.MeshStandardMaterial({ color: '#7D4724', roughness: 0.62 });
    const spatWood = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.32, 12), woodMat);
    spatWood.rotation.x = Math.PI / 2;
    spatWood.position.set(0, -0.02, -0.08);
    const spatRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 10), steelMat);
    spatRod.rotation.x = Math.PI / 2;
    spatRod.position.set(0, -0.02, -0.54);
    const spatHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.28), steelMat);
    spatHead.rotation.x = 0.25;
    spatHead.position.set(0, -0.05, -0.92);
    this.wokSpatulaGroup.add(spatWood, spatRod, spatHead);
    this.wokSpatulaGroup.visible = false;
    this.leftHand.add(this.wokSpatulaGroup);
  }

  private buildPlatingDisplay(): void {
    this.platingGroup = new THREE.Group();
    this.platingGroup.position.set(0, 0.57, 0);
    this.platingGroup.visible = false;

    const plateProfile = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.58, 0),
      new THREE.Vector2(0.92, 0.09),
      new THREE.Vector2(1.02, 0.16),
      new THREE.Vector2(0.96, 0.17),
      new THREE.Vector2(0.56, 0.05),
      new THREE.Vector2(0.01, 0.05),
    ];
    const plateMesh = new THREE.Mesh(
      new THREE.LatheGeometry(plateProfile, 36),
      new THREE.MeshStandardMaterial({ color: '#F7F3EC', roughness: 0.18, metalness: 0.04 }),
    );
    plateMesh.castShadow = true;
    plateMesh.receiveShadow = true;

    const rimRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.014, 8, 36),
      new THREE.MeshStandardMaterial({ color: '#2B4E87', roughness: 0.25 }),
    );
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.16;

    this.platingFoodMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.19, 0.14, 0.19),
      new THREE.MeshStandardMaterial({ color: '#B8331B', roughness: 0.24, metalness: 0.06 }),
      34,
    );
    this.platingFoodMesh.frustumCulled = false;

    for (let i = 0; i < 34; i++) {
      const layer = i < 20 ? 0 : i < 30 ? 1 : 2;
      const r = layer === 0 ? 0.12 + (i / 20) * 0.56 : layer === 1 ? 0.08 + ((i - 20) / 10) * 0.34 : 0.12;
      const a = i * 2.39996;
      _dummy.position.set(Math.cos(a) * r, 0.12 + layer * 0.11, Math.sin(a) * r);
      _dummy.rotation.set(i * 0.4, i * 0.7, i * 0.3);
      _dummy.scale.setScalar(0.82 + (i % 4) * 0.12);
      _dummy.updateMatrix();
      this.platingFoodMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.platingFoodMesh.instanceMatrix.needsUpdate = true;

    this.platingGarnishMesh = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10),
      new THREE.MeshStandardMaterial({ color: '#4E8F34', roughness: 0.45 }),
      16,
    );
    this.platingGarnishMesh.frustumCulled = false;

    for (let i = 0; i < 16; i++) {
      const r = 0.05 + (i / 16) * 0.48;
      const a = i * 2.1 + 0.5;
      _dummy.position.set(Math.cos(a) * r, 0.31 + (1 - r) * 0.11, Math.sin(a) * r);
      _dummy.rotation.set(0.3, a, 0.2);
      _dummy.scale.setScalar(0.8 + (i % 3) * 0.2);
      _dummy.updateMatrix();
      this.platingGarnishMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.platingGarnishMesh.instanceMatrix.needsUpdate = true;

    this.platingGroup.add(plateMesh, rimRing, this.platingFoodMesh, this.platingGarnishMesh);
    this.scene.add(this.platingGroup);
  }

  private buildParticlePools(): void {
    const crumbCount = 84;
    this.crumbsMat = new THREE.MeshStandardMaterial({ color: '#FFFDF7', roughness: 0.4, metalness: 0.02 });
    this.crumbsMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.052, 0.052, 0.052), this.crumbsMat, crumbCount);
    this.crumbsMesh.frustumCulled = false;

    for (let i = 0; i < crumbCount; i++) {
      this.crumbs.push({
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
        rot: new THREE.Vector3(),
        life: 0,
        maxLife: 0.6,
        scale: 1,
        active: false,
      });
      _dummy.position.set(0, -10, 0);
      _dummy.scale.setScalar(0.0001);
      _dummy.updateMatrix();
      this.crumbsMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.crumbsMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.crumbsMesh);

    const steamCount = 28;
    this.steamMat = new THREE.MeshBasicMaterial({
      color: '#F5EFE6',
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    });
    this.steamMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 10, 10), this.steamMat, steamCount);
    this.steamMesh.frustumCulled = false;

    for (let i = 0; i < steamCount; i++) {
      this.steamParticles.push({
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1.8,
        scale: 1,
        active: false,
      });
      _dummy.position.set(0, -10, 0);
      _dummy.scale.setScalar(0.0001);
      _dummy.updateMatrix();
      this.steamMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.steamMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.steamMesh);
  }

  public setMode(mode: SceneStationMode): void {
    this.mode = mode;
    const isPlating = mode === 'result';
    this.platingGroup.visible = isPlating;
    this.ingredientPivot.visible = !isPlating;
    this.cleaverGroup.visible = mode === 'title' || mode === 'prep' || mode === 'prep-summary' || mode === 'blitz';
    this.bladeSightLine.visible = mode === 'prep' && this.prepGuideActive;
    this.wokPiecesVisible = mode === 'cook';
    this.wokPiecesMesh.visible = this.wokPiecesVisible;

    // Hands only appear during wok cooking (pouring, knob turning, tossing) — hidden while chopping for clear sightlines
    const showHands = mode === 'cook';
    this.leftHand.visible = showHands;
    this.rightHand.visible = showHands;
    this.wokSpatulaGroup.visible = mode === 'cook';
    if (mode !== 'cook') {
      this.pourBowlGroup.visible = false;
      this.seasoningPropGroup.visible = false;
    }
  }

  public setPrepGuideScanning(active: boolean, targetRatio: number, sweepSpeed = 2.6): void {
    this.prepGuideActive = active;
    this.prepTargetRatio = THREE.MathUtils.clamp(targetRatio, 0.08, 0.92);
    this.prepSweepSpeed = sweepSpeed;
    this.prepSweepPhase = -Math.PI * 0.35; // Start approaching cleanly toward target line
    this.bladeSightLine.visible = this.mode === 'prep' && active;
  }

  /**
   * Samples exact blade-to-guide-line accuracy when the player strikes
   */
  public sampleBladeAlignment(): BladeAlignmentSample {
    const err = Math.abs(this.prepCurrentRatio - this.prepTargetRatio);
    // Tolerance window calibrated for fair, rewarding tactile alignment
    const normalizedError = THREE.MathUtils.clamp(err / 0.13, 0, 1);
    return {
      actualRatio: THREE.MathUtils.clamp(this.prepCurrentRatio, 0.04, 0.96),
      targetRatio: this.prepTargetRatio,
      normalizedError,
    };
  }

  public setIngredient(spec: ActiveIngredientSpec): void {
    if (this.ingredientMesh) {
      this.ingredientPivot.remove(this.ingredientMesh);
      this.ingredientMesh.geometry.dispose();
      this.ingredientMesh = null;
    }
    while (this.ingredientAuxGroup.children.length > 0) {
      const child = this.ingredientAuxGroup.children[0] as THREE.Mesh;
      this.ingredientAuxGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    this.dynamicCut.redraw({
      baseColor: spec.baseColor,
      innerColor: spec.innerColor,
      shape: spec.shape,
      showGuides: spec.showGuides,
      activeDirection: spec.activeDirection,
      activeCutIndex: spec.activeCutIndex,
      directions: spec.directions,
      cutsPerDirection: spec.cutsPerDirection,
      axis1Cuts: spec.axis1Cuts,
      axis2Cuts: spec.axis2Cuts,
      axis3Cuts: spec.axis3Cuts,
    });

    this.crumbsMat.color.set(spec.crumbColor);
    this.ingredientMat.roughness = spec.shape === 'tofu' || spec.shape === 'tomato' ? 0.34 : 0.56;

    let geo: THREE.BufferGeometry;
    let yPos = 0.36;
    this.ingredientWidthX = 1.18;
    this.ingredientTopY = 0.72;

    switch (spec.shape) {
      case 'tofu':
        geo = new THREE.BoxGeometry(1.18, 0.72, 1.06);
        yPos = 0.36;
        this.ingredientWidthX = 1.18;
        this.ingredientTopY = 0.73;
        break;
      case 'tomato': {
        geo = new THREE.SphereGeometry(0.56, 26, 20);
        geo.scale(1.15, 0.86, 1.12);
        yPos = 0.46;
        this.ingredientWidthX = 1.24;
        this.ingredientTopY = 0.94;
        const stemMat = new THREE.MeshStandardMaterial({ color: '#397028', roughness: 0.7 });
        for (let i = 0; i < 5; i++) {
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 5), stemMat);
          leaf.position.set(0, 0.94, 0);
          leaf.rotation.z = Math.PI * 0.42;
          leaf.rotation.y = (i / 5) * Math.PI * 2;
          this.ingredientAuxGroup.add(leaf);
        }
        break;
      }
      case 'scallion': {
        geo = new THREE.CylinderGeometry(0.11, 0.13, 1.48, 16);
        geo.rotateZ(Math.PI / 2);
        yPos = 0.13;
        this.ingredientWidthX = 1.46;
        this.ingredientTopY = 0.26;
        [-0.22, 0.22].forEach((oz) => {
          const stalk = new THREE.Mesh(geo.clone(), this.ingredientMat);
          stalk.position.set(0, 0.12, oz);
          stalk.castShadow = true;
          this.ingredientAuxGroup.add(stalk);
        });
        break;
      }
      case 'cucumber':
        geo = new THREE.CylinderGeometry(0.24, 0.26, 1.46, 22);
        geo.rotateZ(Math.PI / 2);
        yPos = 0.24;
        this.ingredientWidthX = 1.44;
        this.ingredientTopY = 0.5;
        break;
      case 'carrot':
        geo = new THREE.CylinderGeometry(0.16, 0.28, 1.42, 20);
        geo.rotateZ(Math.PI / 2);
        yPos = 0.22;
        this.ingredientWidthX = 1.4;
        this.ingredientTopY = 0.46;
        break;
      case 'potato':
        geo = new THREE.SphereGeometry(0.56, 24, 18);
        geo.scale(1.36, 0.78, 0.98);
        yPos = 0.42;
        this.ingredientWidthX = 1.46;
        this.ingredientTopY = 0.85;
        break;
      case 'pepper':
        geo = new THREE.CylinderGeometry(0.14, 0.24, 1.32, 18);
        geo.rotateZ(Math.PI / 2);
        yPos = 0.2;
        this.ingredientWidthX = 1.3;
        this.ingredientTopY = 0.42;
        break;
      case 'pork-belly':
        geo = new THREE.BoxGeometry(1.34, 0.56, 0.92);
        yPos = 0.28;
        this.ingredientWidthX = 1.34;
        this.ingredientTopY = 0.58;
        break;
      case 'chicken':
      case 'pork-loin':
        geo = new THREE.BoxGeometry(1.32, 0.42, 0.86);
        yPos = 0.21;
        this.ingredientWidthX = 1.32;
        this.ingredientTopY = 0.44;
        break;
      default:
        geo = new THREE.BoxGeometry(1.16, 0.66, 1.0);
        yPos = 0.33;
    }

    this.ingredientMesh = new THREE.Mesh(geo, this.ingredientMat);
    this.ingredientMesh.position.y = yPos;
    this.ingredientMesh.castShadow = true;
    this.ingredientMesh.receiveShadow = true;
    this.ingredientPivot.add(this.ingredientMesh);

    this.targetIngredientRotY = spec.activeDirection * (Math.PI / 2);
    this.prepTargetRatio = 1 / (spec.cutsPerDirection + 1);
    this.prepCurrentRatio = this.prepTargetRatio;
    this.cleaverProgressX = this.ratioToWorldX(this.prepTargetRatio);
  }

  private ratioToWorldX(ratio: number): number {
    const span = this.ingredientWidthX * 0.8;
    return span * (0.5 - ratio);
  }

  public updateIngredientCuts(spec: ActiveIngredientSpec, blitzRatio?: number): void {
    this.dynamicCut.redraw({
      baseColor: spec.baseColor,
      innerColor: spec.innerColor,
      shape: spec.shape,
      showGuides: spec.showGuides,
      activeDirection: spec.activeDirection,
      activeCutIndex: spec.activeCutIndex,
      directions: spec.directions,
      cutsPerDirection: spec.cutsPerDirection,
      axis1Cuts: spec.axis1Cuts,
      axis2Cuts: spec.axis2Cuts,
      axis3Cuts: spec.axis3Cuts,
    });
    this.targetIngredientRotY = spec.activeDirection * (Math.PI / 2);
    if (typeof blitzRatio === 'number') {
      this.prepTargetRatio = blitzRatio;
      this.prepCurrentRatio = blitzRatio;
    }
  }

  public triggerChopImpact(crumbColor: string, intensity = 1): void {
    this.cleaverStrikeAnim = 1;
    this.ingredientSquash = 0.14 * intensity;
    this.hitstopTimer = 0.026;
    this.shakeIntensity = Math.min(0.055 * intensity, 0.08);
    this.crumbsMat.color.set(crumbColor);

    const spawnX = this.cleaverProgressX;
    this.spawnCrumbs(spawnX, 0.56 + this.ingredientTopY * 0.78, 0.05, 13, 2.8);
  }

  public configureWokDish(rawColor: string, cookedColor: string, sauceColor: string, garnishColor: string): void {
    _basePieceColor.set(rawColor);
    _cookedPieceColor.set(cookedColor);
    _targetSauceColor.set(sauceColor);
    this.wokSauceMat.color.set(sauceColor);
    this.pourBowlFoodMat.color.set(rawColor);

    (this.platingFoodMesh.material as THREE.MeshStandardMaterial).color.set(cookedColor);
    (this.platingGarnishMesh.material as THREE.MeshStandardMaterial).color.set(garnishColor);

    this.updateWokPieceColors(0);
  }

  /**
   * Animated chef hands pouring prepped ingredients from the blue-and-white bowl into the wok!
   */
  public triggerIngredientPour(ingredientColor: string): void {
    this.pourBowlFoodMat.color.set(ingredientColor);
    this.ingredientPourAnim = 1;
    this.crumbsMat.color.set(ingredientColor);
    this.spawnCrumbs(WOK_X + 0.15, 1.55, WOK_Z, 26, 1.9);
  }

  /**
   * Animated left chef hand reaching down to turn the 3D gas stove rotary flame knob!
   */
  public triggerKnobTurn(level: 0 | 1 | 2 | 3): void {
    this.flameLevel = level;
    const knobAngles: Record<0 | 1 | 2 | 3, number> = {
      0: Math.PI * 0.75,
      1: Math.PI * 0.45,
      2: Math.PI * 0.15,
      3: -Math.PI * 0.15,
    };
    this.targetKnobAngle = knobAngles[level];
    this.knobTurnAnim = 1;
  }

  /**
   * Animated right chef hand pouring a seasoning bottle or porcelain spoon over the wok!
   */
  public triggerSeasoningPour(color: string, category: SeasoningCategory): void {
    this.seasoningPourKind = category;
    this.seasoningLiquidMat.color.set(color);
    this.seasoningPourAnim = 1;
    this.crumbsMat.color.set(color);
    this.spawnCrumbs(WOK_X, 1.48, WOK_Z, 18, 2.1);
    this.shakeIntensity = 0.022;
  }

  public updateCookVisuals(params: {
    flameLevel: 0 | 1 | 2 | 3;
    temp: number;
    progress0to1: number;
    sauceColor: string;
  }): void {
    this.flameLevel = params.flameLevel;
    this.wokTemp = params.temp;
    _targetSauceColor.set(params.sauceColor);
    this.updateWokPieceColors(params.progress0to1);
  }

  private updateWokPieceColors(t: number): void {
    for (let i = 0; i < this.wokPieces.length; i++) {
      const jitter = ((i % 5) - 2) * 0.04;
      _tmpColor.copy(_basePieceColor).lerp(_cookedPieceColor, THREE.MathUtils.clamp(t + jitter, 0, 1));
      this.wokPiecesMesh.setColorAt(i, _tmpColor);
    }
    if (this.wokPiecesMesh.instanceColor) {
      this.wokPiecesMesh.instanceColor.needsUpdate = true;
    }
  }

  public triggerWokToss(): void {
    this.wokTiltAnim = 1;
    this.shakeIntensity = 0.045;
    for (let i = 0; i < this.wokPieces.length; i++) {
      const p = this.wokPieces[i];
      p.vy = 2.7 + Math.random() * 1.4;
      p.rotSpeed = (Math.random() - 0.5) * 11;
    }
    this.crumbsMat.color.set('#FFB347');
    this.spawnCrumbs(WOK_X, 0.95, WOK_Z, 12, 3.3);
  }

  private spawnCrumbs(originX: number, originY: number, originZ: number, count: number, speed: number): void {
    let spawned = 0;
    for (let i = 0; i < this.crumbs.length && spawned < count; i++) {
      const c = this.crumbs[i];
      if (c.active) continue;
      c.active = true;
      c.life = 0;
      c.maxLife = 0.38 + Math.random() * 0.34;
      c.pos.set(
        originX + (Math.random() - 0.5) * 0.42,
        originY + Math.random() * 0.14,
        originZ + (Math.random() - 0.5) * 0.42,
      );
      const a = Math.random() * Math.PI * 2;
      const horiz = (0.35 + Math.random() * 0.85) * speed;
      c.vel.set(Math.cos(a) * horiz, 1.3 + Math.random() * speed, Math.sin(a) * horiz);
      c.rot.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      c.scale = 0.72 + Math.random() * 0.88;
      spawned++;
    }
  }

  private spawnSteam(originX: number, originY: number, originZ: number): void {
    for (let i = 0; i < this.steamParticles.length; i++) {
      const s = this.steamParticles[i];
      if (s.active) continue;
      s.active = true;
      s.life = 0;
      s.maxLife = 1.4 + Math.random() * 0.9;
      s.pos.set(originX + (Math.random() - 0.5) * 0.85, originY, originZ + (Math.random() - 0.5) * 0.85);
      s.vel.set((Math.random() - 0.5) * 0.25, 0.65 + Math.random() * 0.45, (Math.random() - 0.5) * 0.25);
      s.scale = 0.65 + Math.random() * 0.6;
      break;
    }
  }

  private updateCamera(dt: number): void {
    const aspect = this.camera.aspect;
    const portraitBoost = aspect < 0.85 ? (0.85 - aspect) * 4.4 : 0;

    if (this.mode === 'title') {
      const driftX = Math.sin(this.elapsed * 0.38) * 0.22;
      _targetCamPos.set(driftX, 2.9 + portraitBoost * 0.35, 4.35 + portraitBoost);
      _targetLookAt.set(0, 0.78 - portraitBoost * 0.12, -0.1);
    } else if (this.mode === 'prep' || this.mode === 'prep-summary' || this.mode === 'blitz') {
      // Elevated top-3/4 angle so player clearly reads the dashed perfect cut lines on the ingredient!
      _targetCamPos.set(0.15, 3.1 + portraitBoost * 0.32, 3.55 + portraitBoost * 0.85);
      _targetLookAt.set(0, 0.88, -0.05);
    } else if (this.mode === 'cook') {
      // Framed to show the cast-iron wok, flames, both chef hands AND the front gas stove rotary knob!
      _targetCamPos.set(WOK_X + 0.18, 3.35 + portraitBoost * 0.35, 4.45 + portraitBoost * 0.95);
      _targetLookAt.set(WOK_X + 0.1, 0.74, WOK_Z + 0.22);
    } else {
      const orbitX = Math.sin(this.elapsed * 0.55) * 0.55;
      _targetCamPos.set(orbitX, 2.55 + portraitBoost * 0.25, 3.45 + portraitBoost * 0.85);
      _targetLookAt.set(0, 0.76, 0);
    }

    const dampFactor = 6.5;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _targetCamPos.x, dampFactor, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _targetCamPos.y, dampFactor, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _targetCamPos.z, dampFactor, dt);

    _currentLookAt.x = THREE.MathUtils.damp(_currentLookAt.x, _targetLookAt.x, dampFactor, dt);
    _currentLookAt.y = THREE.MathUtils.damp(_currentLookAt.y, _targetLookAt.y, dampFactor, dt);
    _currentLookAt.z = THREE.MathUtils.damp(_currentLookAt.z, _targetLookAt.z, dampFactor, dt);

    let sx = 0;
    let sy = 0;
    if (this.shakeIntensity > 0.001) {
      sx = (Math.random() - 0.5) * this.shakeIntensity;
      sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = THREE.MathUtils.damp(this.shakeIntensity, 0, 16, dt);
    }

    this.camera.lookAt(_currentLookAt.x + sx, _currentLookAt.y + sy, _currentLookAt.z);
  }

  private updateChoppingAnimations(dt: number): void {
    this.ingredientPivot.rotation.y = THREE.MathUtils.damp(
      this.ingredientPivot.rotation.y,
      this.targetIngredientRotY,
      11,
      dt,
    );

    this.ingredientSquash = THREE.MathUtils.damp(this.ingredientSquash, 0, 18, dt);
    const sy = 1 - this.ingredientSquash;
    const sxz = 1 + this.ingredientSquash * 0.45;
    this.ingredientPivot.scale.set(sxz, sy, sxz);

    // Precision sweep in Prep mode vs direct progression in Blitz/Title
    if (this.mode === 'prep' && this.prepGuideActive) {
      this.prepSweepPhase += dt * this.prepSweepSpeed;
      // Gentle rhythmic oscillation centered right on the golden perfect guide line
      const offset = Math.sin(this.prepSweepPhase) * 0.115;
      this.prepCurrentRatio = THREE.MathUtils.clamp(this.prepTargetRatio + offset, 0.04, 0.96);
      const targetX = this.ratioToWorldX(this.prepCurrentRatio);
      this.cleaverProgressX = THREE.MathUtils.damp(this.cleaverProgressX, targetX, 20, dt);

      // Update 3D sightline color: turns bright emerald-gold when dead-on the perfect line!
      const err = Math.abs(this.prepCurrentRatio - this.prepTargetRatio);
      this.bladeSightLine.visible = true;
      this.bladeSightLine.position.set(this.cleaverProgressX, 0.57 + this.ingredientTopY, 0);
      this.bladeSightMat.color.set(err < 0.036 ? '#4ADE80' : '#FDE68A');
    } else {
      const targetX = this.ratioToWorldX(this.prepTargetRatio);
      this.cleaverProgressX = THREE.MathUtils.damp(this.cleaverProgressX, targetX, 14, dt);
      this.bladeSightLine.visible = false;
    }

    if (this.cleaverStrikeAnim > 0) {
      this.cleaverStrikeAnim = Math.max(0, this.cleaverStrikeAnim - dt * 8.2);
    }

    const idleHover = Math.sin(this.elapsed * 2.4) * 0.03;
    const strikeDrop = Math.sin(this.cleaverStrikeAnim * Math.PI) * 0.64;
    const strikePitch = Math.sin(this.cleaverStrikeAnim * Math.PI) * 0.22;

    if (this.mode === 'title') {
      // Classic showcase horizontal orientation matching Screenshot 1
      this.cleaverGroup.rotation.y = THREE.MathUtils.damp(this.cleaverGroup.rotation.y, -Math.PI * 0.42, 8, dt);
      this.cleaverGroup.position.set(0.25, 1.44 + idleHover, 0.05);
      this.cleaverGroup.rotation.x = 0;
    } else {
      // Active ergonomic cutting angle aligned right onto the dashed vertical cut lines
      this.cleaverGroup.rotation.y = THREE.MathUtils.damp(this.cleaverGroup.rotation.y, 0.08, 12, dt);
      this.cleaverGroup.position.set(this.cleaverProgressX, 1.38 + idleHover - strikeDrop, 0.08);
      this.cleaverGroup.rotation.x = -0.04 + strikePitch;
    }

    this.bladeTrailMat.opacity = this.cleaverStrikeAnim > 0.1 ? this.cleaverStrikeAnim * 0.44 : 0;

    if (this.platingGroup.visible) {
      this.platingGroup.rotation.y += dt * 0.25;
    }
  }

  private updateChefHands(dt: number): void {
    // Decay action choreography timers
    if (this.ingredientPourAnim > 0) {
      this.ingredientPourAnim = Math.max(0, this.ingredientPourAnim - dt * 0.82);
    }
    if (this.knobTurnAnim > 0) {
      this.knobTurnAnim = Math.max(0, this.knobTurnAnim - dt * 1.45);
    }
    if (this.seasoningPourAnim > 0) {
      this.seasoningPourAnim = Math.max(0, this.seasoningPourAnim - dt * 1.15);
    }

    if (this.mode === 'prep' || this.mode === 'blitz') {
      // RIGHT HAND: firmly gripping the cleaver's rosewood handle
      _rhTargetPos.set(
        this.cleaverGroup.position.x + 0.02,
        this.cleaverGroup.position.y + 0.58,
        this.cleaverGroup.position.z + 1.06,
      );
      _rhTargetRot.set(this.cleaverGroup.rotation.x * 0.8, 0.08, -0.18);

      // LEFT HAND: Chinese "cat-claw" guard resting on the left side of the ingredient, sliding back safely
      const safeLeftX = Math.min(this.cleaverProgressX - 0.34, -0.18);
      const liftOnRotate = Math.abs(this.ingredientPivot.rotation.y - this.targetIngredientRotY) * 0.35;
      _lhTargetPos.set(safeLeftX, 0.62 + this.ingredientTopY + liftOnRotate, 0.22);
      _lhTargetRot.set(0.28, -0.32, 0.12);

      this.pourBowlGroup.visible = false;
      this.seasoningPropGroup.visible = false;
      this.wokSpatulaGroup.visible = false;
    } else if (this.mode === 'cook') {
      const tossWave = Math.sin(this.wokTiltAnim * Math.PI);

      // LEFT HAND priority: 1) Turning the 3D stove rotary knob -> 2) Holding wok spatula to stir/toss
      if (this.knobTurnAnim > 0.01) {
        const reach = Math.sin(this.knobTurnAnim * Math.PI);
        _lhTargetPos.set(
          KNOB_WORLD_X - 0.02,
          KNOB_WORLD_Y + 0.26 + (1 - reach) * 0.35,
          KNOB_WORLD_Z + 0.24,
        );
        _lhTargetRot.set(0.55, 0.15, (this.targetKnobAngle - 0.4) * 0.35);
        this.wokSpatulaGroup.visible = false;
      } else {
        const stirX = Math.sin(this.elapsed * (2.2 + this.flameLevel * 0.7)) * 0.16;
        const stirZ = Math.cos(this.elapsed * (2.2 + this.flameLevel * 0.7)) * 0.12;
        _lhTargetPos.set(
          WOK_X - 0.92 + stirX + tossWave * 0.26,
          1.42 + tossWave * 0.28,
          WOK_Z + 0.75 + stirZ - tossWave * 0.22,
        );
        _lhTargetRot.set(0.32 + tossWave * 0.25, -0.52, -0.18);
        this.wokSpatulaGroup.visible = true;
      }

      // RIGHT HAND priority: 1) Pouring prepped bowl of ingredients -> 2) Pouring seasoning bottle/spoon -> 3) Gripping wok handle to toss!
      if (this.ingredientPourAnim > 0.01) {
        const arc = Math.sin(this.ingredientPourAnim * Math.PI);
        _rhTargetPos.set(WOK_X + 0.56, 1.82 + arc * 0.28, WOK_Z + 0.38);
        _rhTargetRot.set(0.1, 0.25, arc * 1.15); // Tip bowl neatly toward wok center
        this.pourBowlGroup.visible = true;
        this.seasoningPropGroup.visible = false;
      } else if (this.seasoningPourAnim > 0.01) {
        const arc = Math.sin(this.seasoningPourAnim * Math.PI);
        const isLiquid = this.seasoningPourKind === 'liquid';
        _rhTargetPos.set(WOK_X + 0.44, 1.76 + arc * 0.18, WOK_Z + 0.34);
        _rhTargetRot.set(isLiquid ? 0.12 : 0.25, 0.18, arc * (isLiquid ? 1.25 : 0.92));
        this.pourBowlGroup.visible = false;
        this.seasoningPropGroup.visible = true;
        this.seasoningBottleMesh.visible = isLiquid;
        this.seasoningSpoonMesh.visible = !isLiquid;
      } else {
        // Gripping the long wooden wok handle on the right side of the wok
        _rhTargetPos.set(
          WOK_X + 1.88,
          1.22 + tossWave * 0.38,
          WOK_Z + 0.16 - tossWave * 0.24,
        );
        _rhTargetRot.set(-0.22 - tossWave * 0.36, 0.88, -0.15);
        this.pourBowlGroup.visible = false;
        this.seasoningPropGroup.visible = false;
      }
    }

    const handSpeed = 14;
    this.leftHand.position.x = THREE.MathUtils.damp(this.leftHand.position.x, _lhTargetPos.x, handSpeed, dt);
    this.leftHand.position.y = THREE.MathUtils.damp(this.leftHand.position.y, _lhTargetPos.y, handSpeed, dt);
    this.leftHand.position.z = THREE.MathUtils.damp(this.leftHand.position.z, _lhTargetPos.z, handSpeed, dt);
    this.leftHand.rotation.x = THREE.MathUtils.damp(this.leftHand.rotation.x, _lhTargetRot.x, handSpeed, dt);
    this.leftHand.rotation.y = THREE.MathUtils.damp(this.leftHand.rotation.y, _lhTargetRot.y, handSpeed, dt);
    this.leftHand.rotation.z = THREE.MathUtils.damp(this.leftHand.rotation.z, _lhTargetRot.z, handSpeed, dt);

    this.rightHand.position.x = THREE.MathUtils.damp(this.rightHand.position.x, _rhTargetPos.x, handSpeed, dt);
    this.rightHand.position.y = THREE.MathUtils.damp(this.rightHand.position.y, _rhTargetPos.y, handSpeed, dt);
    this.rightHand.position.z = THREE.MathUtils.damp(this.rightHand.position.z, _rhTargetPos.z, handSpeed, dt);
    this.rightHand.rotation.x = THREE.MathUtils.damp(this.rightHand.rotation.x, _rhTargetRot.x, handSpeed, dt);
    this.rightHand.rotation.y = THREE.MathUtils.damp(this.rightHand.rotation.y, _rhTargetRot.y, handSpeed, dt);
    this.rightHand.rotation.z = THREE.MathUtils.damp(this.rightHand.rotation.z, _rhTargetRot.z, handSpeed, dt);
  }

  private updateWokAndFlames(dt: number): void {
    this.wokSauceMat.color.lerp(_targetSauceColor, Math.min(1, dt * 4));

    // Rotate 3D stove knob smoothly to selected flame notch
    this.stoveKnobGroup.rotation.y = THREE.MathUtils.damp(
      this.stoveKnobGroup.rotation.y,
      this.targetKnobAngle,
      14,
      dt,
    );

    const targetFlameScale =
      this.mode !== 'cook' ? 0 : this.flameLevel === 0 ? 0 : this.flameLevel === 1 ? 0.55 : this.flameLevel === 2 ? 0.92 : 1.38;

    const targetLightIntensity =
      this.mode !== 'cook' ? 0.15 : this.flameLevel === 0 ? 0.1 : this.flameLevel === 1 ? 1.1 : this.flameLevel === 2 ? 2.1 : 3.4;
    this.stoveLight.intensity = THREE.MathUtils.damp(this.stoveLight.intensity, targetLightIntensity, 10, dt);

    for (let i = 0; i < this.flameCones.length; i++) {
      const flicker = 0.85 + Math.sin(this.elapsed * 26 + i * 1.9) * 0.18;
      const outer = this.flameCones[i];
      const inner = this.flameInnerCones[i];
      const s = targetFlameScale * flicker;
      outer.scale.x = THREE.MathUtils.damp(outer.scale.x, Math.max(0.001, s), 12, dt);
      outer.scale.y = THREE.MathUtils.damp(outer.scale.y, Math.max(0.001, s * 1.15), 12, dt);
      outer.scale.z = THREE.MathUtils.damp(outer.scale.z, Math.max(0.001, s), 12, dt);

      const is = s * 0.65;
      inner.scale.x = THREE.MathUtils.damp(inner.scale.x, Math.max(0.001, is), 12, dt);
      inner.scale.y = THREE.MathUtils.damp(inner.scale.y, Math.max(0.001, is * 1.2), 12, dt);
      inner.scale.z = THREE.MathUtils.damp(inner.scale.z, Math.max(0.001, is), 12, dt);
    }

    if (this.wokTiltAnim > 0) {
      this.wokTiltAnim = Math.max(0, this.wokTiltAnim - dt * 3.6);
    }
    const tossWave = Math.sin(this.wokTiltAnim * Math.PI);
    this.wokGroup.position.y = 0.4 + tossWave * 0.25;
    this.wokGroup.position.z = -tossWave * 0.18;
    this.wokGroup.rotation.x = -tossWave * 0.27;

    if (this.wokPiecesVisible) {
      const sizzleJitter = Math.max(0, (this.wokTemp - 28) / 72) * 0.025;
      for (let i = 0; i < this.wokPieces.length; i++) {
        const p = this.wokPieces[i];
        if (p.y > 0 || p.vy > 0) {
          p.vy -= 9.8 * dt;
          p.y += p.vy * dt;
          if (p.y < 0) {
            p.y = 0;
            p.vy = 0;
          }
          p.rx += p.rotSpeed * dt;
          p.ry += p.rotSpeed * 0.8 * dt;
        } else {
          p.angle += dt * (0.35 + this.flameLevel * 0.28);
        }

        const hop = Math.abs(Math.sin(this.elapsed * 16 + i * 2.1)) * sizzleJitter;
        const px = Math.cos(p.angle) * p.baseRadius;
        const pz = Math.sin(p.angle) * p.baseRadius;
        const py = p.yOffset + p.y + hop;

        _dummy.position.set(px, py, pz);
        _dummy.rotation.set(p.rx, p.ry + p.angle, 0.2);
        _dummy.scale.setScalar(p.scale);
        _dummy.updateMatrix();
        this.wokPiecesMesh.setMatrixAt(i, _dummy.matrix);
      }
      this.wokPiecesMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.mode === 'cook' && this.wokTemp > 38) {
      const isOverheat = this.wokTemp > 86;
      this.steamMat.color.set(isOverheat ? '#463F3B' : '#F6EFE6');
      this.steamMat.opacity = isOverheat ? 0.42 : 0.24;
      this.steamSpawnAcc += dt * (isOverheat ? 9 : 4.5);
      while (this.steamSpawnAcc >= 1) {
        this.steamSpawnAcc -= 1;
        this.spawnSteam(WOK_X, 0.74, WOK_Z);
      }
    } else if (this.mode === 'result') {
      this.steamMat.color.set('#F9F3EA');
      this.steamMat.opacity = 0.22;
      this.steamSpawnAcc += dt * 3.5;
      while (this.steamSpawnAcc >= 1) {
        this.steamSpawnAcc -= 1;
        this.spawnSteam(0, 0.96, 0);
      }
    }
  }

  private updateParticles(dt: number): void {
    let crumbsDirty = false;
    for (let i = 0; i < this.crumbs.length; i++) {
      const c = this.crumbs[i];
      if (!c.active) continue;
      crumbsDirty = true;
      c.life += dt;
      if (c.life >= c.maxLife) {
        c.active = false;
        _dummy.position.set(0, -10, 0);
        _dummy.scale.setScalar(0.0001);
      } else {
        c.vel.y -= 9.5 * dt;
        c.pos.addScaledVector(c.vel, dt);
        c.rot.x += dt * 8;
        c.rot.y += dt * 6;
        const fade = 1 - c.life / c.maxLife;
        _dummy.position.copy(c.pos);
        _dummy.rotation.set(c.rot.x, c.rot.y, c.rot.z);
        _dummy.scale.setScalar(c.scale * fade);
      }
      _dummy.updateMatrix();
      this.crumbsMesh.setMatrixAt(i, _dummy.matrix);
    }
    if (crumbsDirty) {
      this.crumbsMesh.instanceMatrix.needsUpdate = true;
    }

    let steamDirty = false;
    for (let i = 0; i < this.steamParticles.length; i++) {
      const s = this.steamParticles[i];
      if (!s.active) continue;
      steamDirty = true;
      s.life += dt;
      if (s.life >= s.maxLife) {
        s.active = false;
        _dummy.position.set(0, -10, 0);
        _dummy.scale.setScalar(0.0001);
      } else {
        const progress = s.life / s.maxLife;
        s.pos.addScaledVector(s.vel, dt);
        s.pos.x += Math.sin(this.elapsed * 2 + i) * dt * 0.16;
        const sizeCurve = Math.sin(progress * Math.PI) * (0.7 + progress * 1.1);
        _dummy.position.copy(s.pos);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.setScalar(Math.max(0.001, s.scale * sizeCurve));
      }
      _dummy.updateMatrix();
      this.steamMesh.setMatrixAt(i, _dummy.matrix);
    }
    if (steamDirty) {
      this.steamMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    if (!this.contextLost) {
      this.elapsed += dt;

      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      } else {
        this.updateChoppingAnimations(dt);
        this.updateWokAndFlames(dt);
        this.updateChefHands(dt);
        this.updateParticles(dt);
      }
      this.updateCamera(dt);
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });

    this.texturesToDispose.forEach((t) => t.dispose());
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
