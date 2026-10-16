import * as THREE from 'three';

export interface TrajectoryPoint {
  position: THREE.Vector3;
  time: number;
}

export class TrajectoryCalculator {
  static readonly GRAVITY = 18.0; // arcade gravity

  /**
   * Calculate parabolic arc points for aiming preview
   */
  static computeTrajectoryPoints(
    start: THREE.Vector3,
    velocity: THREE.Vector3,
    steps = 30,
    timeStep = 0.04
  ): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i * timeStep;
      const x = start.x + velocity.x * t;
      const y = start.y + velocity.y * t - 0.5 * this.GRAVITY * t * t;
      const z = start.z + velocity.z * t;
      
      points.push(new THREE.Vector3(x, y, z));
      if (y < 0.1 && i > 2) {
        break; // Hit ground
      }
    }
    return points;
  }

  /**
   * Computes the initial launch velocity based on player drag input and target
   */
  static computeLaunchVelocity(
    start: THREE.Vector3,
    target: THREE.Vector3,
    dragDx: number, // horizontal offset from pointer drag (-1 to 1)
    dragDy: number, // vertical drag power factor (0 to 1)
    difficultyMultiplier = 1.0
  ): { velocity: THREE.Vector3; flightTime: number } {
    const dx = target.x - start.x;
    const dz = target.z - start.z;
    const horizontalDistance = Math.hypot(dx, dz);
    
    // Base flight time derived from distance
    const baseFlightTime = 0.85 + horizontalDistance * 0.06;
    
    // Apply user power tuning (dragDy adds or subtracts speed)
    const powerScale = 0.75 + dragDy * 0.5 * difficultyMultiplier;
    const flightTime = baseFlightTime / powerScale;

    // Horizontal speed
    const vx = (dx / flightTime) + (dragDx * 3.5);
    const vz = dz / flightTime;

    // Vertical launch speed to reach target height plus arc
    const dy = target.y - start.y;
    const vy = (dy + 0.5 * this.GRAVITY * flightTime * flightTime) / flightTime;

    return {
      velocity: new THREE.Vector3(vx, vy, vz),
      flightTime,
    };
  }

  /**
   * Get position at time t during flight
   */
  static getPositionAtTime(
    start: THREE.Vector3,
    velocity: THREE.Vector3,
    t: number
  ): THREE.Vector3 {
    return new THREE.Vector3(
      start.x + velocity.x * t,
      start.y + velocity.y * t - 0.5 * this.GRAVITY * t * t,
      start.z + velocity.z * t
    );
  }
}
