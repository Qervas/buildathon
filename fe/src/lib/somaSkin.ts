import * as THREE from 'three';

const SOMA_SKIN_MANIFEST_URL = '/models/soma_skin.json';
const SOMA_STANDARD_TPOSE_OFFSETS_URL = '/models/soma_standard_tpose_offsets.json';
const KIMODO_SKIN_TO_BVH_SCALE = 100;

type SomaSectionName =
  | 'bind_vertices'
  | 'faces'
  | 'skin_indices'
  | 'skin_weights'
  | 'bind_rig_transform';

type SomaSkinManifest = {
  version: number;
  counts: {
    vertices: number;
    faces: number;
    joints: number;
  };
  soma_body_height: number;
  joint_names: string[];
  sections: Record<SomaSectionName, { byteOffset: number; byteLength: number }>;
};

type SomaStandardTPoseOffsets = {
  version: number;
  jointCount: number;
  matrices: number[][][];
};

export type SomaSkinAsset = {
  geometry: THREE.BufferGeometry;
  jointNames: string[];
  jointParents: Map<string, string | null>;
  bindMatrices: Map<string, THREE.Matrix4>;
  boneInverses: Map<string, THREE.Matrix4>;
  standardTPoseOffsets: Map<string, THREE.Matrix4>;
};

export type SomaSkinBinding = {
  lineBonePairs: Array<[THREE.Bone, THREE.Bone]>;
  matchedJointCount: number;
  missingJoints: string[];
  skinnedMesh: THREE.SkinnedMesh;
  syncFromSource: () => void;
};

const SOMA_JOINT_ORDER_WITH_PARENTS: Array<[string, string | null]> = [
  ['Hips', null],
  ['Spine1', 'Hips'],
  ['Spine2', 'Spine1'],
  ['Chest', 'Spine2'],
  ['Neck1', 'Chest'],
  ['Neck2', 'Neck1'],
  ['Head', 'Neck2'],
  ['HeadEnd', 'Head'],
  ['Jaw', 'Head'],
  ['LeftEye', 'Head'],
  ['RightEye', 'Head'],
  ['LeftShoulder', 'Chest'],
  ['LeftArm', 'LeftShoulder'],
  ['LeftForeArm', 'LeftArm'],
  ['LeftHand', 'LeftForeArm'],
  ['LeftHandThumb1', 'LeftHand'],
  ['LeftHandThumb2', 'LeftHandThumb1'],
  ['LeftHandThumb3', 'LeftHandThumb2'],
  ['LeftHandThumbEnd', 'LeftHandThumb3'],
  ['LeftHandIndex1', 'LeftHand'],
  ['LeftHandIndex2', 'LeftHandIndex1'],
  ['LeftHandIndex3', 'LeftHandIndex2'],
  ['LeftHandIndex4', 'LeftHandIndex3'],
  ['LeftHandIndexEnd', 'LeftHandIndex4'],
  ['LeftHandMiddle1', 'LeftHand'],
  ['LeftHandMiddle2', 'LeftHandMiddle1'],
  ['LeftHandMiddle3', 'LeftHandMiddle2'],
  ['LeftHandMiddle4', 'LeftHandMiddle3'],
  ['LeftHandMiddleEnd', 'LeftHandMiddle4'],
  ['LeftHandRing1', 'LeftHand'],
  ['LeftHandRing2', 'LeftHandRing1'],
  ['LeftHandRing3', 'LeftHandRing2'],
  ['LeftHandRing4', 'LeftHandRing3'],
  ['LeftHandRingEnd', 'LeftHandRing4'],
  ['LeftHandPinky1', 'LeftHand'],
  ['LeftHandPinky2', 'LeftHandPinky1'],
  ['LeftHandPinky3', 'LeftHandPinky2'],
  ['LeftHandPinky4', 'LeftHandPinky3'],
  ['LeftHandPinkyEnd', 'LeftHandPinky4'],
  ['RightShoulder', 'Chest'],
  ['RightArm', 'RightShoulder'],
  ['RightForeArm', 'RightArm'],
  ['RightHand', 'RightForeArm'],
  ['RightHandThumb1', 'RightHand'],
  ['RightHandThumb2', 'RightHandThumb1'],
  ['RightHandThumb3', 'RightHandThumb2'],
  ['RightHandThumbEnd', 'RightHandThumb3'],
  ['RightHandIndex1', 'RightHand'],
  ['RightHandIndex2', 'RightHandIndex1'],
  ['RightHandIndex3', 'RightHandIndex2'],
  ['RightHandIndex4', 'RightHandIndex3'],
  ['RightHandIndexEnd', 'RightHandIndex4'],
  ['RightHandMiddle1', 'RightHand'],
  ['RightHandMiddle2', 'RightHandMiddle1'],
  ['RightHandMiddle3', 'RightHandMiddle2'],
  ['RightHandMiddle4', 'RightHandMiddle3'],
  ['RightHandMiddleEnd', 'RightHandMiddle4'],
  ['RightHandRing1', 'RightHand'],
  ['RightHandRing2', 'RightHandRing1'],
  ['RightHandRing3', 'RightHandRing2'],
  ['RightHandRing4', 'RightHandRing3'],
  ['RightHandRingEnd', 'RightHandRing4'],
  ['RightHandPinky1', 'RightHand'],
  ['RightHandPinky2', 'RightHandPinky1'],
  ['RightHandPinky3', 'RightHandPinky2'],
  ['RightHandPinky4', 'RightHandPinky3'],
  ['RightHandPinkyEnd', 'RightHandPinky4'],
  ['LeftLeg', 'Hips'],
  ['LeftShin', 'LeftLeg'],
  ['LeftFoot', 'LeftShin'],
  ['LeftToeBase', 'LeftFoot'],
  ['LeftToeEnd', 'LeftToeBase'],
  ['RightLeg', 'Hips'],
  ['RightShin', 'RightLeg'],
  ['RightFoot', 'RightShin'],
  ['RightToeBase', 'RightFoot'],
  ['RightToeEnd', 'RightToeBase'],
];

