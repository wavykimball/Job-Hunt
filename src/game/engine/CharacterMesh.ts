import * as THREE from 'three';
import { CharacterAppearance } from '@/types/game';
import { normalizeCharacterAppearance } from '@/integrations/character/CharacterAppearance';

const PI = Math.PI;
const V2 = (x: number, y: number) => new THREE.Vector2(x, y);

/**
 * Creates smooth lathe limb capsule geometry matching start.ng
 */
function createLimbGeometry(topRadius: number, botRadius: number, height: number, bulge = 0): THREE.LatheGeometry {
  const points: THREE.Vector2[] = [];
  // Bottom cap
  for (let i = 0; i <= 6; i++) {
    const angle = -PI / 2 + (i / 6) * (PI / 2);
    points.push(V2(Math.max(botRadius * Math.cos(angle), 1e-4), -height + botRadius * Math.sin(angle)));
  }
  // Shaft with optional bulge
  for (let i = 1; i < 10; i++) {
    const d = i / 10;
    points.push(V2(botRadius + (topRadius - botRadius) * d + bulge * Math.sin(PI * d), -height + height * d));
  }
  // Top cap
  for (let i = 0; i <= 6; i++) {
    const angle = (i / 6) * (PI / 2);
    points.push(V2(Math.max(topRadius * Math.cos(angle), 1e-4), topRadius * Math.sin(angle)));
  }
  return new THREE.LatheGeometry(points, 20);
}

/**
 * Creates procedural noisy puff geometry for Afro and puffs
 */
