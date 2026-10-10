
"use client";
import Script from "next/script";

export default function UnicornInput() {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.UnicornStudio?.init();
        }}
      />

      <div className="relative w-[300px] h-[50px] isolate">
        <div
          data-us-project="L6l26Vw3a195iPAMpHlm"
          data-us-dpi="2"
          className="relative z-10 w-[50px] h-[50px]"
        />

        <div
          data-us-project="mLLgC5iIQbWKoiajoHe8"
          data-us-dpi="2"
          className="absolute inset-0 z-0"
        />
      </div>
    </>
  );
}
