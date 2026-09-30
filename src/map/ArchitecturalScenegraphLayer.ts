import { ScenegraphLayer } from "@deck.gl/mesh-layers";

/** Opaque architectural shading; keeps the source geometry and real heights. */
export class ArchitecturalScenegraphLayer extends ScenegraphLayer {
  static layerName = "ArchitecturalScenegraphLayer";

  getShaders() {
    const shaders = super.getShaders();
    return {
      ...shaders,
      inject: {
        ...shaders.inject,
        "vs:#decl": "out vec3 architecturalPosition;",
        "vs:DECKGL_FILTER_GL_POSITION":
          "architecturalPosition = geometry.position.xyz;",
        "fs:#decl": "in vec3 architecturalPosition;",
        "fs:DECKGL_FILTER_COLOR": `
          // Screen-space derivatives give each actual face its own normal,
          // avoiding rounded corners caused by interpolated source normals.
          vec3 face = normalize(cross(dFdx(architecturalPosition), dFdy(architecturalPosition)));
          if (!gl_FrontFacing) face = -face;
          float keyLight = max(dot(face, normalize(vec3(-0.6, -0.4, 0.9))), 0.0);
          float fillLight = max(dot(face, normalize(vec3(0.8, 0.3, 0.4))), 0.0);
          float light = 0.32 + 0.52 * keyLight + 0.12 * fillLight;
          vec3 facade = vec3(0.60, 0.72, 0.76);
          color = vec4(facade * light, layer.opacity);
        `,
      },
    };
  }
}
