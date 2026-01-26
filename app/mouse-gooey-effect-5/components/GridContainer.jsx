'use client'
import React, { useEffect, useRef, useLayoutEffect, forwardRef, useImperativeHandle} from 'react'
import gsap from 'gsap'
import { LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, TextureLoader, Vector2, WebGLRenderer } from 'three'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
export const items = [
  {
    // src: '/images/members/edit/adriana-blurry-distortion-effect-1920px-1.jpg',
    // hoverSrc: '/images/members/orig/adriana.png',
    src: '/images/team_members/adrianaportrait.png',
    hoverSrc: '/images/test/adrianagooey.png',
    role: 'Insurance Coordinator',
    name: 'Adriana',
  },
  {
    // src: '/images/members/edit/alyssa-blurry-distortion-effect.jpg',
    // hoverSrc: '/images/members/orig/alyssa.png',
    src: '/images/team_members/alyssaportrait.png',
    hoverSrc: '/images/test/alyssagooey.png',
    role: 'Treatment Coordinator',
    name: 'Alyssa',
  },
  {
    // src: '/images/members/edit/elizabeth-blurry-distortion-effect-1.jpg',
    // hoverSrc: '/images/members/orig/elizabeth.png',
   src: '/images/team_members/stefhanyportrait.png',
    hoverSrc: '/images/test/stefhanygooey.png',
    role: 'Specialized Orthodontic Assistant',
    name: 'Stefhany',
  },
  {
    // src: '/images/members/edit/lexi-blurry-distortion-effect.jpg',
    // hoverSrc: '/images/members/orig/lexi.png',
    src: '/images/team_members/lexiportrait.png',
    hoverSrc: '/images/test/lexigooey.png',
    role: 'Treatment Coordinator',
    name: 'Lexi',
  },
  {
    // src: '/images/members/edit/nicole-blurry-distortion-effect.jpg',
    // hoverSrc: '/images/members/orig/nicolle.png',
    src: '/images/team_members/alexisportrait.png',
    hoverSrc: '/images/test/alexisgooey.png',
    role: 'Records Technician',
    name: 'Alexis',
  },
   


]

const vertexShader = `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = `
  precision highp float;

  uniform sampler2D u_texture;
  uniform sampler2D u_hovertexture;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_radius;
  uniform float u_speed;
  uniform float u_imageAspect;
  uniform float u_turbulenceIntensity;

  varying vec2 v_uv;

  // Improved hash function for better randomness
  vec3 hash33(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.zxy, p.yxz + 19.27);
    return fract(vec3(p.x * p.y, p.z * p.x, p.y * p.z));
  }

  // 2D hash function
  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract(vec2((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y));
  }

  // Simplex noise - smoother than Perlin, better for organic patterns
  float simplex_noise(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;

    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);

    // Determine which simplex we're in and the coordinates
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);

    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K2 * 2.0);
    vec3 d3 = d0 - (1.0 - 3.0 * K2);

    // Calculate gradients and dot products
    vec3 x0 = d0;
    vec3 x1 = d1;
    vec3 x2 = d2;
    vec3 x3 = d3;

    vec4 h = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    vec4 n = h * h * h * h * vec4(
      dot(x0, hash33(i) * 2.0 - 1.0),
      dot(x1, hash33(i + i1) * 2.0 - 1.0),
      dot(x2, hash33(i + i2) * 2.0 - 1.0),
      dot(x3, hash33(i + 1.0) * 2.0 - 1.0)
    );

    // Sum the contributions
    return 0.5 + 0.5 * 31.0 * dot(n, vec4(1.0));
  }

  // Curl noise for more fluid motion
  vec2 curl(vec2 p, float time) {
    const float epsilon = 0.001;

    float n1 = simplex_noise(vec3(p.x, p.y + epsilon, time));
    float n2 = simplex_noise(vec3(p.x, p.y - epsilon, time));
    float n3 = simplex_noise(vec3(p.x + epsilon, p.y, time));
    float n4 = simplex_noise(vec3(p.x - epsilon, p.y, time));

    float x = (n2 - n1) / (2.0 * epsilon);
    float y = (n4 - n3) / (2.0 * epsilon);

    return vec2(x, y);
  }

  // Improved ink marbling function for more organic and fluid patterns
  float inkMarbling(vec2 p, float time, float intensity) {
    // Create multiple layers of fluid motion
    float result = 0.0;

    // Base layer - large fluid movements
    vec2 flow = curl(p * 1.5, time * 0.1) * intensity * 2.0;
    vec2 p1 = p + flow * 0.3;
    result += simplex_noise(vec3(p1 * 2.0, time * 0.15)) * 0.5;

    // Medium details - swirls and eddies
    vec2 flow2 = curl(p * 3.0 + vec2(sin(time * 0.2), cos(time * 0.15)), time * 0.2) * intensity;
    vec2 p2 = p + flow2 * 0.2;
    result += simplex_noise(vec3(p2 * 4.0, time * 0.25)) * 0.3;

    // Fine details - small ripples and textures
    vec2 flow3 = curl(p * 6.0 + vec2(cos(time * 0.3), sin(time * 0.25)), time * 0.3) * intensity * 0.5;
    vec2 p3 = p + flow3 * 0.1;
    result += simplex_noise(vec3(p3 * 8.0, time * 0.4)) * 0.2;

    // Add some spiral patterns for more interesting visuals
    float dist = length(p - vec2(0.5));
    float angle = atan(p.y - 0.5, p.x - 0.5);
    float spiral = sin(dist * 15.0 - angle * 2.0 + time * 0.3) * 0.5 + 0.5;

    // Blend everything together
    result = mix(result, spiral, 0.3);

    // Normalize to 0-1 range
    result = result * 0.5 + 0.5;

    return result;
  }

  void main() {
    vec2 uv = v_uv;
    float screenAspect = u_resolution.x / u_resolution.y;
    float ratio = u_imageAspect / screenAspect;

    vec2 texCoord = vec2(
      mix(0.5 - 0.5 / ratio, 0.5 + 0.5 / ratio, uv.x),
      uv.y
    );

    vec4 tex1 = texture2D(u_texture, texCoord);
    vec4 tex2 = texture2D(u_hovertexture, texCoord);

    // Calculate ink marbling effect
    vec2 correctedUV = uv;
    correctedUV.x *= screenAspect;
    vec2 correctedMouse = u_mouse;
    correctedMouse.x *= screenAspect;

    float dist = distance(correctedUV, correctedMouse);

    // Use improved ink marbling
    float marbleEffect = inkMarbling(uv * 2.0 + u_time * u_speed * 0.1, u_time, u_turbulenceIntensity * 2.0);
    float jaggedDist = dist + (marbleEffect - 0.5) * u_turbulenceIntensity * 2.0;

    float mask = u_radius > 0.001 ? step(jaggedDist, u_radius) : 0.0;

    vec4 finalImage = mix(tex1, tex2, mask);

    gl_FragColor = finalImage;
  }
