// src/pages/Scanner.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { rtdb } from "../firebase";
import { ref, runTransaction } from "firebase/database";
import { Html5Qrcode } from "html5-qrcode";

const QR_BOX_SIZE = 260;

export default function Scanner() {
  const [status, setStatus] = useState("idle"); // idle | success
  const [count, setCount] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [pressing, setPressing] = useState(false);

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const cooldownRef = useRef(false);

  const handleBadgeScan = async () => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setPressing(true);

    try {
      let newCount = null;
      await runTransaction(ref(rtdb, "attendance/count"), (current) => {
        newCount = (current || 0) + 1;
        return newCount;
      });
      setCount(newCount);
      setStatus("success");
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setStatus("idle");
      setPressing(false);
      cooldownRef.current = false;
    }, 2000);
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isRunningRef.current) {
      try { await scannerRef.current.stop(); } catch (_) {}
      scannerRef.current = null;
      isRunningRef.current = false;
      setIsRunning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (isRunningRef.current || scannerRef.current) return;
    const el = document.getElementById("qr-reader");
    if (!el) return;
    setCameraError(null);

    const tryStart = async (facingMode) => {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode },
        { fps: 10, qrbox: { width: QR_BOX_SIZE, height: QR_BOX_SIZE } },
        () => {}, // we ignore auto-scans — button only
        () => {}
      );
      isRunningRef.current = true;
      setIsRunning(true);
    };

    try {
      await tryStart("environment");
    } catch {
      try {
        await tryStart("user");
      } catch {
        scannerRef.current = null;
        setCameraError("Camera not accessible. Allow camera permission and use HTTPS.");
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => startScanner(), 400);
    return () => { clearTimeout(t); stopScanner(); };
  }, [startScanner, stopScanner]);

  const isSuccess = status === "success";
  const squareColor = isSuccess ? "#00e676" : "#e62b1e";

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem 1rem",
      gap: "1.5rem",
      fontFamily: "'Bebas Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        #qr-reader { width:100%!important; border:none!important; background:transparent!important; }
        #qr-reader video { width:100%!important; height:100%!important; object-fit:cover!important; display:block!important; }
        #qr-reader__scan_region { width:100%!important; background:transparent!important; }
        #qr-reader__scan_region img { display:none!important; }
        #qr-reader__dashboard { display:none!important; }
        #qr-reader__status_span { display:none!important; }

        @keyframes scanLine {
          0%   { top: calc(50% - 130px); opacity:0; }
          10%  { opacity:1; }
          90%  { opacity:1; }
          100% { top: calc(50% + 128px); opacity:0; }
        }
        @keyframes successRing {
          0%   { box-shadow: 0 0 0px 0px #00e67600; }
          50%  { box-shadow: 0 0 0px 12px #00e67633; }
          100% { box-shadow: 0 0 0px 0px #00e67600; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.85); opacity:0; }
          60%  { transform: scale(1.06); opacity:1; }
          100% { transform: scale(1); }
        }
        @keyframes btnPress {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.93); }
          100% { transform: scale(1); }
        }
        @keyframes cornerBlink {
          0%,100% { opacity:1; }
          50%     { opacity:0.3; }
        }
        .scan-btn {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          transition: filter 0.15s;
        }
        .scan-btn:active { filter: brightness(0.85); }
        .scan-btn::after {
          content:'';
          position:absolute;
          inset:0;
          background: radial-gradient(circle at center, rgba(255,255,255,0.18) 0%, transparent 70%);
          opacity:0;
          transition: opacity 0.2s;
        }
        .scan-btn:active::after { opacity:1; }
      `}</style>

      <p style={{ color:"#e62b1e", fontSize:"1rem", letterSpacing:"0.4em", margin:0 }}>
        WELCOME DESK — SCANNER
      </p>

      {/* ── Camera viewport ── */}
      <div style={{
        position: "relative",
        width: "min(88vw, 340px)",
        height: "min(88vw, 340px)",
        borderRadius: "18px",
        overflow: "hidden",
        background: "#0d0d0d",
        animation: isSuccess ? "successRing 0.6s ease" : "none",
      }}>
        <div id="qr-reader" style={{ width:"100%", height:"100%" }} />

        {/* Dark vignette — transparent centre */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:`
            linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)) top    / 100% calc(50% - 130px) no-repeat,
            linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)) bottom / 100% calc(50% - 130px) no-repeat,
            linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)) left   / calc(50% - 130px) 100% no-repeat,
            linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)) right  / calc(50% - 130px) 100% no-repeat
          `,
        }} />

        {/* Square border */}
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)",
          width:`${QR_BOX_SIZE}px`, height:`${QR_BOX_SIZE}px`,
          border:`2px solid ${squareColor}`,
          borderRadius:"8px", pointerEvents:"none",
          transition:"border-color 0.3s, box-shadow 0.3s",
          boxShadow: isSuccess ? `0 0 20px ${squareColor}66` : "none",
        }} />

        {/* Corner L-brackets */}
        {[
          { top:"calc(50% - 130px)", left:"calc(50% - 130px)", borderTop:`3px solid ${squareColor}`, borderLeft:`3px solid ${squareColor}` },
          { top:"calc(50% - 130px)", left:"calc(50% + 106px)", borderTop:`3px solid ${squareColor}`, borderRight:`3px solid ${squareColor}` },
          { top:"calc(50% + 106px)", left:"calc(50% - 130px)", borderBottom:`3px solid ${squareColor}`, borderLeft:`3px solid ${squareColor}` },
          { top:"calc(50% + 106px)", left:"calc(50% + 106px)", borderBottom:`3px solid ${squareColor}`, borderRight:`3px solid ${squareColor}` },
        ].map((s, i) => (
          <div key={i} style={{
            position:"absolute", width:"26px", height:"26px",
            pointerEvents:"none", transition:"border-color 0.3s",
            animation: !isSuccess ? `cornerBlink 2s ease-in-out ${i*0.2}s infinite` : "none",
            ...s,
          }} />
        ))}

        {/* Scan line — idle only */}
        {isRunning && !isSuccess && (
          <div style={{
            position:"absolute",
            left:"calc(50% - 124px)", width:"248px", height:"2px",
            background:"linear-gradient(90deg, transparent, #e62b1e, transparent)",
            animation:"scanLine 2.2s ease-in-out infinite",
            pointerEvents:"none",
          }} />
        )}

        {/* Success tick overlay */}
        {isSuccess && (
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:`${QR_BOX_SIZE}px`, height:`${QR_BOX_SIZE}px`,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"#00e67618", borderRadius:"8px",
            animation:"popIn 0.35s ease",
            pointerEvents:"none",
          }}>
            <span style={{ fontSize:"4rem", lineHeight:1 }}>✓</span>
          </div>
        )}
      </div>

      {/* Camera error */}
      {cameraError && (
        <div style={{ background:"#1a0000", border:"1px solid #e62b1e", borderRadius:"10px", padding:"0.8rem 1.2rem", color:"#e62b1e", fontFamily:"monospace", fontSize:"0.78rem", maxWidth:"340px", textAlign:"center" }}>
          ⚠ {cameraError}
        </div>
      )}

      {/* ── BIG SCAN BADGE BUTTON ── */}
      <button
        className="scan-btn"
        onClick={handleBadgeScan}
        disabled={!isRunning || cooldownRef.current}
        style={{
          width: "min(88vw, 340px)",
          padding: "1.2rem 0",
          borderRadius: "14px",
          border: isSuccess ? "2px solid #00e676" : "2px solid #e62b1e",
          background: isSuccess
            ? "linear-gradient(135deg, #003d1a, #005c28)"
            : pressing
            ? "linear-gradient(135deg, #b01e14, #e62b1e)"
            : "linear-gradient(135deg, #e62b1e, #ff4433)",
          color: "#fff",
          fontSize: "1.8rem",
          letterSpacing: "0.2em",
          fontFamily: "'Bebas Neue', sans-serif",
          boxShadow: isSuccess
            ? "0 0 24px #00e67644"
            : "0 4px 24px #e62b1e55",
          transition: "all 0.25s ease",
          animation: pressing ? "btnPress 0.25s ease" : "none",
        }}
      >
        {isSuccess
          ? `✓  CHECKED IN — #${String(count).padStart(3, "0")}`
          : "⬡  SCAN BADGE"}
      </button>

      {/* Start / Stop camera */}
      <div style={{ display:"flex", gap:"0.75rem" }}>
        {!isRunning ? (
          <button onClick={startScanner} style={{ background:"#1a1a1a", color:"#e62b1e", border:"1px solid #e62b1e", borderRadius:"8px", padding:"0.55rem 1.5rem", fontSize:"0.85rem", fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"0.15em", cursor:"pointer" }}>
            START CAMERA
          </button>
        ) : (
          <button onClick={stopScanner} style={{ background:"transparent", color:"#444", border:"1px solid #222", borderRadius:"8px", padding:"0.55rem 1.5rem", fontSize:"0.85rem", fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"0.15em", cursor:"pointer" }}>
            STOP CAMERA
          </button>
        )}
      </div>
    </div>
  );
}