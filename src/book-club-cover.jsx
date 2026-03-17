import { useState, useRef, useEffect, useCallback } from "react";

const DEFAULT_EVENTS = [
  { date: "2026.03.26", day: "Thursday", lang: "English", title: "Monthly Book Club - The Body Keeps the Score", location: "Altair Teaház" },
  { date: "2026.03.28", day: "Saturday", lang: "English", title: "Budapest Silent Book Club 108", location: "FSZEK Teréz krt." },
  { date: "2026.04.02", day: "Thursday", lang: "Hungarian", title: "Csendes Könyvklub", location: "FSZEK Központi Könyvtár / Ötpacsirta 4." },
  { date: "2026.04.11", day: "Saturday", lang: "English", title: "Budapest Silent Book Club 109", location: "FSZEK Teréz krt." },
  { date: "2026.04.16", day: "Thursday", lang: "Hungarian", title: "Csendes Könyvklub", location: "FSZEK Központi Könyvtár / Ötpacsirta 4." },
];

const FORMATS = {
  fb_cover: { w: 1200, h: 628, label: "Facebook Cover (1200×628)" },
  fb_event: { w: 1920, h: 1005, label: "Facebook Event (1920×1005)" },
  ig_post: { w: 1080, h: 1080, label: "Instagram Post (1080×1080)" },
};

function drawWavyBg(ctx, w, h) {
  ctx.fillStyle = "#f5efe0";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#c9a030";

  // Top-left blob
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.4, 0);
  ctx.bezierCurveTo(w * 0.34, h * 0.1, w * 0.2, h * 0.25, w * 0.08, h * 0.38);
  ctx.bezierCurveTo(w * 0.02, h * 0.44, 0, h * 0.4, 0, h * 0.48);
  ctx.closePath();
  ctx.fill();

  // Top-right small
  ctx.beginPath();
  ctx.moveTo(w * 0.75, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h * 0.1);
  ctx.bezierCurveTo(w * 0.93, h * 0.07, w * 0.84, h * 0.03, w * 0.75, 0);
  ctx.closePath();
  ctx.fill();

  // Bottom-right blob
  ctx.beginPath();
  ctx.moveTo(w, h * 0.52);
  ctx.lineTo(w, h);
  ctx.lineTo(w * 0.58, h);
  ctx.bezierCurveTo(w * 0.66, h * 0.86, w * 0.8, h * 0.7, w * 0.92, h * 0.6);
  ctx.bezierCurveTo(w * 0.97, h * 0.56, w, h * 0.54, w, h * 0.52);
  ctx.closePath();
  ctx.fill();

  // Bottom-left small
  ctx.beginPath();
  ctx.moveTo(0, h * 0.88);
  ctx.lineTo(0, h);
  ctx.lineTo(w * 0.25, h);
  ctx.bezierCurveTo(w * 0.18, h * 0.95, w * 0.06, h * 0.91, 0, h * 0.88);
  ctx.closePath();
  ctx.fill();

  // Thin wavy lines
  ctx.strokeStyle = "rgba(50, 45, 35, 0.3)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.3);
  ctx.bezierCurveTo(w * 0.15, h * 0.2, w * 0.38, h * 0.06, w * 0.58, h * 0.09);
  ctx.bezierCurveTo(w * 0.78, h * 0.12, w * 0.92, h * 0.03, w, h * 0.07);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, h * 0.74);
  ctx.bezierCurveTo(w * 0.22, h * 0.8, w * 0.48, h * 0.9, w * 0.68, h * 0.7);
  ctx.bezierCurveTo(w * 0.82, h * 0.56, w * 0.94, h * 0.63, w, h * 0.56);
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