`

const ImageCanvas = ({ className, member, imgSrc, hoverSrc }) => {
  const containerRef = useRef(null)

  const config = {
    maskRadius: 0.35,
    maskSpeed: 0.75,
    animationSpeed: 1.0,
    appearDuration: 0.4,
    disappearDuration: 0.3,
    turbulenceIntensity: 0.225,
    frameSkip: 0,
  }

  let frameCount = 0
  let lastTime = 0
  const activeContainers = new Set()

  useEffect(() => {
    const updateContainer = (container, deltaTime) => {
      if (!container.uniforms) return
      container.lerpedMouse.lerp(container.targetMouse, 0.1)
      container.uniforms.u_mouse.value.copy(container.lerpedMouse)
      if (container.isMouseInsideContainer) {
        container.uniforms.u_time.value += 0.01 * config.animationSpeed * (deltaTime / 16.67)
      }
      if (container.renderer && container.scene && container.camera) {
        container.renderer.render(container.scene, container.camera)
      }
    }

    const globalAnimate = (timestamp) => {
      requestAnimationFrame(globalAnimate)
      const deltaTime = timestamp - lastTime
      lastTime = timestamp
      frameCount++
      if (config.frameSkip > 0 && frameCount % (config.frameSkip + 1) !== 0) return
      activeContainers.forEach((container) => {
        if (container.isInView) {
          updateContainer(container, deltaTime)
        }
      })
    }

    requestAnimationFrame(globalAnimate)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const initHoverEffect = (container) => {
      container.scene = null
      container.camera = null
      container.renderer = null
      container.uniforms = null
      container.isInView = null
      container.isMouseInsideContainer = null
      container.targetMouse = new Vector2(0.5, 0.5)
      container.lerpedMouse = new Vector2(0.5, 0.5)
      container.radiusTween = null

      activeContainers.add(container)

      const loader = new TextureLoader()
      Promise.all([
        loader.loadAsync(imgSrc),
        loader.loadAsync(hoverSrc),
      ]).then(([baseTexture, hoverTexture]) => {
        setupScene(baseTexture, hoverTexture)
        setupEventListeners()
      })

      const setupScene = (texture, hoverTexture) => {
        texture.minFilter = LinearFilter
        texture.magFilter = LinearFilter
        texture.anisotropy = 8
        texture.generateMipmaps = true
        container.scene = new Scene()
        container.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
        container.uniforms = {
          u_texture: { value: texture },
          u_hovertexture: { value: hoverTexture },
          u_mouse: { value: new Vector2(0.5, 0.5) },
          u_time: { value: 0.0 },
          u_resolution: { value: new Vector2(container.clientWidth, container.clientHeight) },
          u_radius: { value: 0.0 },
          u_speed: { value: config.maskSpeed },
          u_imageAspect: { value: texture.image.width / texture.image.height },
          u_turbulenceIntensity: { value: config.turbulenceIntensity },
        }
        const geometry = new PlaneGeometry(2, 2)
        const material = new ShaderMaterial({
          uniforms: container.uniforms,
          vertexShader,
          fragmentShader,
          depthTest: false,
          depthWrite: false,
        })
        const mesh = new Mesh(geometry, material)
        container.scene.add(mesh)
        container.renderer = new WebGLRenderer({
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
        })
        container.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.renderer.setSize(container.clientWidth, container.clientHeight)
        container.appendChild(container.renderer.domElement)

        let resizeTimeout
        const resizeObserver = new ResizeObserver(
          () => {
            if (resizeTimeout) return
            resizeTimeout = setTimeout(() => {
              if (container.renderer) container.renderer.setSize(container.clientWidth, container.clientHeight)
              if (container.uniforms) container.uniforms.u_resolution.value.set(container.clientWidth, container.clientHeight)
              resizeTimeout = null
            }, 200)
          }
        )
        resizeObserver.observe(container)
        container.renderer.render(container.scene, container.camera)
      }

      const setupEventListeners = () => {
        let lastMouseX = 0
        let lastMouseY = 0
        let mouseMoveTimeout = null

        const handleMouseMove = (event) => {
          lastMouseX = event.clientX
          lastMouseY = event.clientY
          if (!mouseMoveTimeout) {
            mouseMoveTimeout = setTimeout(() => {
              updateCursorState(lastMouseX, lastMouseY)
              mouseMoveTimeout = null
            }, 16) 
          }
        }

        document.addEventListener('mousemove', handleMouseMove, { passive: true })

        const intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              container.isInView = entry.isIntersecting
              if (!container.isInView && container.radiusTween) {
                container.radiusTween.kill()
                container.uniforms.u_radius.value = 0.0
              }
            })
          },
          { threshold: 0.1 }
        )
        intersectionObserver.observe(container)
      }

      const updateCursorState = (x, y) => {
        const rect = container.getBoundingClientRect()
        const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
        if (container.isMouseInsideContainer !== inside) {
          container.isMouseInsideContainer = inside
          if (container.radiusTween) {
            container.radiusTween.kill()
          }
          if (inside) {
            container.targetMouse.x = (x - rect.left) / rect.width
            container.targetMouse.y = 1.0 - (y - rect.top) / rect.height
            container.radiusTween = gsap.to(container.uniforms.u_radius, {
              value: config.maskRadius,
              duration: config.appearDuration,
              ease: 'power2.out',
            })
          } else {
            container.radiusTween = gsap.to(container.uniforms.u_radius, {
              value: 0,
              duration: config.disappearDuration,
              ease: 'power2.in',
            })
          }
        }
        if (inside) {
          container.targetMouse.x = (x - rect.left) / rect.width
          container.targetMouse.y = 1.0 - (y - rect.top) / rect.height
        }
      }
    }

    initHoverEffect(containerRef.current)
  }, [imgSrc, hoverSrc])

  return (
    <div ref={containerRef} className={`inversion-lens ${className}`}>
      <img src={imgSrc} data-hover={hoverSrc} alt={member} />
    </div>
  )
}

const MemberCard = ({ member, className = '' }) => {
  return (
    <div className={`member-slot ${className} flex flex-col justify-between h-full w-full p-8`}>
    
      <div className="image-section flex-1 flex items-center justify-center mb-4">
        <div className="image-wrapper w-full max-w-[320px] max-h-[80vh] relative overflow-hidden rounded-[1.25rem] bg-[#111] aspect-[3/4]">
          <ImageCanvas
            className="absolute inset-0 w-full h-full" 
            member={member.name}
            imgSrc={member.src}
            hoverSrc={member.hoverSrc}
          />
        </div>
      </div>


      <div className="member-info flex justify-between items-center text-center flex-1 min-h-[60px] pt-4">
        <div className="member-role text-[13px] font-neuehaas45 tracking-wide text-[#252424] opacity-80">
          {member.role}
        </div>
        <div className="member-title text-[14px] font-neuehaas45 font-500 tracking-[0.01rem] text-[#252424]">
          {member.name}
        </div>
      </div>
    </div>
  );
};

export { MemberCard };


export default forwardRef(function GridContainer(props, ref) {
  const cardsRef = useRef([]);
  const membersRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getCards: () => cardsRef.current.filter(Boolean),
    getScroller: () => membersRef.current,   //  expose the container
  }));

  return (
    <section className="layout">
      <div className="grid-container-wrapper">
        <div className="font-canelathin grid-copy">
          <h3><span></span>Our team at Frey Smiles is built around care, clarity, and craft.</h3>
          <p className="font-khteka uppercase text-[12px]">
            Behind every visit is a group of people who care deeply about how things feel, how they flow, and how you’re treated.
            We’re here to make every visit feel smooth, personal, and easy from start to finish.
          </p>
        </div>

    <div ref={membersRef} className="members-section">
  <div className="members-track">
    {items.map((item, i) => (
      <div
        key={item.name}
        ref={(el) => (cardsRef.current[i] = el)}
        className="member-card"
      >
        <div className="image-wrapper">
          <ImageCanvas
            className={`item-${i + 1}`}
            member={item.name}
            imgSrc={item.src}
            hoverSrc={item.hoverSrc}
          />
        </div>
        <div className="member-info">
          <div className="member-role">{item.role}</div>
          <div className="member-title">{item.name}</div>
        </div>
      </div>
    ))}
  </div>
</div>
      </div>
    </section>
  );
});