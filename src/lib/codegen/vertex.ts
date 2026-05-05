// Vertex shader emission.
//
// In the legacy generator, primitives explicitly opted into Paper's full
// vertex layout (object/responsive/pattern/image-domain UV varyings) via a
// `uvDomains` flag. In the new architecture there's no flag — the codegen
// scans every emitted fragment-shader source for varying references and
// includes the matching vertex-shader outputs on demand.

const STRUCTURED_VARYINGS = [
  'v_objectUV',
  'v_objectBoxSize',
  'v_responsiveUV',
  'v_responsiveBoxGivenSize',
  'v_patternUV',
  'v_patternBoxSize',
  'v_imageUV',
] as const

/**
 * Returns true if any pass's fragment source references a structured-UV
 * varying (other than the ubiquitous v_uv). Drives the choice of vertex
 * shader.
 */
export function fragmentNeedsStructuredUv(fragmentSources: string[]): boolean {
  for (const src of fragmentSources) {
    for (const v of STRUCTURED_VARYINGS) {
      if (src.includes(v)) return true
    }
  }
  return false
}

export function buildVertexShader(usesStructuredUv: boolean): string {
  if (!usesStructuredUv) {
    return `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`
  }

  return `#version 300 es
precision highp float;

in vec2 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec2 v_uv;
out vec2 v_objectUV;
out vec2 v_objectBoxSize;
out vec2 v_responsiveUV;
out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV;
out vec2 v_patternBoxSize;
out vec2 v_imageUV;

vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box = vec2(0.0);
  box.x = boxRatio * min(givenBoxSize.x / max(boxRatio, 1e-4), givenBoxSize.y);
  float noFitBoxWidth = box.x;
  if (u_fit == 1.0) {
    box.x = boxRatio * min(u_resolution.x / max(boxRatio, 1e-4), u_resolution.y);
  } else if (u_fit == 2.0) {
    box.x = boxRatio * max(u_resolution.x / max(boxRatio, 1e-4), u_resolution.y);
  }
  box.y = box.x / max(boxRatio, 1e-4);
  return vec3(max(box, vec2(1.0)), max(noFitBoxWidth, 1.0));
}

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;

  vec2 uv = gl_Position.xy * 0.5;
  vec2 boxOrigin = vec2(0.5 - u_originX, u_originY - 0.5);
  vec2 givenBoxSize = max(vec2(u_worldWidth, u_worldHeight), vec2(1.0)) * max(u_pixelRatio, 1.0);
  float r = u_rotation * 3.14159265358979323846 / 180.0;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);

  float fixedRatio = 1.0;
  vec2 fixedRatioBoxGivenSize = vec2(
    (u_worldWidth == 0.0) ? u_resolution.x : givenBoxSize.x,
    (u_worldHeight == 0.0) ? u_resolution.y : givenBoxSize.y
  );
  v_objectBoxSize = getBoxSize(fixedRatio, fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale = u_resolution.xy / v_objectBoxSize;
  v_objectUV = uv;
  v_objectUV *= objectWorldScale;
  v_objectUV += boxOrigin * (objectWorldScale - 1.0);
  v_objectUV += graphicOffset;
  v_objectUV /= max(u_scale, 1e-4);
  v_objectUV = graphicRotation * v_objectUV;

  v_responsiveBoxGivenSize = vec2(
    (u_worldWidth == 0.0) ? u_resolution.x : givenBoxSize.x,
    (u_worldHeight == 0.0) ? u_resolution.y : givenBoxSize.y
  );
  float responsiveRatio = v_responsiveBoxGivenSize.x / max(v_responsiveBoxGivenSize.y, 1.0);
  vec2 responsiveBoxSize = getBoxSize(responsiveRatio, v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale = u_resolution.xy / responsiveBoxSize;
  v_responsiveUV = uv;
  v_responsiveUV *= responsiveBoxScale;
  v_responsiveUV += boxOrigin * (responsiveBoxScale - 1.0);
  v_responsiveUV += graphicOffset;
  v_responsiveUV /= max(u_scale, 1e-4);
  v_responsiveUV.x *= responsiveRatio;
  v_responsiveUV = graphicRotation * v_responsiveUV;
  v_responsiveUV.x /= max(responsiveRatio, 1e-4);

  vec2 patternBoxGivenSize = vec2(
    (u_worldWidth == 0.0) ? u_resolution.x : givenBoxSize.x,
    (u_worldHeight == 0.0) ? u_resolution.y : givenBoxSize.y
  );
  float patternBoxRatio = patternBoxGivenSize.x / max(patternBoxGivenSize.y, 1.0);
  vec3 patternBoxSizeData = getBoxSize(patternBoxRatio, patternBoxGivenSize);
  v_patternBoxSize = patternBoxSizeData.xy;
  float patternBoxNoFitBoxWidth = patternBoxSizeData.z;
  vec2 patternBoxScale = u_resolution.xy / v_patternBoxSize;
  v_patternUV = uv;
  v_patternUV += graphicOffset / patternBoxScale;
  v_patternUV += boxOrigin;
  v_patternUV -= boxOrigin / patternBoxScale;
  v_patternUV *= u_resolution.xy;
  v_patternUV /= max(u_pixelRatio, 1.0);
  if (u_fit > 0.0) {
    v_patternUV *= patternBoxNoFitBoxWidth / max(v_patternBoxSize.x, 1.0);
  }
  v_patternUV /= max(u_scale, 1e-4);
  v_patternUV = graphicRotation * v_patternUV;
  v_patternUV += boxOrigin / patternBoxScale;
  v_patternUV -= boxOrigin;
  v_patternUV *= 0.01;

  float imageAspect = max(u_imageAspectRatio, 1e-4);
  vec2 imageBoxSize;
  if (u_fit == 1.0) {
    imageBoxSize.x = min(u_resolution.x / imageAspect, u_resolution.y) * imageAspect;
  } else if (u_fit == 2.0) {
    imageBoxSize.x = max(u_resolution.x / imageAspect, u_resolution.y) * imageAspect;
  } else {
    imageBoxSize.x = min(10.0, 10.0 / imageAspect * imageAspect);
  }
  imageBoxSize.y = imageBoxSize.x / imageAspect;
  vec2 imageBoxScale = u_resolution.xy / max(imageBoxSize, vec2(1.0));
  v_imageUV = uv;
  v_imageUV *= imageBoxScale;
  v_imageUV += boxOrigin * (imageBoxScale - 1.0);
  v_imageUV += graphicOffset;
  v_imageUV /= max(u_scale, 1e-4);
  v_imageUV.x *= imageAspect;
  v_imageUV = graphicRotation * v_imageUV;
  v_imageUV.x /= imageAspect;
  v_imageUV += 0.5;
  v_imageUV.y = 1.0 - v_imageUV.y;
}
`
}
