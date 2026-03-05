uniform sampler2D texture1;
uniform sampler2D shadowMap;
uniform sampler2D albedoMap;
uniform vec3 projPosition;
uniform vec3 projDirection;

varying vec4 vTexCoords;
varying vec4 vWorldPosition;
varying vec3 vNormal;
varying vec3 vColor;
varying vec2 vUVCoords;

float dist(vec3 a, vec3 b) {
return pow(a.x - b.x,2.0f) + pow(a.y-b.y,2.0f) + pow(a.z-b.z,2.0f);
}

float shadowCalculation() {
    vec3 projCoords = vTexCoords.xyz/vTexCoords.w;
    projCoords = projCoords*0.5f + 0.5f;

    float closestDepth = texture2D(shadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;

    float bias = 0.005;

    float shadow = currentDepth - bias > closestDepth ? 1.0f : 0.0f;

    return shadow;
}

void main() {
vec2 uv = (vTexCoords.xy/vTexCoords.w) * 0.5f + 0.5f;
vec4 albedo = texture2D(albedoMap,vUVCoords);

vec3 projDir = normalize(projPosition - vWorldPosition.xyz);
float dotProduct = dot(vNormal, projDir);

vec3 outColor;

if(dot(projDir, projDirection) > 1.0 || dotProduct < 0.0f || uv.x > 1.0f || uv.x < 0.0f || uv.y > 1.0f || uv.y < 0.0f) {
    outColor = vec3(albedo.x, albedo.y, albedo.z);
} else {

    //float power = 460.0f/(dist(projPosition, vWorldPosition.xyz));
    //float mixFactor = (1.0 - shadowCalculation())*(dotProduct); //* power);
    float mixFactor = (1.0)*(dotProduct); //* power);
    mixFactor = clamp(mixFactor,0.0f, 1.0f);

    outColor = mix(albedo,texture2D(texture1,uv),mixFactor*0.6).rgb;   
}

gl_FragColor = vec4(outColor,1.0f);

}