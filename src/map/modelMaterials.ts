/** Materials are intentionally replaced by our architectural shader.
 * Remove texture references before GPU upload; geometry and metadata stay intact.
 */
export function simplifyModelMaterials(gltf: {
  meshes?: { primitives?: { material?: unknown }[] }[];
  materials?: unknown[];
  textures?: unknown[];
  images?: unknown[];
}) {
  const material = {
    id: "architectural-matte",
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      metallicFactor: 0,
      roughnessFactor: 1,
    },
  };
  for (const mesh of gltf.meshes || []) {
    for (const primitive of mesh.primitives || [])
      primitive.material = material;
  }
  gltf.materials = [material];
  gltf.textures = [];
  gltf.images = [];
}
