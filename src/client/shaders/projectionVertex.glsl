uniform mat4 projectionMatProj;
uniform mat4 cameraMatProj;
uniform vec3 color;

varying vec4 vTexCoords;
varying vec4 vWorldPosition;
varying vec3 vNormal;
varying vec3 vColor;
varying vec2 vUVCoords;

void main() {
vNormal = normalize(mat3(modelMatrix) * normal);
vWorldPosition = modelMatrix * vec4(position, 1.0f);

gl_Position = projectionMatrix * viewMatrix * vWorldPosition;
vTexCoords = projectionMatProj * cameraMatProj * vWorldPosition;
vColor = color;
vUVCoords = uv;
}