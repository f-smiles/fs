
export default function FlutedGlassFilter() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
      <defs>
        <filter id="fluted" primitiveUnits="objectBoundingBox">
 <feImage
  x="0"
  y="0"
  width=".03"
  height="1"
  preserveAspectRatio="none"
  crossorigin="anonymous"
  result="image_0"
  href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' color-interpolation-filters='sRGB'><g><rect width='1' height='1' fill='black' /><rect width='1' height='1' fill='url(%23red)' style='mix-blend-mode:screen' /><rect width='1' height='1' fill='url(%23green)' style='mix-blend-mode:screen' /><rect width='1' height='1' fill='url(%23yellow)' style='mix-blend-mode:screen' /></g><defs><radialGradient id='yellow' cx='0' cy='0' r='1'><stop stop-color='yellow' /><stop stop-color='yellow' offset='1' stop-opacity='0' /></radialGradient><radialGradient id='green' cx='1' cy='0' r='1'><stop stop-color='green' /><stop stop-color='green' offset='1' stop-opacity='0' /></radialGradient><radialGradient id='red' cx='0' cy='1' r='1'><stop stop-color='red' /><stop stop-color='red' offset='1' stop-opacity='0' /></radialGradient></defs></svg>"
/>
          <feTile in="image_0" result="tile_0" />
          <feGaussianBlur stdDeviation=".003" in="tile_0" result="bar_smoothness" />
          <feDisplacementMap
            scale=".08"
            xChannelSelector="R"
            yChannelSelector="G"
            in="SourceGraphic"
            in2="bar_smoothness"
          />
        </filter>
      </defs>
    </svg>
  )
}