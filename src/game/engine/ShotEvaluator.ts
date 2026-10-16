import * as THREE from 'three';

export interface ShotEvaluation {
  success: boolean;
  isSwish: boolean;
  rimHit: boolean;
  offsetDistance: number;
  message: string;
}

export class ShotEvaluator {
  /**
   * Evaluates how close the projectile came to the center of the target hoop rim
   */
  static evaluate(
    impactPosition: THREE.Vector3,
    hoopPosition: THREE.Vector3,
    rimRadius = 0.55
  ): ShotEvaluation {
    const dx = impactPosition.x - hoopPosition.x;
    const dz = impactPosition.z - hoopPosition.z;
    const offset = Math.hypot(dx, dz);

    if (offset <= rimRadius * 0.55) {
      return {
        success: true,
        isSwish: true,
        rimHit: false,
        offsetDistance: offset,
        message: 'Perfect Swish!',
      };
    } else if (offset <= rimRadius * 1.05) {
      return {
        success: true,
        isSwish: false,
        rimHit: true,
        offsetDistance: offset,
        message: 'In off the rim!',
      };
    } else if (offset <= rimRadius * 1.6) {
      return {
        success: false,
        isSwish: false,
        rimHit: true,
        offsetDistance: offset,
        message: 'Off the back rim!',
      };
    } else {
      return {
        success: false,
        isSwish: false,
        rimHit: false,
        offsetDistance: offset,
        message: 'Missed target!',
      };
    }
  }
}
