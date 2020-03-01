varying vec3 vNormal;
uniform float u_time;
uniform vec3 u_lightColor;
uniform vec3 u_lightPos;

varying vec3 fragPos;



void main() {
  vec3 color = vec3(0.0);
  vec3 outsideColor = vec3(0.0);

  vec3 norm = normalize(vNormal);
  vec3 lightDir = normalize(u_lightPos - fragPos);
  float diff = max(dot(norm, lightDir), 0.0);

  color = mix(u_lightColor, outsideColor, 1.0 - diff);

  gl_FragColor = vec4(color, 1.0);
}