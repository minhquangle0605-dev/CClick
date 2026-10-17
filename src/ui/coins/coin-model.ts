import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Shape,
  ExtrudeGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector2,
} from 'three';
import { assets } from '@assets/asset-manifest';
import type { CoinKind } from './coin-types';

/** Local geometry, not a flat image plane: bevelled body, reeds, two faces and raised emblem. */
export function createCoinModel(kind: CoinKind, invalidate: () => void) {
  const root = new Group();
  const gold = kind === 'gold';
  const rainbow = kind === 'rainbow';
  const metal = new MeshStandardMaterial({
    color: gold ? '#e1b766' : '#c2d6ef',
    metalness: 1,
    roughness: 0.23,
  });
  const inset = new MeshStandardMaterial({
    color: gold ? '#a98439' : '#294566',
    metalness: 0.85,
    roughness: 0.3,
  });
  const emblem = new MeshStandardMaterial({ color: '#dce8fa', metalness: 0.95, roughness: 0.2 });
  const edge = new MeshStandardMaterial({
    color: gold ? '#947035' : '#657b9c',
    metalness: 1,
    roughness: 0.3,
  });
  const rainbowMetal = metal.clone();
  rainbowMetal.color.set('white');
  rainbowMetal.vertexColors = true;
  const geometries = new Set<BufferGeometry>();
  const materials = new Set([metal, inset, emblem, edge, rainbowMetal]);
  const textures = new Set<ReturnType<TextureLoader['load']>>();
  let disposed = false;
  function add(parent: Object3D, geometry: BufferGeometry, material: MeshStandardMaterial, z = 0) {
    geometries.add(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.z = z;
    parent.add(mesh);
    return mesh;
  }
  function spectral(geometry: BufferGeometry) {
    const positions = geometry.getAttribute('position');
    const colors = [];
    const color = new Color();
    for (let index = 0; index < positions.count; index++) {
      const hue =
        (Math.atan2(positions.getY(index), positions.getX(index)) / (Math.PI * 2) + 1.12) % 1;
      color.setHSL(hue, 0.8, 0.58);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return geometry;
  }
  // Revolve a rounded cross-section around Y, then turn the axis toward the camera (+Z).
  const profile = [
    [0, -0.09],
    [0.93, -0.09],
    [0.975, -0.073],
    [1, -0.04],
    [1, 0.04],
    [0.975, 0.073],
    [0.93, 0.09],
    [0, 0.09],
  ];
  const body = new LatheGeometry(
    profile.map(([radius, height]) => new Vector2(radius!, height!)),
    128,
  );
  body.rotateX(Math.PI / 2);
  add(root, rainbow ? spectral(body) : body, rainbow ? rainbowMetal : metal);

  const reedGeometry = new BoxGeometry(0.014, 0.018, 0.103);
  geometries.add(reedGeometry);
  const reeds = new InstancedMesh(reedGeometry, gold ? metal : edge, 120);
  const transform = new Object3D();
  for (let i = 0; i < 120; i++) {
    const angle = (i * Math.PI * 2) / 120;
    transform.position.set(Math.cos(angle) * 0.997, Math.sin(angle) * 0.997, 0);
    transform.rotation.z = angle - Math.PI / 2;
    transform.updateMatrix();
    reeds.setMatrixAt(i, transform.matrix);
  }
  root.add(reeds);

  let goldFace: MeshStandardMaterial | null = null;
  if (gold) {
    const texture = new TextureLoader().load(assets.goldCoin, () => {
      if (!disposed) invalidate();
    });
    texture.colorSpace = SRGBColorSpace;
    textures.add(texture);
    goldFace = new MeshStandardMaterial({
      color: '#fff5d4',
      map: texture,
      bumpMap: texture,
      bumpScale: 0.035,
      metalness: 0.68,
      roughness: 0.37,
    });
    materials.add(goldFace);
  }

  for (const side of [1, -1]) {
    const face = new Group();
    face.rotation.y = side === -1 ? Math.PI : 0;
    root.add(face);
    const disc = new CylinderGeometry(0.846, 0.846, 0.025, 96);
    disc.rotateX(Math.PI / 2);
    add(face, rainbow ? spectral(disc) : disc, rainbow ? rainbowMetal : inset, 0.09);
    for (const [radius, thickness, z] of [
      [0.968, 0.014, 0.078],
      [0.914, 0.009, 0.094],
      [0.852, 0.014, 0.101],
      [0.827, 0.005, 0.108],
    ]) {
      const ring = new TorusGeometry(radius, thickness, 8, 128);
      add(face, rainbow ? spectral(ring) : ring, rainbow ? rainbowMetal : metal, z);
    }
    if (goldFace) {
      const art = new CircleGeometry(0.825, 96);
      const uv = art.getAttribute('uv');
      // Sample the dragon face; the body/edge/rims are real meshes around it.
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, 0.17 + uv.getX(i) * 0.72, 0.15 + uv.getY(i) * 0.73);
      add(face, art, goldFace, 0.109);
    } else {
      // Four long tips for Silver; eight for Rainbow, matching the supplied emblems.
      const tips = rainbow ? 8 : 4;
      const boundary: Vector2[] = [];
      for (let i = 0; i < tips * 2; i++) {
        const angle = Math.PI / 2 + (i * Math.PI) / tips;
        const radius = i % 2 ? (rainbow ? 0.38 : 0.205) : rainbow && i % 4 ? 0.56 : 0.775;
        boundary.push(new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
      }
      if (!rainbow) {
        // Curved shoulders retain the original four-point silver emblem.
        const curved: Vector2[] = [];
        for (let i = 0; i < boundary.length; i++) {
          const a = boundary[i]!;
          const b = boundary[(i + 1) % boundary.length]!;
          const control =
            i % 2
              ? a.clone().multiplyScalar(0.92).add(b.clone().multiplyScalar(0.1))
              : b.clone().multiplyScalar(0.92).add(a.clone().multiplyScalar(0.1));
          for (let step = 0; step < 6; step++) {
            const t = step / 6;
            curved.push(
              a
                .clone()
                .multiplyScalar((1 - t) ** 2)
                .add(control.clone().multiplyScalar(2 * (1 - t) * t))
                .add(b.clone().multiplyScalar(t * t)),
            );
          }
        }
        boundary.splice(0, boundary.length, ...curved);
      }
      const shape = new Shape(boundary);
      const base = new ExtrudeGeometry(shape, {
        depth: 0.014,
        bevelEnabled: true,
        bevelSize: 0.009,
        bevelThickness: 0.009,
        bevelSegments: 2,
        steps: 1,
      });
      add(face, base, metal, 0.116);
      const vertices: number[] = [];
      for (let i = 0; i < boundary.length; i++) {
        const a = boundary[i]!;
        const b = boundary[(i + 1) % boundary.length]!;
        vertices.push(0, 0, 0.24, a.x, a.y, 0.142, b.x, b.y, 0.142);
      }
      const facets = new BufferGeometry();
      facets.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      facets.computeVertexNormals();
      add(face, facets, emblem);
      for (const r of [0.797, 0.788]) add(face, new TorusGeometry(r, 0.0018, 4, 96), metal, 0.11);
    }
  }
  return {
    root,
    dispose() {
      disposed = true;
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      reeds.dispose();
      root.clear();
    },
  };
}
