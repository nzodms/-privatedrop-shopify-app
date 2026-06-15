import { useEffect, useState } from "react";

interface SplashScreenProps {
  /** Durée d'affichage avant la transition (900–1500 ms recommandé). */
  duration?: number;
  /** Appelé une fois le fondu de sortie terminé. */
  onDone?: () => void;
  /** Sous-titre optionnel sous le logo. */
  caption?: string;
}

/**
 * Écran d'accueil premium post-installation.
 * Fond clair, logo centré, micro fade + scale, puis fondu de sortie.
 * Volontairement sobre : aucune interface chargée, aucun texte long.
 */
export function SplashScreen({
  duration = 1200,
  onDone,
  caption,
}: SplashScreenProps) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const visibleFor = reduceMotion ? 400 : duration;
    const fadeOut = window.setTimeout(() => setPhase("out"), visibleFor);
    const finish = window.setTimeout(() => onDone?.(), visibleFor + 480);

    return () => {
      window.clearTimeout(fadeOut);
      window.clearTimeout(finish);
    };
  }, [duration, onDone]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#fbfbfa",
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        opacity: phase === "out" ? 0 : 1,
        transition: "opacity 460ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          transform: phase === "out" ? "scale(1.01)" : "scale(1)",
          transition: "transform 460ms cubic-bezier(0.22, 1, 0.36, 1)",
          animation: "pd-splash-in 620ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        <PrivateDropMark />
        {caption ? (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              letterSpacing: "0.01em",
              color: "#8a8a92",
            }}
          >
            {caption}
          </p>
        ) : null}
      </div>

      <style>{`
        @keyframes pd-splash-in {
          from { opacity: 0; transform: translateY(6px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden="true"] * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}

function PrivateDropMark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        color: "#0b0b0f",
      }}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width="32"
          height="32"
          rx="9"
          stroke="#0b0b0f"
          strokeWidth="1.4"
        />
        <path
          d="M11 23V11h5.4a3.8 3.8 0 0 1 0 7.6H14"
          stroke="#0b0b0f"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        PrivateDrop
      </span>
    </div>
  );
}
