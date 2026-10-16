import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ShotEvaluator } from './ShotEvaluator';

describe('ShotEvaluator', () => {
  const hoopPos = new THREE.Vector3(0, 3.2, -7.5);
  const rimRadius = 0.55;

  it('detects a direct swish when impact is close to hoop center', () => {
    // 0.1 offset from center is well within swish threshold (< rimRadius * 0.55 = ~0.30)
    const impact = new THREE.Vector3(0.08, 3.2, -7.48);
    const result = ShotEvaluator.evaluate(impact, hoopPos, rimRadius);

    expect(result.success).toBe(true);
    expect(result.isSwish).toBe(true);
    expect(result.rimHit).toBe(false);
    expect(result.message).toBe('Perfect Swish!');
  });

  it('detects an off-the-rim made shot when impact is near rim edge', () => {
    // 0.45 offset is between swish and rim radius (0.30 - 0.57)
    const impact = new THREE.Vector3(0.42, 3.2, -7.5);
    const result = ShotEvaluator.evaluate(impact, hoopPos, rimRadius);

    expect(result.success).toBe(true);
    expect(result.isSwish).toBe(false);
    expect(result.rimHit).toBe(true);
  });

  it('detects a clank and miss when impact is just outside rim', () => {
    // 0.70 offset is outside rim radius but within backboard/rim graze zone
    const impact = new THREE.Vector3(0.72, 3.2, -7.5);
    const result = ShotEvaluator.evaluate(impact, hoopPos, rimRadius);

    expect(result.success).toBe(false);
    expect(result.rimHit).toBe(true);
  });

  it('detects a complete miss when impact is far off-target', () => {
    const impact = new THREE.Vector3(2.5, 3.2, -7.5);
    const result = ShotEvaluator.evaluate(impact, hoopPos, rimRadius);

    expect(result.success).toBe(false);
    expect(result.rimHit).toBe(false);
    expect(result.message).toBe('Missed target!');
  });
});
