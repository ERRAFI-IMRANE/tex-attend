// src/pages/Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { rtdb } from "../firebase";
import { ref, onValue } from "firebase/database";
import logo from "../imgs/logo-white.png";
import smokeVideo from "../imgs/videoplayback.mp4";

export default function Dashboard() {
  const [count, setCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [scans, setScans] = useState([]);
  const prevRef = useRef(0);

  useEffect(() => {
    const attendRef = ref(rtdb, "attendance");
    const scansRef = ref(rtdb, "scans");

    const unsubAttend = onValue(attendRef, (snapshot) => {
      const val = snapshot.val();
      const newCount = val?.count ?? 0;

      if (newCount !== prevRef.current) {
        setPrevCount(prevRef.current);
        prevRef.current = newCount;
        setCount(newCount);
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
    });

    const unsubScans = onValue(scansRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.entries(val)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 8);
        setScans(list);
      }
    });

    return () => {
      unsubAttend();
      unsubScans();
    };
  }, []);

  const digitStyle = () => ({
    display: "inline-block",
    color: "#fff",
    fontSize: "clamp(5rem, 18vw, 14rem)",
    lineHeight: 1,
    letterSpacing: "-0.02em",
    fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
    textShadow: flash
      ? "0 0 60px #e62b1e, 0 0 120px #e62b1e88"
      : "0 0 40px #ffffff22",
    transition: "text-shadow 0.3s ease",
  });

  const digits = String(count).padStart(3, "0").split("");

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >

      {/* 🌑 Dark Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 0,
        }}
      />

      {/* 🔴 Red accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "2px",
          height: "120px",
          background: "linear-gradient(to bottom, #e62b1e, transparent)",
          zIndex: 1,
        }}
      />

      {/* 🔝 Logo */}
      <img
        src={logo}
        alt="TEDxESTS"
        style={{
          width: "700px",
          marginBottom: "1.5rem",
          filter: "drop-shadow(0 0 15px #e62b1e)",
          zIndex: 1,
        }}
      />

      {/* Label */}
      <p
        style={{
          color: "#e62b1e",
          fontSize: "clamp(0.8rem, 2vw, 1.1rem)",
          letterSpacing: "0.4em",
          marginBottom: "1rem",
          fontFamily: "'Bebas Neue', sans-serif",
          opacity: 0.9,
          zIndex: 1,
        }}
      >
        TOTAL ATTENDEES
      </p>

      {/* Counter */}
      <div
        style={{
          display: "flex",
          gap: "clamp(0.5rem, 2vw, 1.5rem)",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        {digits.map((d, i) => (
          <div
            key={i}
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: "8px",
              padding: "0.2em 0.4em",
              boxShadow: flash ? "0 0 30px #e62b1e44" : "none",
              transition: "box-shadow 0.3s",
            }}
          >
            <span style={digitStyle()}>{d}</span>
          </div>
        ))}
      </div>

      {/* LIVE indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "2rem",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#e62b1e",
            animation: "pulse 1.5s infinite",
          }}
        />
        <span
          style={{
            color: "#555",
            fontSize: "0.85rem",
            letterSpacing: "0.2em",
            fontFamily: "monospace",
          }}
        >
          LIVE
        </span>
      </div>

      {/* Recent scans */}
      {scans.length > 0 && (
        <div
          style={{
            marginTop: "3rem",
            width: "100%",
            maxWidth: "500px",
            background: "#111",
            border: "1px solid #222",
            borderRadius: "12px",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderBottom: "1px solid #222",
              color: "#666",
              fontSize: "0.7rem",
              letterSpacing: "0.3em",
              fontFamily: "'Bebas Neue', sans-serif",
            }}
          >
            RECENT CHECK-INS
          </div>

          {scans.map((scan, i) => (
            <div
              key={scan.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.65rem 1.25rem",
                borderBottom:
                  i < scans.length - 1 ? "1px solid #1a1a1a" : "none",
                background: i === 0 ? "#1a0a0a" : "transparent",
              }}
            >
              <span
                style={{
                  color: i === 0 ? "#e62b1e" : "#555",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
              >
                #{String(scan.number).padStart(3, "0")}
              </span>

              <span
                style={{
                  color: "#333",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                }}
              >
                {new Date(scan.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}