export default function BookClubCover() {
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [format, setFormat] = useState("fb_cover");
  const [headerText, setHeaderText] = useState("Budapest Silent Book Club");
  const [subText, setSubText] = useState("Upcoming Events");
  const canvasRef = useRef(null);
  const [bgImage, setBgImage] = useState(null);
  const [rendering, setRendering] = useState(false);
  const fileRef = useRef(null);

  const updateEvent = (idx, field, value) => {
    setEvents((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };
  const addEvent = () => {
    setEvents((prev) => [...prev, { date: "2026.00.00", day: "Nap", lang: "Hungarian", title: "Esemény neve", location: "Helyszín" }]);
  };
  const removeEvent = (idx) => {
    setEvents((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCustomBg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => setBgImage(img);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = FORMATS[format];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    if (bgImage) {
      const imgRatio = bgImage.width / bgImage.height;
      const canvasRatio = w / h;
      let sw, sh, sx, sy;
      if (imgRatio > canvasRatio) {
        sh = bgImage.height; sw = sh * canvasRatio; sx = (bgImage.width - sw) / 2; sy = 0;
      } else {
        sw = bgImage.width; sh = sw / canvasRatio; sx = 0; sy = (bgImage.height - sh) / 2;
      }
      ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, w, h);
    } else {
      drawWavyBg(ctx, w, h);
    }

    // Overlay box
    ctx.fillStyle = "rgba(245, 240, 230, 0.86)";
    const pad = w * 0.06;
    const boxX = pad;
    const boxY = h * 0.1;
    const boxW = w - pad * 2;
    const boxH = h * 0.82;
    roundRect(ctx, boxX, boxY, boxW, boxH, 20);

    const s = w / 1200;

    // Header
    ctx.fillStyle = "#2d2a24";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.round(40 * s)}px Georgia, serif`;
    ctx.fillText(headerText, w / 2, boxY + 55 * s);

    // Sub
    ctx.fillStyle = "#8a7a5a";
    ctx.font = `${Math.round(20 * s)}px Georgia, serif`;
    ctx.fillText(subText, w / 2, boxY + 85 * s);

    // Divider
    ctx.strokeStyle = "#c8b88a";
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(boxX + boxW * 0.15, boxY + 102 * s);
    ctx.lineTo(boxX + boxW * 0.85, boxY + 102 * s);
    ctx.stroke();

    // Events
    const evStartY = boxY + 140 * s;
    const availH = boxH - 155 * s;
    const evSpacing = Math.min(72 * s, availH / Math.max(events.length, 1));

    events.forEach((ev, i) => {
      const y = evStartY + i * evSpacing;

      ctx.fillStyle = "#b8922f";
      ctx.font = `bold ${Math.round(26 * s)}px Georgia, serif`;
      ctx.textAlign = "left";
      ctx.fillText(ev.date, boxX + 36 * s, y);

      ctx.fillStyle = "#2d2a24";
      ctx.font = `${Math.round(20 * s)}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText(ev.day, w * 0.43, y);

      const langColor = ev.lang.toLowerCase() === "hungarian" ? "#b8922f" : "#5a7a5a";
      const langX = w * 0.58;
      const bW = 115 * s, bH = 28 * s;
      ctx.fillStyle = langColor;
      roundRect(ctx, langX - bW / 2, y - bH * 0.72, bW, bH, 14 * s);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.round(14 * s)}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText(ev.lang, langX, y - 1 * s);

      ctx.fillStyle = "#666";
      ctx.font = `${Math.round(15 * s)}px Georgia, serif`;
      ctx.textAlign = "right";
      ctx.fillText(ev.title, boxX + boxW - 36 * s, y);

      ctx.fillStyle = "#6a5a3a";
      ctx.font = `italic ${Math.round(16 * s)}px Georgia, serif`;
      ctx.textAlign = "left";
      ctx.fillText(ev.location, boxX + 36 * s, y + 22 * s);

      if (i < events.length - 1) {
        ctx.strokeStyle = "rgba(200,184,138,0.35)";
        ctx.lineWidth = 1 * s;
        ctx.beginPath();
        ctx.moveTo(boxX + 30 * s, y + evSpacing * 0.5);
        ctx.lineTo(boxX + boxW - 30 * s, y + evSpacing * 0.5);
        ctx.stroke();
      }
    });
  }, [bgImage, events, format, headerText, subText]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) { setRendering(false); return; }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `book-club-${format}.png`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setRendering(false);
          }, 200);
        },
        "image/png"
      );
    } catch {
      setRendering(false);
      alert("Hiba! Próbáld meg újratölteni a háttérképet a Feltöltés gombbal.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e6", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ fontSize: 26, color: "#2d2a24", marginBottom: 4, fontWeight: 700 }}>Book Club Cover Editor</h1>
        <p style={{ color: "#8a7a5a", fontSize: 14, marginBottom: 20 }}>Szerkeszd az eseményeket, válaszd ki a formátumot, és töltsd le a képet.</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {Object.entries(FORMATS).map(([key, val]) => (
            <button key={key} onClick={() => setFormat(key)} style={{
              padding: "8px 16px", borderRadius: 8,
              border: format === key ? "2px solid #b8922f" : "2px solid #ddd",
              background: format === key ? "#b8922f" : "#fff",
              color: format === key ? "#fff" : "#2d2a24",
              fontFamily: "Georgia, serif", fontSize: 13, cursor: "pointer",
              fontWeight: format === key ? 700 : 400,
            }}>{val.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Cím</label>
            <input value={headerText} onChange={(e) => setHeaderText(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Alcím</label>
            <input value={subText} onChange={(e) => setSubText(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ minWidth: 150 }}>
            <label style={labelStyle}>Háttérkép (opcionális)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleCustomBg} style={{ display: "none" }} />
            <button onClick={() => fileRef.current?.click()} style={{ ...btnStyle, background: "#e8e0d0", color: "#2d2a24", width: "100%", fontSize: 13 }}>
              {bgImage ? "Csere" : "Feltöltés"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2d2a24" }}>Események</span>
            <button onClick={addEvent} style={{ ...btnStyle, background: "#5a7a5a", fontSize: 12, padding: "6px 14px" }}>+ Új esemény</button>
          </div>
          {events.map((ev, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "#fff", padding: "10px 12px", borderRadius: 10, border: "1px solid #e8e0d0", marginBottom: 8 }}>
              <input value={ev.date} onChange={(e) => updateEvent(i, "date", e.target.value)} style={{ ...smInput, width: 110 }} placeholder="Dátum" />
              <input value={ev.day} onChange={(e) => updateEvent(i, "day", e.target.value)} style={{ ...smInput, width: 100 }} placeholder="Nap" />
              <select value={ev.lang} onChange={(e) => updateEvent(i, "lang", e.target.value)} style={{ ...smInput, width: 100, cursor: "pointer" }}>
                <option value="Hungarian">Magyar</option>
                <option value="English">Angol</option>
              </select>
              <input value={ev.title} onChange={(e) => updateEvent(i, "title", e.target.value)} style={{ ...smInput, flex: 1, minWidth: 140 }} placeholder="Cím" />
              <input value={ev.location} onChange={(e) => updateEvent(i, "location", e.target.value)} style={{ ...smInput, flex: 1, minWidth: 120 }} placeholder="Helyszín" />
              <button onClick={() => removeEvent(i)} style={{ background: "none", border: "none", color: "#c44", fontSize: 20, cursor: "pointer", padding: "0 6px" }}>×</button>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#2d2a24", display: "block", marginBottom: 8 }}>Előnézet</span>
          <div style={{ borderRadius: 12, overflow: "hidden", border: "2px solid #e8e0d0", background: "#fff" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </div>

        <button onClick={exportImage} disabled={rendering} style={{
          ...btnStyle, background: rendering ? "#ccc" : "#b8922f",
          fontSize: 16, padding: "14px 32px", width: "100%",
          cursor: rendering ? "not-allowed" : "pointer",
        }}>
          {rendering ? "Generálás..." : `Letöltés PNG (${FORMATS[format].label})`}
        </button>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, color: "#8a7a5a", display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontFamily: "Georgia, serif", fontSize: 14, color: "#2d2a24", background: "#fff", boxSizing: "border-box" };
const smInput = { padding: "7px 10px", borderRadius: 6, border: "1.5px solid #e8e0d0", fontFamily: "Georgia, serif", fontSize: 13, color: "#2d2a24", background: "#faf8f4", boxSizing: "border-box" };
const btnStyle = { padding: "10px 20px", borderRadius: 8, border: "none", background: "#b8922f", color: "#fff", fontFamily: "Georgia, serif", fontSize: 14, cursor: "pointer", fontWeight: 700 };
