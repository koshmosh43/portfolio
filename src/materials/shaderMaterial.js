import * as THREE from 'three'

/** Three's UniformsUtils.clone expects `{ name: { value } }`; drei-style `{ name: vector }` breaks cloning. */
function normalizeUniforms(uniforms) {
  const out = {}
  for (const key of Object.keys(uniforms)) {
    const u = uniforms[key]
    out[key] =
      u !== null && typeof u === 'object' && !Array.isArray(u) && 'value' in u ? u : { value: u }
  }
  return out
}

export function shaderMaterial(uniforms, vertexShader, fragmentShader, onInit) {
  class CustomShaderMaterial extends THREE.ShaderMaterial {
    constructor(params = {}) {
      // R3F may pass `uniforms` in params; it must not overwrite our cloned `{ value }` shape.
      super({
        ...params,
        vertexShader,
        fragmentShader,
        uniforms: THREE.UniformsUtils.clone(normalizeUniforms(uniforms)),
      })
      onInit?.(this)
    }
  }

  Object.keys(uniforms).forEach((key) => {
    Object.defineProperty(CustomShaderMaterial.prototype, key, {
      get() {
        return this.uniforms[key].value
      },
      set(value) {
        this.uniforms[key].value = value
      },
    })
  })

  return CustomShaderMaterial
}