const CORE_SOMA_JOINTS = [
  'Hips',
  'Spine1',
  'Chest',
  'Head',
  'LeftArm',
  'LeftForeArm',
  'LeftHand',
  'RightArm',
  'RightForeArm',
  'RightHand',
  'LeftLeg',
  'LeftShin',
  'LeftFoot',
  'RightLeg',
  'RightShin',
  'RightFoot',
] as const;

const JOINT_ALIASES: Record<string, string[]> = {
  Hips: ['hips', 'hip', 'pelvis', 'pelvisroot'],
  Spine1: ['spine', 'spine1', 'spine01', 'lowerback'],
  Spine2: ['spine2', 'spine02', 'midspine', 'spineupper'],
  Chest: ['chest', 'spine3', 'spine03', 'upperchest', 'thorax'],
  Neck1: ['neck', 'neck1', 'neck01'],
  Neck2: ['neck2', 'neck02'],
  Head: ['head', 'head1'],
  Jaw: ['jaw', 'chin'],
  LeftEye: ['lefteye', 'leye', 'eyeleft'],
  RightEye: ['righteye', 'reye', 'eyeright'],
  LeftShoulder: ['leftshoulder', 'lshoulder', 'leftcollar', 'lcollar', 'leftclavicle', 'lclavicle'],
  LeftArm: ['leftarm', 'leftupperarm', 'luparm', 'larm', 'lupperarm'],
  LeftForeArm: ['leftforearm', 'leftlowerarm', 'llowerarm', 'lforearm', 'leftelbow'],
  LeftHand: ['lefthand', 'leftwrist', 'lwrist'],
  RightShoulder: ['rightshoulder', 'rshoulder', 'rightcollar', 'rcollar', 'rightclavicle', 'rclavicle'],
  RightArm: ['rightarm', 'rightupperarm', 'ruparm', 'rarm', 'rupperarm'],
  RightForeArm: ['rightforearm', 'rightlowerarm', 'rlowerarm', 'rforearm', 'rightelbow'],
  RightHand: ['righthand', 'rightwrist', 'rwrist'],
  LeftLeg: ['leftleg', 'leftupleg', 'leftupperleg', 'lthigh', 'leftthigh', 'luleg'],
  LeftShin: ['leftshin', 'leftlowerleg', 'leftknee', 'lshin', 'lcalf', 'leftcalf'],
  LeftFoot: ['leftfoot', 'leftankle', 'lankle'],
  LeftToeBase: ['lefttoebase', 'lefttoe', 'leftball', 'ltoe', 'leftforefoot'],
  RightLeg: ['rightleg', 'rightupleg', 'rightupperleg', 'rthigh', 'rightthigh', 'ruleg'],
  RightShin: ['rightshin', 'rightlowerleg', 'rightknee', 'rshin', 'rcalf', 'rightcalf'],
  RightFoot: ['rightfoot', 'rightankle', 'rankle'],
  RightToeBase: ['righttoebase', 'righttoe', 'rightball', 'rtoe', 'rightforefoot'],
};

let somaSkinAssetPromise: Promise<SomaSkinAsset> | null = null;

