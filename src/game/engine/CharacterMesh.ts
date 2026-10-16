import * as THREE from 'three';
import { CharacterAppearance } from '@/types/game';
import { normalizeCharacterAppearance } from '@/integrations/character/CharacterAppearance';

export class CharacterMesh {
  public group: THREE.Group;
  
  // Materials that can be dynamically recolored
  private shirtMat: THREE.MeshStandardMaterial;
  private trouserMat: THREE.MeshStandardMaterial;
  private skinMat: THREE.MeshStandardMaterial;
  private shoesMat: THREE.MeshStandardMaterial;
  private accessoryGroup: THREE.Group;
  
  // Limb parts for procedural animation
  private torso: THREE.Mesh;
  private head: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  
  // State
  private animState: 'idle' | 'aiming' | 'throw' | 'celebrate' | 'disappointed' = 'idle';
  private animTimer = 0;
  private throwProgress = 0;

  constructor(initialAppearance?: CharacterAppearance) {
    this.group = new THREE.Group();
    const config = normalizeCharacterAppearance(initialAppearance);

    // Initialize materials
    this.shirtMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.shirtColor),
      roughness: 0.5,
    });
    this.trouserMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.trouserColor),
      roughness: 0.6,
    });
    this.skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.skinColor),
      roughness: 0.7,
    });
    this.shoesMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.shoesColor),
      roughness: 0.4,
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    this.torso = new THREE.Mesh(torsoGeo, this.shirtMat);
    this.torso.position.y = 1.35;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // 2. Head & Face
    this.head = new THREE.Group();
    this.head.position.y = 2.05;

    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const headMesh = new THREE.Mesh(headGeo, this.skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x102f3a });
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.14, 0.06, 0.28);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.14, 0.06, 0.28);
    this.head.add(rightEye);

    // Cheerful Smile
    const smileMat = new THREE.MeshBasicMaterial({ color: 0xc92c47 });
    const smileGeo = new THREE.BoxGeometry(0.18, 0.04, 0.03);
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.position.set(0, -0.12, 0.28);
    this.head.add(smile);

    // Accessory slot
    this.accessoryGroup = new THREE.Group();
    this.head.add(this.accessoryGroup);
    this.group.add(this.head);

    // 3. Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.22);

    // Right Arm (Throwing arm)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.48, 1.7, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, this.shirtMat);
    rightArmMesh.position.y = -0.32;
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);

    // Right Hand
    const handGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const rightHand = new THREE.Mesh(handGeo, this.skinMat);
    rightHand.position.y = -0.72;
    this.rightArm.add(rightHand);
    this.group.add(this.rightArm);

    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.48, 1.7, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, this.shirtMat);
    leftArmMesh.position.y = -0.32;
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);

    const leftHand = new THREE.Mesh(handGeo, this.skinMat);
    leftHand.position.y = -0.72;
    this.leftArm.add(leftHand);
    this.group.add(this.leftArm);

    // 4. Legs & Shoes
    const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.26);
    const shoeGeo = new THREE.BoxGeometry(0.27, 0.18, 0.42);

    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.85, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.trouserMat);
    leftLegMesh.position.y = -0.38;
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);

    const leftShoe = new THREE.Mesh(shoeGeo, this.shoesMat);
    leftShoe.position.set(0, -0.78, 0.08);
    leftShoe.castShadow = true;
    this.leftLeg.add(leftShoe);
    this.group.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.2, 0.85, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.trouserMat);
    rightLegMesh.position.y = -0.38;
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(shoeGeo, this.shoesMat);
    rightShoe.position.set(0, -0.78, 0.08);
    rightShoe.castShadow = true;
    this.rightLeg.add(rightShoe);
    this.group.add(this.rightLeg);

    this.updateAppearance(config);
  }

  updateAppearance(appearance: CharacterAppearance) {
    const config = normalizeCharacterAppearance(appearance);
    this.shirtMat.color.set(config.shirtColor);
    this.trouserMat.color.set(config.trouserColor);
    this.skinMat.color.set(config.skinColor);
    this.shoesMat.color.set(config.shoesColor);

    // Update Accessory
    while (this.accessoryGroup.children.length > 0) {
      this.accessoryGroup.remove(this.accessoryGroup.children[0]);
    }

    if (config.accessoryId === 'headband') {
      const bandGeo = new THREE.BoxGeometry(0.58, 0.12, 0.58);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xffe85a, roughness: 0.3 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.18;
      this.accessoryGroup.add(band);
    } else if (config.accessoryId === 'cap') {
      const capGeo = new THREE.BoxGeometry(0.58, 0.16, 0.58);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x08bfe8, roughness: 0.4 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.28;
      
      const visorGeo = new THREE.BoxGeometry(0.56, 0.06, 0.3);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, 0.22, 0.38);
      this.accessoryGroup.add(cap, visor);
    } else if (config.accessoryId === 'glasses') {
      const frameGeo = new THREE.BoxGeometry(0.48, 0.12, 0.06);
      const frameMat = new THREE.MeshBasicMaterial({ color: 0x102f3a });
      const glasses = new THREE.Mesh(frameGeo, frameMat);
      glasses.position.set(0, 0.06, 0.3);
      this.accessoryGroup.add(glasses);
    }
  }

  setAnimationState(state: 'idle' | 'aiming' | 'throw' | 'celebrate' | 'disappointed') {
    this.animState = state;
    if (state === 'throw') {
      this.throwProgress = 0;
    }
  }

  update(delta: number) {
    this.animTimer += delta;

    switch (this.animState) {
      case 'idle': {
        const breath = Math.sin(this.animTimer * 2.8) * 0.04;
        this.torso.position.y = 1.35 + breath;
        this.head.position.y = 2.05 + breath;
        this.rightArm.rotation.x = Math.sin(this.animTimer * 2.8) * 0.08;
        this.rightArm.rotation.z = -0.1;
        this.leftArm.rotation.x = -Math.sin(this.animTimer * 2.8) * 0.08;
        this.leftArm.rotation.z = 0.1;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.group.position.y = 0;
        break;
      }
      case 'aiming': {
        // Raise right arm with projectile in hand, left arm balancing
        this.rightArm.rotation.x = -Math.PI * 0.55;
        this.rightArm.rotation.z = -0.25;
        this.leftArm.rotation.x = -Math.PI * 0.25;
        this.leftArm.rotation.z = 0.3;
        const subtleWobble = Math.sin(this.animTimer * 5) * 0.02;
        this.torso.position.y = 1.35 + subtleWobble;
        break;
      }
      case 'throw': {
        this.throwProgress += delta * 4.0;
        if (this.throwProgress < 1.0) {
          // Dynamic forward snap
          this.rightArm.rotation.x = -Math.PI * 0.55 + this.throwProgress * (Math.PI * 0.85);
          this.torso.rotation.x = 0.15 * Math.sin(this.throwProgress * Math.PI);
        } else {
          this.rightArm.rotation.x = 0.2;
          this.animState = 'idle';
        }
        break;
      }
      case 'celebrate': {
        // Hooray bounce & arms high!
        const hop = Math.abs(Math.sin(this.animTimer * 6)) * 0.25;
        this.group.position.y = hop;
        this.rightArm.rotation.x = -Math.PI * 0.85;
        this.rightArm.rotation.z = -0.4;
        this.leftArm.rotation.x = -Math.PI * 0.85;
        this.leftArm.rotation.z = 0.4;
        this.head.rotation.y = Math.sin(this.animTimer * 4) * 0.2;
        break;
      }
      case 'disappointed': {
        this.head.rotation.y = Math.sin(this.animTimer * 5) * 0.25;
        this.torso.position.y = 1.32;
        this.rightArm.rotation.x = 0.1;
        this.leftArm.rotation.x = 0.1;
        break;
      }
    }
  }
}
