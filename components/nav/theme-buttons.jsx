'use client'
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function ThemeButtons() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="fixed flex items-center p-2 bottom-[20px] right-[20px] rounded-[2px] z-50">
      <Button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="rounded-full"
        style={{
          width: "72px",
          height: "36px",
          borderRadius: "9999px",
          backgroundColor: theme === "dark" ? "#0071e3" : "#ececec",
          border: theme === "dark" ? "5px solid #353535" : "5px solid #ececec",
	        boxShadow: 
            theme === "dark"
            ? "none"
            : "-7px -7px 15px rgba(255, 255, 255, 0.65), 7px 7px 15px rgba(70, 70, 70, 0.12), inset -7px -7px 15px rgba(255, 255, 255, 0.65), inset 7px 7px 15px rgba(70, 70, 70, 0.12)",
          outline: "none",
          cursor: "pointer",
        }}
      >
        <div
          className={theme === "dark" ? "right-[14px]" : "left-[14px]"}
          style={{
            position: "absolute",
            width: "24px",
            height: "24px",
            borderRadius: "100%",
            backgroundColor: theme === "dark" ? "#353535" : "#ececec",
            boxShadow:
              theme === "dark"
              ? "none"
              : "-7px -7px 15px rgba(255, 255, 255, 0.75), 7px 7px 15px rgba(70, 70, 70, 0.12)",
          }}
        />
        <p
          className={theme === "dark" ? "left-6" : "right-6"}
          style={{
            position: "absolute",
            color: theme === "dark" ? "#ececec" : "#52525b",
            fontSize: "14px",
          }}
        >
          {theme === "dark" ? "On" : "Off"}
        </p>
      </Button>
    </div>
  )
}