function stripCommonPrefixes(name: string) {
  return name
    .replace(/^(mixamorig|armature|skeleton|skel|rig|character|avatar|bone|joint|jnt)+/i, '')
    .replace(/^(bip|bip0*1|bip0*01|valvebiped|ccbase|cc_base|m|g)+/i, '');
}

function normalizeJointName(name: string) {
  const leafName = name.split(/[|:.]/).pop() ?? name;
  const stripped = stripCommonPrefixes(leafName);
  return stripped.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getArrayBufferSlice(buffer: ArrayBuffer, byteOffset: number, byteLength: number) {
  return buffer.slice(byteOffset, byteOffset + byteLength);
}

function readFloat32Array(buffer: ArrayBuffer, byteOffset: number, byteLength: number) {
  return new Float32Array(getArrayBufferSlice(buffer, byteOffset, byteLength));
}

function readUint16Array(buffer: ArrayBuffer, byteOffset: number, byteLength: number) {
  return new Uint16Array(getArrayBufferSlice(buffer, byteOffset, byteLength));
}

function readUint32Array(buffer: ArrayBuffer, byteOffset: number, byteLength: number) {
  return new Uint32Array(getArrayBufferSlice(buffer, byteOffset, byteLength));
}

function makeScaledBindMatrix(elements: ArrayLike<number>, offset: number) {
  const matrix = new THREE.Matrix4().fromArray(elements, offset);
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);
  position.multiplyScalar(KIMODO_SKIN_TO_BVH_SCALE);
  return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1));
}

function makeRotationMatrixFromRows(rows: number[][]) {
  const matrix = new THREE.Matrix4();
  matrix.set(
    rows[0][0], rows[0][1], rows[0][2], 0,
    rows[1][0], rows[1][1], rows[1][2], 0,
    rows[2][0], rows[2][1], rows[2][2], 0,
    0, 0, 0, 1,
  );
  return matrix.transpose();
}

function buildBoneLookup(bvhBones: THREE.Bone[]) {
  const lookup = new Map<string, THREE.Bone[]>();

  for (const bone of bvhBones) {
    const key = normalizeJointName(bone.name);
    if (!key) {
      continue;
    }

    const bucket = lookup.get(key);
    if (bucket) {
      bucket.push(bone);
      continue;
    }

    lookup.set(key, [bone]);
  }

  return lookup;
}

