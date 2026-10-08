'use client'
import React, { useEffect, useId, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AmbientLight, Color, DirectionalLight, Group, HemisphereLight, MathUtils, PointLight } from "three";
import { Clouds, Cloud, CameraControls, Sky as SkyImpl, StatsGl, CloudsProps, CloudProps } from "@react-three/drei";
import { motion } from "motion/react"
import gsap from 'gsap';

export default function HomePageLogo() {
  const clipId = useId()

  const homePageLogoRef = useRef(null)

  useEffect(() => {
    if (!homePageLogoRef.current) return

    gsap.set(homePageLogoRef.current, {
      clipPath: "polygon(-50% 0%, 0% 0%, -50% 100%, -100% 100%)",
    })

    let mm = gsap.matchMedia()
    const tl = gsap.timeline()
      
    mm.add("(max-width: 1279px)", () => {
      tl.to(homePageLogoRef.current, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        // clipPath: "polygon(100% 0%, 200% 0%, 150% 100%, 100% 100%)",
        duration: 2,
        delay: 2.0,
        ease: "power2.inOut",
      })
      // .to(homePageLogoRef.current, {
      //   clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      // })
      
      return () => tl.kill()
    })

    mm.add("(min-width: 1280px)", () => {
      tl.to(homePageLogoRef.current, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        // clipPath: "polygon(100% 0%, 200% 0%, 150% 100%, 100% 100%)",
        duration: 2,
        delay: 1.0,
        ease: "power2.inOut",
      })
      return () => tl.kill()
    })

    return () => mm.revert()
  }, [])

  return (
    <div
      ref={homePageLogoRef}
      style={{
        position: "relative",
        width: "150px",
        height: "80px",
        overflow: "hidden",
        // willChange: "clip-path",
      }}
    >
      <svg
        className="home-page-logo"
        viewBox="0 0 149.835 79"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          willChange: "clip-path",
        }}
      >
        <clipPath id={clipId}>
          <motion.path
            // top left of letter S
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            // transition={{ ease: "easeIn", duration: 1, delay: 1.75, }}
            style={{
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            id="s__top-left"
            d="M90.375,0h18.98c.275,0,.5,.225,.5,.5v36.98c0,.275-.225,.5-.5,.5h-18.98c-10.21,0-18.5-8.29-18.5-18.5v-.98c0-10.21,8.29-18.5,18.5-18.5Z"
            fill="white"
          />
          <motion.path
            // top right of letter S
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            // transition={{ ease: "easeIn", duration: 1, delay: 2.0, }}
            style={{
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            id="s__top-right"
            d="M112.355,0h18.98c10.21,0,18.5,8.29,18.5,18.5v18.98c0,.275-.225,.5-.5,.5h-18.98c-10.21,0-18.5-8.29-18.5-18.5V.5c0-.275,.225-.5,.5-.5Z"
            fill="white"
          />
          <motion.path
            // bottom left of letter S
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            // transition={{ ease: "easeIn", duration: 1, delay: 1.25, }}
            style={{
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            id="s__bottom-left"
            d="M72.375,39.98h18.98c10.21,0,18.5,8.29,18.5,18.5v18.98c0,.275-.225,.5-.5,.5h-18.98c-10.21,0-18.5-8.29-18.5-18.5v-18.98c0-.275,.225-.5,.5-.5Z"
            fill="white"
          />
          <motion.path
            // bottom right of letter S
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            // transition={{ ease: "easeIn", duration: 1, delay: 1.5, }}
            style={{
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            id="s__bottom-right"
            d="M112.355,39.98h18.98c10.21,0,18.5,8.29,18.5,18.5v.98c0,10.21-8.29,18.5-18.5,18.5h-18.98c-.275,0-.5-.225-.5-.5v-36.98c0-.275,.225-.5,.5-.5Z"
            fill="white"
          />
          <motion.path
            // top left of letter F
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            // transition={{ ease: "easeIn", duration: 1, delay: 0, }}
            style={{
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            id="f__top-left"
            d="M12.5,0h0c6.9,0,12.5,5.6,12.5,12.5v12c0,.275-.225,.5-.5,.5h-12C5.6,25,0,19.4,0,12.5H0C0,5.6,5.6,0,12.5,0Z"
            fill="white"
          />
          <motion.path
            // top right of letter F
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            // transition={{ ease: "easeIn", duration: 1, delay: 0.25, }}
            style={{
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            id="f__top-right"
            d="M39.685,0h15c6.9,0,12.5,5.6,12.5,12.5h0c0,6.9-5.6,12.5-12.5,12.5h-27c-.275,0-.5-.225-.5-.5v-12c0-6.9,5.6-12.5,12.5-12.5Z"
            fill="white"
          />
          <motion.path
            // middle left of letter F
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            // transition={{ ease: "easeIn", duration: 1, delay: 0.5, }}
            style={{
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            id="f__middle-left"
            d="M12.5,27h12c.275,0,.5,.225,.5,.5v12c0,6.9-5.6,12.5-12.5,12.5h0c-6.9,0-12.5-5.6-12.5-12.5h0c0-6.9,5.6-12.5,12.5-12.5Z"
            fill="white"
          />
          <motion.path
            // middle right of letter F
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            // transition={{ ease: "easeIn", duration: 1, delay: 0.75, }}
            style={{
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            id="f__middle-right"
            d="M27.69,27h12c6.9,0,12.5,5.6,12.5,12.5h0c0,6.9-5.6,12.5-12.5,12.5h-12c-.275,0-.5-.225-.5-.5v-24c0-.275,.225-.5,.5-.5Z"
            fill="white"
          />
          <motion.path
            // bottom left of letter F
            // initial={{ scale: 0 }}
            // animate={{ scale: 1 }}
            // transition={{ ease: "easeIn", duration: 1, delay: 1.0, }}
            style={{
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            id="f__bottom-left"
            d="M12.5,54h12c.275,0,.5,.225,.5,.5v12c0,6.9-5.6,12.5-12.5,12.5H.5c-.275,0-.5-.225-.5-.5v-12c0-6.9,5.6-12.5,12.5-12.5Z"
            fill="white"
          />
        </clipPath>
      </svg>

      <Canvas
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          clipPath: `url(#${clipId})`,
          WebkitClipPath: `url(#${clipId})`,
          pointerEvents: "none",
        }}
      >
        {/* <StatsGl /> */}
        <group position={[0, 0, 0]}>
          <StormySkyWithLightning />
          <ambientLight intensity={Math.PI / 1.5} />
          <spotLight
            position={[0, 40, 0]}
            decay={0}
            distance={45}
            penumbra={1}
            intensity={100}
          />
          <spotLight
            position={[-20, 0, 10]}
            color="purple"
            angle={0.15}
            decay={0}
            penumbra={-1}
            intensity={30}
          />
          <spotLight
            position={[20, -10, 10]}
            color="red"
            angle={0.2}
            decay={0}
            penumbra={-1}
            intensity={20}
          />
        </group>
        <CameraControls />
      </Canvas>
    </div>
  )
}

function StormySkyWithLightning() {
  const groupRef = useRef<Group | null>(null);
  const rotatingCloudsRef = useRef<Group | null>(null);
  const ambientRef = useRef<AmbientLight | null>(null);
  const dirRef = useRef<DirectionalLight | null>(null);
  const hemiRef = useRef<HemisphereLight | null>(null);
  const flashRef = useRef<PointLight | null>(null);
  const lightningIntensity = useRef(0);
  const lightningCooldown = useRef(0);

  const stormConfig = useMemo(
    () => ({
      seed: 2,
      segments: 24,
      volume: 8,
      opacity: 0.95,
      fade: 14,
      growth: 5,
      speed: 0.12,
    }),

    [],
  );

  const random = useMemo(() => {
    const rand = (min, max) => min + Math.random() * (max - min);

    return {
      groupRotY: rand(0, Math.PI * 2),
      groupRotX: rand(-0.2, 0.2),

      mainSeed: Math.random() * 100,
      secondarySeed: Math.random() * 100,
      upperSeed: Math.random() * 100,

      offsetX: rand(-1.5, 1.5),
      offsetY: rand(-0.5, 0.5),
      offsetZ: rand(-1, 1),
    };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    
    if (!rotatingCloudsRef.current) return
    
    if (groupRef.current) {
      groupRef.current.rotation.y =
      random.groupRotY + Math.cos(t * 0.05) * 0.04;
      groupRef.current.rotation.x =
      random.groupRotX + Math.sin(t * 0.03) * 0.02;
    }
    
    if (rotatingCloudsRef.current) {
      rotatingCloudsRef.current.rotation.y -= delta * 0.05;
    }

    lightningCooldown.current -= delta;
    if (lightningCooldown.current <= 0 && Math.random() < 0.015) {
      lightningIntensity.current = 1;
      lightningCooldown.current = 1.5 + Math.random() * 3.0;
    }
    lightningIntensity.current = Math.max(
      0,
      lightningIntensity.current - delta * 3.2,
    );
    const flash = lightningIntensity.current;

    if (ambientRef.current) {
      ambientRef.current.intensity = MathUtils.lerp(
        ambientRef.current.intensity,
        0.18 + flash * 0.35,
        0.12,
      );
      ambientRef.current.color.lerp(
        new Color(flash > 0.05 ? "#fff1d6" : "#2a221c"),
        0.12,
      );
    }

    if (hemiRef.current) {
      hemiRef.current.intensity = MathUtils.lerp(
        hemiRef.current.intensity,
        0.55 + flash * 0.35,
        0.12,
      );
      hemiRef.current.color.lerp(new Color("#ffe6bf"), 0.1);
      hemiRef.current.groundColor.lerp(new Color("#120d0a"), 0.1); 
    }

    if (dirRef.current) {
      dirRef.current.intensity = MathUtils.lerp(
        dirRef.current.intensity,
        0.3 + flash * 0.2,
        0.12,
      );
      dirRef.current.color.lerp(new Color("#ffd9a3"), 0.1);
    }

    if (flashRef.current) {
      flashRef.current.intensity = MathUtils.lerp(
        flashRef.current.intensity,
        flash * 10,
        0.18,
      );
      flashRef.current.color.lerp(new Color("#fff5df"), 0.18);
    }
  });

  return (
    <>
      <color attach="background" args={["#f2e6cf"]} />
      <fog attach="fog" args={["#e2d4bb", 10, 32]} />

      <ambientLight ref={ambientRef} intensity={0.18} color="#2a221c" />
      <hemisphereLight ref={hemiRef} args={["#ffe6bf", "#e9c4ad", 0.55]} />

      <directionalLight
        ref={dirRef}
        position={[-6, 8, -4]}
        intensity={0.3}
        color="#ffd9a3"
      />

      <pointLight
        ref={flashRef}
        position={[1, -1.5, -2]}
        intensity={0}
        distance={18}
        decay={2}
        color="#fff5df"
      />

      <group ref={groupRef}>
        <group ref={rotatingCloudsRef}>
          <Clouds>
            <Cloud
              {...stormConfig}
              seed={random.mainSeed}
              bounds={[8, 2, 8]}
              position={[
                random.offsetX * 0.5,
                -4.7 + random.offsetY,
                -3 + random.offsetZ,
              ]}
              color="#dbd0d0"
            />
            <Cloud
              {...stormConfig}
              bounds={[8, 2, 8]}
              color="#eadcdc"
              opacity={0.98}
            />
            <Cloud
              concentrate="outside"
              growth={90}
              color="#171717"
              opacity={0.95}
              seed={0.4}
              bounds={120}
              volume={120}
            />
          </Clouds>

          <Clouds>
            <Cloud
              seed={random.secondarySeed}
              segments={28}
              volume={7}
              opacity={0.95}
              fade={12}
              growth={5}
              speed={0.08}
              bounds={[7, 1.5, 7]}
              position={[
                3.5 + random.offsetX,
                -4.2 + random.offsetY,
                -4.5 + random.offsetZ,
              ]}
              color="#0d0d0d"
            />
          </Clouds>

          <Clouds>
            <Cloud
              seed={random.upperSeed}
              segments={26}
              volume={6}
              opacity={0.92}
              fade={10}
              growth={4}
              speed={0.06}
              bounds={[6, 1.2, 5]}
              position={[2.5, -1.8, -5]}
              color="#141414"
            />
          </Clouds>
        </group>
      </group>
    </>
  );
}