function createPuffGeometry(radius: number, noiseAmp: number): THREE.SphereGeometry {
  const geo = new THREE.SphereGeometry(radius, 40, 30);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const noise = Math.sin(v.x * 140) * Math.sin(v.y * 150) * Math.sin(v.z * 130);
    v.multiplyScalar(1 + noise * noiseAmp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export class CharacterMesh {
  public group: THREE.Group;

  // Root start.ng human hierarchy
  private root: THREE.Group;
  private pelvisGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private torsoMesh: THREE.Mesh | null = null;
  private headGroup: THREE.Group;
  private hairGroup: THREE.Group;
  private hatGroup: THREE.Group;
  private accessoryGroup: THREE.Group;

  // Limbs
  private rightArm: { sh: THREE.Group; elbow: THREE.Group; hand: THREE.Group };
  private leftArm: { sh: THREE.Group; elbow: THREE.Group; hand: THREE.Group };
  private rightLeg: { hip: THREE.Group; knee: THREE.Group };
  private leftLeg: { hip: THREE.Group; knee: THREE.Group };

  // Face elements for blinking & expressions
  private eyeMeshes: THREE.Mesh[] = [];
  private initialEyeScales: number[] = [];
  private eyelidMeshes: THREE.Mesh[] = [];
  private eyebrowMeshes: THREE.Mesh[] = [];
  private smileCorners: THREE.Mesh[] = [];
  private mouthMesh: THREE.Mesh | null = null;
  private hairStrands: THREE.Group[] = [];

  // Materials
  private shirtMat: THREE.MeshStandardMaterial;
  private trouserMat: THREE.MeshStandardMaterial;
  private skinMat: THREE.MeshStandardMaterial;
  private hairMat: THREE.MeshStandardMaterial;
  private shoesMat: THREE.MeshStandardMaterial;
  private lipsMat: THREE.MeshStandardMaterial;

  // State
  private animState: 'idle' | 'aiming' | 'throw' | 'celebrate' | 'disappointed' = 'idle';
  private animTimer = 0;
  private throwProgress = 0;
  private nextBlinkTime = 2.5;
  private pelvisBaseY = 0.91;
  private currentAppearance: CharacterAppearance;

  constructor(initialAppearance?: CharacterAppearance) {
    this.group = new THREE.Group();
    this.root = new THREE.Group();
    this.group.add(this.root);

    const config = normalizeCharacterAppearance(initialAppearance);
    this.currentAppearance = config;

    // Materials
    this.shirtMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.shirtColor),
      roughness: 0.65,
    });
    this.trouserMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.trouserColor),
      roughness: 0.75,
    });
    this.skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.skinColor),
      roughness: 0.55,
    });
    this.hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.hairColor || '#17120f'),
      roughness: 0.8,
    });
    this.shoesMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.shoesColor || '#2a211b'),
      roughness: 0.5,
    });
    this.lipsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.skinColor).multiplyScalar(0.74),
      roughness: 0.4,
    });

    // Initialize groups
    this.pelvisGroup = new THREE.Group();
    this.torsoGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.hairGroup = new THREE.Group();
    this.hatGroup = new THREE.Group();
    this.accessoryGroup = new THREE.Group();

    this.rightArm = { sh: new THREE.Group(), elbow: new THREE.Group(), hand: new THREE.Group() };
    this.leftArm = { sh: new THREE.Group(), elbow: new THREE.Group(), hand: new THREE.Group() };
    this.rightLeg = { hip: new THREE.Group(), knee: new THREE.Group() };
    this.leftLeg = { hip: new THREE.Group(), knee: new THREE.Group() };

    // Build the authentic start.ng 3D human model
    this.buildHumanModel(config);

    // Apply scale to fit court proportions
    this.root.scale.setScalar(1.15);
  }

  private buildHumanModel(config: CharacterAppearance) {
    // Clear any previous hierarchy
    while (this.root.children.length > 0) {
      this.root.remove(this.root.children[0]);
    }
    this.eyeMeshes = [];
    this.initialEyeScales = [];
    this.eyelidMeshes = [];
    this.eyebrowMeshes = [];
    this.smileCorners = [];
    this.hairStrands = [];

    const isFemale = config.body === 'female';
    const R = isFemale ? 0.885 : 0.91;
    this.pelvisBaseY = R;

    // Helper builders
    const addMesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      return mesh;
    };

    const addSphere = (r: number, mat: THREE.Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1): THREE.Mesh => {
      const mesh = addMesh(new THREE.SphereGeometry(r, 24, 18), mat, x, y, z);
      mesh.scale.set(sx, sy, sz);
      return mesh;
    };

    const addGroup = (parent: THREE.Group, x = 0, y = 0, z = 0): THREE.Group => {
      const grp = new THREE.Group();
      grp.position.set(x, y, z);
      parent.add(grp);
      return grp;
    };

    const addLathe = (pts: Array<[number, number]>, mat: THREE.Material, zScale: number): THREE.Mesh => {
      const v2s = pts.map(([x, y]) => V2(Math.max(x, 1e-4), y));
      const mesh = addMesh(new THREE.LatheGeometry(v2s, 32), mat);
      mesh.scale.z = zScale;
      return mesh;
    };

    // 1. Pelvis
    this.pelvisGroup = addGroup(this.root, 0, R, 0);
    const pelvisPts: Array<[number, number]> = isFemale
      ? [[0, -0.1], [0.08, -0.098], [0.135, -0.08], [0.16, -0.04], [0.165, 0], [0.152, 0.05]]
      : [[0, -0.1], [0.08, -0.098], [0.13, -0.08], [0.15, -0.04], [0.152, 0], [0.146, 0.05]];
    this.pelvisGroup.add(addLathe(pelvisPts, this.trouserMat, 0.7));

    // 2. Legs & Shoes
    const upperLegLen = (isFemale ? 0.41 : 0.42) - 0.06;
    const lowerLegLen = isFemale ? 0.395 : 0.405;
    const legSpacing = isFemale ? 0.082 : 0.084;

    // Right Leg (x = 1 in character local)
    const rHip = addGroup(this.pelvisGroup, legSpacing, -0.04, 0);
    rHip.add(addMesh(createLimbGeometry(isFemale ? 0.09 : 0.086, 0.056, upperLegLen, 0.01), this.trouserMat));
    const rKnee = addGroup(rHip, 0, -upperLegLen, 0);
    rKnee.add(addMesh(createLimbGeometry(0.056, 0.04, lowerLegLen, 0.012), this.trouserMat));
    const rFoot = addGroup(rKnee, 0, -lowerLegLen, 0);
    rFoot.add(addSphere(0.05, this.shoesMat, 0, -0.03, 0.045, 0.95, 0.72, 2.3));
    this.rightLeg = { hip: rHip, knee: rKnee };

    // Left Leg (x = -1 in character local)
    const lHip = addGroup(this.pelvisGroup, -legSpacing, -0.04, 0);
    lHip.add(addMesh(createLimbGeometry(isFemale ? 0.09 : 0.086, 0.056, upperLegLen, 0.01), this.trouserMat));
    const lKnee = addGroup(lHip, 0, -upperLegLen, 0);
    lKnee.add(addMesh(createLimbGeometry(0.056, 0.04, lowerLegLen, 0.012), this.trouserMat));
    const lFoot = addGroup(lKnee, 0, -lowerLegLen, 0);
    lFoot.add(addSphere(0.05, this.shoesMat, 0, -0.03, 0.045, 0.95, 0.72, 2.3));
    this.leftLeg = { hip: lHip, knee: lKnee };

    // 3. Torso
    this.torsoGroup = addGroup(this.pelvisGroup, 0, 0.03, 0);
    const torsoPts: Array<[number, number]> = isFemale
      ? [
          [0.148, -0.05], [0.15, 0], [0.142, 0.06], [0.124, 0.13], [0.116, 0.19],
          [0.126, 0.25], [0.138, 0.31], [0.142, 0.36], [0.14, 0.4], [0.124, 0.44],
          [0.09, 0.47], [0.055, 0.49], [0.045, 0.5]
        ]
      : [
          [0.142, -0.05], [0.144, 0], [0.142, 0.07], [0.14, 0.15], [0.146, 0.23],
          [0.162, 0.31], [0.176, 0.38], [0.176, 0.43], [0.16, 0.475], [0.12, 0.51],
          [0.066, 0.53], [0.052, 0.54]
        ];
    this.torsoMesh = addLathe(torsoPts, this.shirtMat, isFemale ? 0.64 : 0.66);
    this.torsoGroup.add(this.torsoMesh);

    if (isFemale) {
      for (const t of [-1, 1]) {
        this.torsoGroup.add(addSphere(0.058, this.shirtMat, t * 0.056, 0.325, 0.045, 1, 0.88, 0.75));
      }
    }

    // Neck
    const neckTop = isFemale ? 0.6 : 0.645;
    this.torsoGroup.add(
      addLathe(
        [[0.05, neckTop - 0.16], [0.047, neckTop - 0.08], [0.044, neckTop - 0.02], [0.03, neckTop]],
        this.skinMat,
        0.95
      )
    );

    // 4. Arms
    const shoulderY = isFemale ? 0.42 : 0.455;
    const armSpacing = isFemale ? 0.158 : 0.188;

    // Right Arm (x = -1 in start.ng coordinate convention for throwing/waving arm)
    const rSh = addGroup(this.torsoGroup, -armSpacing, shoulderY, 0);
    rSh.add(addSphere(isFemale ? 0.054 : 0.062, this.shirtMat, 0, -0.012, 0, 1, 1, 0.92));
    rSh.add(addMesh(createLimbGeometry(isFemale ? 0.045 : 0.052, 0.037, 0.29, 0.004), this.skinMat));
    rSh.add(addMesh(createLimbGeometry(isFemale ? 0.058 : 0.067, isFemale ? 0.051 : 0.058, 0.11), this.shirtMat));
    const rElbow = addGroup(rSh, 0, -0.29, 0);
    rElbow.add(addMesh(createLimbGeometry(0.037, 0.027, 0.245, 0.006), this.skinMat));
    const rHand = addGroup(rElbow, 0, -0.265, 0.004);
    rHand.add(addSphere(0.029, this.skinMat, 0, -0.03, 0, 1, 1.55, 0.55));
    const rThumb = addSphere(0.012, this.skinMat, 0.022, -0.02, 0.012, 1, 2, 1);
    rThumb.rotation.z = -0.4;
    rHand.add(rThumb);
    this.rightArm = { sh: rSh, elbow: rElbow, hand: rHand };

    // Left Arm (x = 1 in start.ng coordinate convention)
    const lSh = addGroup(this.torsoGroup, armSpacing, shoulderY, 0);
    lSh.add(addSphere(isFemale ? 0.054 : 0.062, this.shirtMat, 0, -0.012, 0, 1, 1, 0.92));
    lSh.add(addMesh(createLimbGeometry(isFemale ? 0.045 : 0.052, 0.037, 0.29, 0.004), this.skinMat));
    lSh.add(addMesh(createLimbGeometry(isFemale ? 0.058 : 0.067, isFemale ? 0.051 : 0.058, 0.11), this.shirtMat));
    const lElbow = addGroup(lSh, 0, -0.29, 0);
    lElbow.add(addMesh(createLimbGeometry(0.037, 0.027, 0.245, 0.006), this.skinMat));
    const lHand = addGroup(lElbow, 0, -0.265, 0.004);
    lHand.add(addSphere(0.029, this.skinMat, 0, -0.03, 0, 1, 1.55, 0.55));
    const lThumb = addSphere(0.012, this.skinMat, -0.022, -0.02, 0.012, 1, 2, 1);
    lThumb.rotation.z = 0.4;
    lHand.add(lThumb);
    this.leftArm = { sh: lSh, elbow: lElbow, hand: lHand };

    // 5. Head & Facial Features
    const headY = isFemale ? 0.672 : 0.718;
    this.headGroup = addGroup(this.torsoGroup, 0, headY, 0);
    this.headGroup.scale.setScalar(1.05);

    const skullScale = isFemale ? 0.84 : 0.88;
    // Skull & Jaw
    this.headGroup.add(addSphere(0.1, this.skinMat, 0, 0, 0, skullScale, 1.13, 1));
    this.headGroup.add(addSphere(0.07, this.skinMat, 0, -0.05, 0.016, isFemale ? 0.9 : 1, 0.74, 0.95));

    // Eyes, Brows, Ears
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf4efe7, roughness: 0.25 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.15 });

    for (const t of [-1, 1]) {
      // Ears
      this.headGroup.add(addSphere(0.022, this.skinMat, t * 0.087 * (skullScale / 0.88), -0.005, -0.004, 0.45, 1, 0.75));

      // Sclera & Pupil
      const sclera = addSphere(0.0145, eyeWhiteMat, t * 0.034, 0.012, 0.082, 1.3, 0.75, 0.6);
      const pupil = addSphere(0.0085, pupilMat, t * 0.034, 0.012, 0.09);
      this.headGroup.add(sclera, pupil);
      this.eyeMeshes.push(sclera, pupil);
      this.initialEyeScales.push(sclera.scale.y, pupil.scale.y);

      // Eyelid
      const eyelid = addSphere(0.016, this.skinMat, t * 0.034, 0.02, 0.08, 1.35, 0.5, 0.7);
      this.headGroup.add(eyelid);
      this.eyelidMeshes.push(eyelid);

      // Eyebrows
      const brow = addSphere(0.018, this.hairMat, t * 0.036, 0.04, 0.088, 1.25, isFemale ? 0.22 : 0.32, 0.4);
      brow.rotation.z = t * (isFemale ? -0.18 : -0.06);
      this.headGroup.add(brow);
      this.eyebrowMeshes.push(brow);
    }

    // Nose
    this.headGroup.add(addSphere(0.016, this.skinMat, 0, -0.01, 0.098, 0.85, 1.5, 1.1));
    this.headGroup.add(addSphere(0.012, this.skinMat, 0, -0.028, 0.104, 1.2, 0.7, 0.9));

    // Mouth / Lips
    const mouthZ = config.accessory === 'beard' ? 0.096 : 0.09;
    this.headGroup.add(addSphere(0.019, this.lipsMat, 0, -0.045, mouthZ, 1, 0.3, 0.55));
    this.mouthMesh = addSphere(0.017, this.lipsMat, 0, -0.054, mouthZ - 0.002, 1, 0.35, 0.55);
    this.headGroup.add(this.mouthMesh);

    // Cheerful smile corners
    this.smileCorners = [-1, 1].map((t) => {
      const corner = addSphere(0.008, this.lipsMat, t * 0.02, -0.053, mouthZ - 0.006, 1.8, 0.35, 0.6);
      corner.rotation.z = t * 0.75;
      this.headGroup.add(corner);
      return corner;
    });

    // 6. Hair
    this.hairGroup = addGroup(this.headGroup);
    const hairStyle = config.hair || 'afro';

    if (hairStyle !== 'bald') {
      const baseHairGeo = new THREE.SphereGeometry(0.106, 32, 16, 0, 2 * PI, 0, PI * 0.5);
      const baseHair = addMesh(baseHairGeo, this.hairMat, 0, 0.012, -0.012);
      baseHair.scale.set(skullScale + 0.02, 1.15, 1.03);
      baseHair.rotation.x = -0.42;
      this.hairGroup.add(baseHair);
    }

    if (hairStyle === 'afro') {
      // Signature start.ng Afro mesh
      const afro = addMesh(createPuffGeometry(0.16, 0.035), this.hairMat, 0, 0.06, -0.065);
      afro.scale.set(1.02, 0.9, 0.85);
      this.hairGroup.add(afro);
    } else if (hairStyle === 'bun') {
      this.hairGroup.add(addMesh(createPuffGeometry(0.052, 0.03), this.hairMat, 0, 0.11, -0.075));
    } else if (hairStyle === 'ponytail') {
      const pony = addGroup(this.hairGroup, 0, 0.03, -0.1);
      pony.add(addSphere(0.026, this.hairMat));
      const strand = addMesh(createLimbGeometry(0.04, 0.016, 0.26, 0.01), this.hairMat);
      strand.rotation.x = 0.15;
      pony.add(strand);
      this.hairStrands.push(pony);
    } else if (hairStyle === 'braids' || hairStyle === 'dreads') {
      const isBraids = hairStyle === 'braids';
      const count = isBraids ? 16 : 18;
      const len = isBraids ? 0.34 : 0.21;
      for (let r = 0; r < count; r++) {
        const angle = PI * 0.1 + (r / (count - 1)) * PI * 0.8;
        const strandGroup = addGroup(
          this.hairGroup,
          Math.cos(angle) * 0.086 * (skullScale / 0.88),
          0.02,
          -Math.sin(angle) * 0.09
        );
        strandGroup.rotation.z = Math.cos(angle) * 0.12;
        strandGroup.rotation.x = -0.08;
        strandGroup.add(
          addMesh(
            createLimbGeometry(isBraids ? 0.011 : 0.014, isBraids ? 0.008 : 0.012, len),
            this.hairMat
          )
        );
        this.hairStrands.push(strandGroup);
      }
    }

    // 7. Hats & Headwear
    this.hatGroup = addGroup(this.headGroup);
    const hatStyle = config.hat || 'none';
    const hatOffset = hairStyle === 'afro' ? 0.075 : 0;

    if (hatStyle === 'cap' || config.accessoryId === 'cap') {
      const capDome = addMesh(new THREE.SphereGeometry(0.112, 32, 12, 0, 2 * PI, 0, PI / 2), this.shirtMat, 0, 0.018, -0.006);
      capDome.scale.set(skullScale + 0.05, 1.18, 1.08);
      this.hatGroup.add(capDome);

      const visor = addMesh(new THREE.CylinderGeometry(0.075, 0.075, 0.008, 24, 1, false, -PI / 2, PI), this.shirtMat, 0, 0.03, 0.085);
      visor.scale.set(1, 1, 0.9);
      visor.rotation.x = 0.12;
      this.hatGroup.add(visor);
    } else if (hatStyle === 'beanie') {
      const beanieDome = addMesh(new THREE.SphereGeometry(0.114, 32, 14, 0, 2 * PI, 0, PI / 2), this.shirtMat, 0, 0.022, -0.004);
      beanieDome.scale.set(skullScale + 0.05, 1.05, 1.07);
      this.hatGroup.add(beanieDome);

      const cuff = addMesh(new THREE.TorusGeometry(0.1, 0.02, 12, 32), this.trouserMat, 0, 0.03, -0.004);
      cuff.rotation.x = PI / 2;
      cuff.scale.set(skullScale + 0.06, 1.08, 1);
      this.hatGroup.add(cuff);
      this.hatGroup.add(addMesh(createPuffGeometry(0.03, 0.06), this.shirtMat, 0, 0.152, -0.01));
    } else if (hatStyle === 'tophat') {
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1a18, roughness: 0.45 });
      const thGroup = addGroup(this.hatGroup, 0, 0.1 + hatOffset, -0.005);
      thGroup.rotation.z = -0.08;
      thGroup.add(addMesh(new THREE.CylinderGeometry(0.135, 0.135, 0.012, 32), darkMat));
      thGroup.add(addMesh(new THREE.CylinderGeometry(0.085, 0.092, 0.17, 32), darkMat, 0, 0.09, 0));
      thGroup.add(addMesh(new THREE.CylinderGeometry(0.094, 0.094, 0.03, 32), this.shirtMat, 0, 0.025, 0));
    } else if (hatStyle === 'crown') {
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8b84a, metalness: 0.85, roughness: 0.28 });
      const crGroup = addGroup(this.hatGroup, 0, 0.1 + hatOffset, -0.005);
      crGroup.add(addMesh(new THREE.CylinderGeometry(0.085, 0.08, 0.05, 32, 1, true), goldMat));
      for (let c = 0; c < 6; c++) {
        const angle = (c / 6) * PI * 2;
        crGroup.add(addMesh(new THREE.ConeGeometry(0.018, 0.05, 12), goldMat, Math.sin(angle) * 0.08, 0.045, Math.cos(angle) * 0.08));
        crGroup.add(addSphere(0.007, goldMat, Math.sin(angle) * 0.08, 0.072, Math.cos(angle) * 0.08));
      }
      const rubyMat = new THREE.MeshStandardMaterial({ color: 0xd6263b, metalness: 0.2, roughness: 0.15 });
      crGroup.add(addMesh(new THREE.SphereGeometry(0.012, 8, 8), rubyMat, 0, 0.005, 0.086));
    } else if (config.accessoryId === 'headband') {
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xffe85a, roughness: 0.3 });
      const band = addMesh(new THREE.TorusGeometry(0.108, 0.014, 12, 32), bandMat, 0, 0.02, 0.01);
      band.rotation.x = PI / 2;
      this.hatGroup.add(band);
    }

    // 8. Accessories (Beard, Glasses, Earrings, Scarf, Backpack)
    this.accessoryGroup = addGroup(this.headGroup);
    const acc = config.accessory || 'none';

    if (acc === 'beard') {
      const beardGeo = new THREE.SphereGeometry(0.104, 32, 16, 0, 2 * PI, PI * 0.66, PI * 0.34);
      const beard = addMesh(beardGeo, this.hairMat, 0, -0.008, 0.006);
      beard.scale.set(skullScale + 0.02, 1.12, 1.02);
      this.accessoryGroup.add(beard);
      this.accessoryGroup.add(addSphere(0.03, this.hairMat, 0, -0.035, 0.088, 1.3, 0.35, 0.5));
    }

    if (acc === 'glasses' || config.accessoryId === 'glasses') {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x1d1b19, metalness: 0.4, roughness: 0.35 });
      for (const t of [-1, 1]) {
        this.accessoryGroup.add(addMesh(new THREE.TorusGeometry(0.024, 0.0042, 10, 24), frameMat, t * 0.035, 0.012, 0.1));
        this.accessoryGroup.add(addMesh(new THREE.BoxGeometry(0.004, 0.004, 0.1), frameMat, t * 0.083 * (skullScale / 0.88), 0.014, 0.05));
      }
      this.accessoryGroup.add(addMesh(new THREE.TorusGeometry(0.011, 0.0035, 8, 16, PI), frameMat, 0, 0.014, 0.102));
    }

    if (acc === 'earrings') {
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8b84a, metalness: 0.85, roughness: 0.25 });
      for (const t of [-1, 1]) {
        this.accessoryGroup.add(addMesh(new THREE.TorusGeometry(0.012, 0.0032, 10, 20), goldMat, t * 0.086 * (skullScale / 0.88), -0.04, 0.004));
      }
    }

    if (acc === 'scarf') {
      const scarfMat = new THREE.MeshStandardMaterial({ color: 0xc8442f, roughness: 0.9 });
      const loop = addMesh(new THREE.TorusGeometry(0.066, 0.03, 14, 28), scarfMat, 0, neckTop - 0.13, 0.005);
      loop.rotation.x = PI / 2 - 0.15;
      loop.scale.set(1.08, 0.85, 1);
      this.torsoGroup.add(loop);

      const tail = addMesh(new THREE.CapsuleGeometry(0.026, 0.16, 6, 12), scarfMat, 0.06, neckTop - 0.25, 0.08);
      tail.scale.z = 0.45;
      tail.rotation.z = 0.08;
      this.torsoGroup.add(tail);
    }

    if (acc === 'backpack') {
      const leatherMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.65 });
      const pocketMat = new THREE.MeshStandardMaterial({ color: 0x57391f, roughness: 0.65 });
      const packZ = isFemale ? -0.1 : -0.115;

      const mainPack = addMesh(new THREE.CapsuleGeometry(0.11, 0.12, 8, 16), leatherMat, 0, 0.3, packZ - 0.06);
      mainPack.scale.set(1.15, 1, 0.55);
      this.torsoGroup.add(mainPack);

      const frontPocket = addMesh(new THREE.CapsuleGeometry(0.07, 0.03, 6, 14), pocketMat, 0, 0.22, packZ - 0.12);
      frontPocket.scale.set(1.2, 1, 0.35);
      this.torsoGroup.add(frontPocket);

      for (const t of [-1, 1]) {
        const strap = addMesh(new THREE.CapsuleGeometry(0.012, 0.32, 4, 8), leatherMat, t * 0.085, 0.29, isFemale ? 0.082 : 0.093);
        strap.scale.x = 1.6;
        strap.rotation.x = -0.12;
        this.torsoGroup.add(strap);
      }
    }
  }

  public updateAppearance(appearance: CharacterAppearance) {
    const config = normalizeCharacterAppearance(appearance);
    this.currentAppearance = config;

    this.shirtMat.color.set(config.shirtColor);
    this.trouserMat.color.set(config.trouserColor);
    this.skinMat.color.set(config.skinColor);
    this.hairMat.color.set(config.hairColor || '#17120f');
    this.shoesMat.color.set(config.shoesColor || '#2a211b');
    this.lipsMat.color.set(new THREE.Color(config.skinColor).multiplyScalar(0.74));

    // Rebuild human model if structural properties changed
    this.buildHumanModel(config);
  }

  public setAnimationState(state: 'idle' | 'aiming' | 'throw' | 'celebrate' | 'disappointed') {
    this.animState = state;
    if (state === 'throw') {
      this.throwProgress = 0;
    }
  }

  public update(delta: number) {
    this.animTimer += delta;
    const t = this.animTimer;

    // 1. Natural start.ng idle breathing & swaying
    const isFemale = this.currentAppearance.body === 'female';
    const sway = Math.sin(t * 0.7);
    this.pelvisGroup.position.x = sway * 0.012;
    this.pelvisGroup.rotation.z = sway * 0.025;
    this.torsoGroup.rotation.z = -sway * 0.03;
    this.torsoGroup.rotation.x = Math.sin(t * 1.5) * 0.01;

    if (this.torsoMesh) {
      this.torsoMesh.scale.y = 1 + Math.sin(t * 1.5) * 0.008;
    }

    this.rightLeg.knee.rotation.x = Math.max(0, sway) * 0.08;
    this.leftLeg.knee.rotation.x = Math.max(0, -sway) * 0.08;
    this.rightLeg.hip.rotation.z = -sway * 0.025;
    this.leftLeg.hip.rotation.z = -sway * 0.025;

    // Head tilt
    const headSway = Math.sin(t * 0.42);
    this.headGroup.rotation.y = Math.sign(headSway) * Math.pow(Math.abs(headSway), 1.6) * 0.35;
    this.headGroup.rotation.x = Math.sin(t * 0.31) * 0.06 - 0.02;
    this.headGroup.rotation.z = sway * 0.02;

    // Hair strands sway
    for (let s = 0; s < this.hairStrands.length; s++) {
      this.hairStrands[s].rotation.x = -0.08 + Math.sin(t * 1.3 + s * 0.3) * 0.04 - this.headGroup.rotation.x;
    }

    // Natural blinking
    const blinkDuration = 0.16;
    if (t > this.nextBlinkTime + blinkDuration) {
      this.nextBlinkTime = t + 2.0 + Math.random() * 3.5;
    }
    const isBlinking = t > this.nextBlinkTime && t < this.nextBlinkTime + blinkDuration;
    const blinkProgress = isBlinking ? Math.sin(((t - this.nextBlinkTime) / blinkDuration) * PI) : 0;

    this.eyeMeshes.forEach((mesh, idx) => {
      mesh.scale.y = this.initialEyeScales[idx] * (1 - 0.9 * blinkProgress);
    });
    this.eyelidMeshes.forEach((mesh) => {
      mesh.position.y = 0.02 - 0.007 * blinkProgress;
    });

    // 2. Action states (aiming, throw, celebrate, disappointed)
    const armRestZ = isFemale ? 0.1 : 0.13;

    switch (this.animState) {
      case 'idle': {
        this.group.position.y = 0;
        this.pelvisGroup.position.y = this.pelvisBaseY;

        // Subtle idle arm swing
        this.rightArm.sh.rotation.z = -(armRestZ + Math.sin(t * 1.5) * 0.015);
        this.rightArm.sh.rotation.x = Math.sin(t * 0.7) * 0.05;
        this.rightArm.elbow.rotation.x = -0.14 - Math.sin(t * 0.9) * 0.04;
        this.rightArm.elbow.rotation.z = 0;

        this.leftArm.sh.rotation.z = armRestZ + Math.sin(t * 1.5 + 1) * 0.015;
        this.leftArm.sh.rotation.x = Math.sin(t * 0.7 + PI) * 0.05;
        this.leftArm.elbow.rotation.x = -0.14 - Math.sin(t * 0.9 + 1) * 0.04;
        this.leftArm.elbow.rotation.z = 0;

        if (this.mouthMesh) this.mouthMesh.scale.x = 1.0;
        this.smileCorners.forEach((c) => { c.visible = true; });
        break;
      }

      case 'aiming': {
        // Player brings throwing arm (right arm) into basketball shooting pocket
        this.rightArm.sh.rotation.x = -PI * 0.52;
        this.rightArm.sh.rotation.z = -0.35;
        this.rightArm.elbow.rotation.x = 0.65;
        this.rightArm.elbow.rotation.z = -0.15;

        // Left arm balances
        this.leftArm.sh.rotation.x = -PI * 0.28;
        this.leftArm.sh.rotation.z = 0.45;
        this.leftArm.elbow.rotation.x = 0.35;

        // Body gathers
        this.torsoGroup.rotation.x = -0.06;
        this.headGroup.rotation.x = 0.12;
        break;
      }

      case 'throw': {
        this.throwProgress += delta * 4.0;
        if (this.throwProgress < 1.0) {
          // Dynamic snap forward towards hoop
          const p = this.throwProgress;
          this.rightArm.sh.rotation.x = -PI * 0.52 + p * (PI * 0.85);
          this.rightArm.sh.rotation.z = -0.35 + p * 0.15;
          this.rightArm.elbow.rotation.x = 0.65 * (1 - p);
          this.torsoGroup.rotation.x = 0.18 * Math.sin(p * PI);
        } else {
          this.animState = 'idle';
        }
        break;
      }

      case 'celebrate': {
        // Hooray bounce & victory arms raised high!
        const hop = Math.abs(Math.sin(t * 7)) * 0.22;
        this.group.position.y = hop;

        this.rightArm.sh.rotation.x = -PI * 0.85;
        this.rightArm.sh.rotation.z = -0.45;
        this.rightArm.elbow.rotation.x = 0.15;

        this.leftArm.sh.rotation.x = -PI * 0.85;
        this.leftArm.sh.rotation.z = 0.45;
        this.leftArm.elbow.rotation.x = 0.15;

        this.headGroup.rotation.y = Math.sin(t * 4) * 0.25;
        this.headGroup.rotation.x = 0.1;
        if (this.mouthMesh) this.mouthMesh.scale.x = 1.35;
        this.smileCorners.forEach((c) => { c.visible = true; });
        break;
      }

      case 'disappointed': {
        this.group.position.y = 0;
        // Head shake
        this.headGroup.rotation.y = Math.sin(t * 5.5) * 0.28;
        this.headGroup.rotation.x = -0.15;
        this.rightArm.sh.rotation.x = 0.12;
        this.leftArm.sh.rotation.x = 0.12;
        if (this.mouthMesh) this.mouthMesh.scale.x = 0.75;
        this.smileCorners.forEach((c) => { c.visible = false; });
        break;
      }
    }
  }
}