function pickUnclaimedBone(
  candidates: readonly THREE.Bone[] | undefined,
  claimed: Set<THREE.Bone>,
) {
  if (!candidates) {
    return null;
  }

  for (const candidate of candidates) {
    if (!claimed.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveBoneForJoint(
  jointName: string,
  lookup: Map<string, THREE.Bone[]>,
  claimed: Set<THREE.Bone>,
) {
  const keys = [jointName, ...(JOINT_ALIASES[jointName] ?? [])].map(normalizeJointName);

  for (const key of keys) {
    const candidate = pickUnclaimedBone(lookup.get(key), claimed);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function createSkinnedMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xd6c6af,
    roughness: 0.72,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
}

export async function loadSomaSkinAsset() {
  if (!somaSkinAssetPromise) {
    somaSkinAssetPromise = (async () => {
      try {
        const manifestResponse = await fetch(SOMA_SKIN_MANIFEST_URL);
        if (!manifestResponse.ok) {
          throw new Error(`Failed to load skin manifest (${manifestResponse.status})`);
        }

        const manifest = (await manifestResponse.json()) as SomaSkinManifest;
        const offsetsResponse = await fetch(SOMA_STANDARD_TPOSE_OFFSETS_URL);
        if (!offsetsResponse.ok) {
          throw new Error(`Failed to load t-pose offsets (${offsetsResponse.status})`);
        }

        const offsetsPayload = (await offsetsResponse.json()) as SomaStandardTPoseOffsets;
        const binaryUrl = new URL('soma_skin.bin', manifestResponse.url).toString();
        const binaryResponse = await fetch(binaryUrl);
        if (!binaryResponse.ok) {
          throw new Error(`Failed to load skin buffer (${binaryResponse.status})`);
        }

        const binary = await binaryResponse.arrayBuffer();
        const vertexSection = manifest.sections.bind_vertices;
        const faceSection = manifest.sections.faces;
        const skinIndexSection = manifest.sections.skin_indices;
        const skinWeightSection = manifest.sections.skin_weights;
        const bindRigSection = manifest.sections.bind_rig_transform;

        const positions = readFloat32Array(binary, vertexSection.byteOffset, vertexSection.byteLength).slice();
        for (let i = 0; i < positions.length; i++) {
          positions[i] *= KIMODO_SKIN_TO_BVH_SCALE;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute(
          'skinIndex',
          new THREE.Uint16BufferAttribute(
            readUint16Array(binary, skinIndexSection.byteOffset, skinIndexSection.byteLength),
            4,
          ),
        );
        geometry.setAttribute(
          'skinWeight',
          new THREE.Float32BufferAttribute(
            readFloat32Array(binary, skinWeightSection.byteOffset, skinWeightSection.byteLength),
            4,
          ),
        );
        geometry.setIndex(
          new THREE.BufferAttribute(readUint32Array(binary, faceSection.byteOffset, faceSection.byteLength), 1),
        );
        geometry.computeVertexNormals();

        const bindRig = readFloat32Array(binary, bindRigSection.byteOffset, bindRigSection.byteLength);
        const bindMatrices = new Map<string, THREE.Matrix4>();
        const boneInverses = new Map<string, THREE.Matrix4>();
        const standardTPoseOffsets = new Map<string, THREE.Matrix4>();

        manifest.joint_names.forEach((jointName, index) => {
          const bindMatrix = makeScaledBindMatrix(bindRig, index * 16);
          bindMatrices.set(jointName, bindMatrix);
          boneInverses.set(jointName, bindMatrix.clone().invert());
          standardTPoseOffsets.set(
            jointName,
            makeRotationMatrixFromRows(offsetsPayload.matrices[index] ?? [[1, 0, 0], [0, 1, 0], [0, 0, 1]]),
          );
        });

        return {
          geometry,
          jointNames: manifest.joint_names,
          jointParents: new Map(SOMA_JOINT_ORDER_WITH_PARENTS),
          bindMatrices,
          boneInverses,
          standardTPoseOffsets,
        } satisfies SomaSkinAsset;
      } catch (error) {
        somaSkinAssetPromise = null;
        throw error;
      }
    })();
  }

  return somaSkinAssetPromise;
}

export function bindSomaSkinToSkeleton(asset: SomaSkinAsset, bvhBones: THREE.Bone[]) {
  const lookup = buildBoneLookup(bvhBones);
  const claimedBones = new Set<THREE.Bone>();
  const orderedBones: THREE.Bone[] = [];
  const missingJoints: string[] = [];
  const sourceBones = new Map<string, THREE.Bone>();
  const targetBones = new Map<string, THREE.Bone>();
  const bindLocalPositions = new Map<string, THREE.Vector3>();
  const bindLocalQuaternions = new Map<string, THREE.Quaternion>();
  const sourceBindWorldPositions = new Map<string, THREE.Vector3>();
  let matchedJointCount = 0;

  for (const jointName of asset.jointNames) {
    const jointBindMatrix = asset.bindMatrices.get(jointName);
    if (!jointBindMatrix) {
      throw new Error(`Missing bind matrix for '${jointName}'`);
    }

    const parentJointName = asset.jointParents.get(jointName) ?? null;
    const parentBindMatrix = parentJointName ? asset.bindMatrices.get(parentJointName) ?? null : null;
    const localBindMatrix = parentBindMatrix
      ? parentBindMatrix.clone().invert().multiply(jointBindMatrix)
      : jointBindMatrix.clone();

    const bindPosition = new THREE.Vector3();
    const bindQuaternion = new THREE.Quaternion();
    const bindScale = new THREE.Vector3();
    localBindMatrix.decompose(bindPosition, bindQuaternion, bindScale);

    const targetBone = new THREE.Bone();
    targetBone.name = jointName;
    targetBone.position.copy(bindPosition);
    targetBone.quaternion.copy(bindQuaternion);
    targetBone.scale.set(1, 1, 1);

    if (parentJointName) {
      const parentTargetBone = targetBones.get(parentJointName);
      if (!parentTargetBone) {
        throw new Error(`Missing parent target bone for '${jointName}'`);
      }
      parentTargetBone.add(targetBone);
    }

    bindLocalPositions.set(jointName, bindPosition.clone());
    bindLocalQuaternions.set(jointName, bindQuaternion.clone());
    targetBones.set(jointName, targetBone);
    orderedBones.push(targetBone);

    const sourceBone = resolveBoneForJoint(jointName, lookup, claimedBones);
    if (sourceBone) {
      claimedBones.add(sourceBone);
      sourceBones.set(jointName, sourceBone);
      sourceBindWorldPositions.set(jointName, sourceBone.getWorldPosition(new THREE.Vector3()));
      matchedJointCount += 1;
    } else {
      missingJoints.push(jointName);
    }
  }

  const matchedCoreJointCount = CORE_SOMA_JOINTS.filter((jointName) => sourceBones.has(jointName)).length;
  if (matchedCoreJointCount < 12) {
    throw new Error(`Insufficient joint coverage (${matchedCoreJointCount}/${CORE_SOMA_JOINTS.length})`);
  }

  const boneInverses = asset.jointNames.map((jointName) => {
    const inverse = asset.boneInverses.get(jointName);
    if (!inverse) {
      throw new Error(`Missing inverse bind matrix for '${jointName}'`);
    }
    return inverse;
  });

  const skeleton = new THREE.Skeleton(orderedBones, boneInverses);
  const lineBonePairs: Array<[THREE.Bone, THREE.Bone]> = [];
  for (const bone of orderedBones) {
    if (bone.parent instanceof THREE.Bone) {
      lineBonePairs.push([bone, bone.parent]);
    }
  }

  const skinnedMesh = new THREE.SkinnedMesh(asset.geometry.clone(), createSkinnedMaterial());
  skinnedMesh.name = 'SomaSkinnedCharacter';
  skinnedMesh.frustumCulled = false;
  skinnedMesh.castShadow = false;
  skinnedMesh.receiveShadow = false;
  if (orderedBones[0]) {
    skinnedMesh.add(orderedBones[0]);
  }
  skinnedMesh.bind(skeleton);
  skeleton.pose();
  orderedBones[0]?.updateMatrixWorld(true);

  const nextLocalQuaternion = new THREE.Quaternion();
  const sourceGlobalQuaternion = new THREE.Quaternion();
  const sourceGlobalMatrix = new THREE.Matrix4();
  const targetGlobalMatrix = new THREE.Matrix4();
  const parentInverseMatrix = new THREE.Matrix4();
  const targetLocalMatrix = new THREE.Matrix4();
  const targetGlobalMatrices = new Map<string, THREE.Matrix4>();

  const syncFromSource = () => {
    targetGlobalMatrices.clear();

    for (const jointName of asset.jointNames) {
      const targetBone = targetBones.get(jointName);
      if (!targetBone) {
        continue;
      }

      const bindPosition = bindLocalPositions.get(jointName);
      const bindQuaternion = bindLocalQuaternions.get(jointName);
      if (bindPosition) {
        targetBone.position.copy(bindPosition);
      }
      if (bindQuaternion) {
        targetBone.quaternion.copy(bindQuaternion);
      }

      const sourceBone = sourceBones.get(jointName);
      if (jointName === 'Hips' && sourceBone && bindPosition) {
        targetBone.position.copy(bindPosition).add(sourceBone.position);
      }

      if (sourceBone) {
        const poseOffset = asset.standardTPoseOffsets.get(jointName);
        sourceBone.getWorldQuaternion(sourceGlobalQuaternion);
        sourceGlobalMatrix.makeRotationFromQuaternion(sourceGlobalQuaternion);
        if (poseOffset) {
          sourceGlobalMatrix.multiply(poseOffset);
        }

        const parentJointName = asset.jointParents.get(jointName) ?? null;
        if (parentJointName) {
          const parentGlobalMatrix = targetGlobalMatrices.get(parentJointName);
          if (parentGlobalMatrix) {
            parentInverseMatrix.copy(parentGlobalMatrix).invert();
            targetLocalMatrix.copy(parentInverseMatrix).multiply(sourceGlobalMatrix);
          } else {
            targetLocalMatrix.copy(sourceGlobalMatrix);
          }
        } else {
          targetLocalMatrix.copy(sourceGlobalMatrix);
        }

        nextLocalQuaternion.setFromRotationMatrix(targetLocalMatrix);
        targetBone.quaternion.copy(nextLocalQuaternion).normalize();
      }

      targetBone.updateMatrix();
      if (targetBone.position) {
        targetGlobalMatrix.compose(
          targetBone.position,
          targetBone.quaternion,
          new THREE.Vector3(1, 1, 1),
        );
      } else {
        targetGlobalMatrix.makeRotationFromQuaternion(targetBone.quaternion);
      }
      const parentJointName = asset.jointParents.get(jointName) ?? null;
      if (parentJointName) {
        const parentGlobalMatrix = targetGlobalMatrices.get(parentJointName);
        if (parentGlobalMatrix) {
          targetGlobalMatrix.premultiply(parentGlobalMatrix);
        }
      }
      targetGlobalMatrices.set(jointName, targetGlobalMatrix.clone());
    }

    orderedBones[0]?.updateMatrixWorld(true);
  };

  syncFromSource();

  return {
    lineBonePairs,
    matchedJointCount,
    missingJoints,
    skinnedMesh,
    syncFromSource,
  } satisfies SomaSkinBinding;
}
