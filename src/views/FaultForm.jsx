import { useState } from "react";
import { vehicles } from "../data.js";

const faultOptions = {
  ebike:   ["Elektrische aandrijving", "Pizza Box houder", "Lekke band", "Spaken", "Sleutel kwijt", "Overig"],
  scooter: ["Elektrische aandrijving", "Pizza Box houder", "Lekke band", "Spaken", "Sleutel kwijt", "Overig"],
  car:     ["Start niet", "Lekke band", "Ongeluk", "Onderhoud", "Overig"],
};

const typeLabel = { ebike: "E-Bike 🔴", scooter: "E-Scooter 🔵", car: "Auto ⚫", bus: "Bus 🟡" };

export default function FaultForm({ user, onSubmit, onBack }) {
  const myVehicles = vehicles.filter(v => v.location === user.location && v.status !== "hub");
  const [vehicleId, setVehicleId] = useState("");
  const [faultType, setFaultType] = useState("");
  const [notes, setNotes]         = useState("");
  const [photos, setPhotos]       = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const selected = myVehicles.find(v => v.id === vehicleId);
  const options  = selected ? faultOptions[selected.type] || [] : [];

  const handlePhoto = (e) => {
    const files = Array.from(e.target.files);
    const urls  = files.map(f => URL.createObjectURL(f));
    setPhotos(p => [...p, ...urls].slice(0, 6));
  };

  const handleSubmit = () => {
    if (!vehicleId || !faultType || photos.length < 1) return;
    setSubmitted(true);
    onSubmit({ vehicleId, faultType, notes, photos });
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div className="page-title" style={{ marginBottom: 8 }}>Melding verstuurd!</div>
        <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 8 }}>
          Beste {user.name}, bedankt voor je melding. We bezoeken je locatie zo snel mogelijk.
        </div>
        <div style={{ fontFamily: "'Barlow Condensed'", letterSpacing: 2, fontSize: 11, color: "var(--muted)", marginBottom: 28 }}>
          — Hi Tom Fleet Team
        </div>
        <button className="btn btn-ghost" onClick={onBack}>← Terug naar dashboard</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb16">
        <div>
          <div className="page-title">Storing melden</div>
          <div className="page-sub">Eén voertuig per formulier · {user.locationName}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Terug</button>
      </div>

      {/* Intro text */}
      <div className="card" style={{ marginBottom: 24, borderTopColor: "var(--gold)", background: "#FFFBF0" }}>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 2, color: "var(--gold)", marginBottom: 6 }}>
          INSTRUCTIE
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ink)" }}>
          We kunnen ons beter voorbereiden als storingen zo duidelijk en specifiek mogelijk worden gemeld.
          Beschrijf het probleem gedetailleerd en upload zo volledig mogelijke foto's.
          Dit bespaart ons tijd en kosten. We rekenen op jouw medewerking.
        </div>
      </div>

      <div className="card">
        {/* Step 1: Vehicle */}
        <div className="form-group">
          <label className="form-label">① Voertuig selecteren</label>
          <select className="form-control" value={vehicleId} onChange={e => { setVehicleId(e.target.value); setFaultType(""); }}>
            <option value="">— Kies voertuig —</option>
            {myVehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.id} — {typeLabel[v.type]} {v.status === "fault" ? "⚠" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Fault type */}
        {selected && (
          <div className="form-group">
            <label className="form-label">② Type storing</label>
            <select className="form-control" value={faultType} onChange={e => setFaultType(e.target.value)}>
              <option value="">— Kies storing —</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}

        {/* Step 3: Photos */}
        {faultType && (
          <div className="form-group">
            <label className="form-label">③ Foto's uploaden <span style={{ color: "var(--red)" }}>* minimaal 2 vereist</span></label>
            <div
              className="photo-box"
              onClick={() => document.getElementById("photo-input").click()}
            >
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handlePhoto}
              />
              {photos.length === 0 ? (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                  <div className="photo-box-label">Klik om foto's te kiezen</div>
                </>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {photos.map((src, i) => (
                    <img key={i} src={src} alt="" className="photo-thumb" />
                  ))}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, background: "#F5E6CC", borderRadius: 3, fontSize: 22, cursor: "pointer" }}>+</div>
                </div>
              )}
            </div>
            {photos.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--green)", marginTop: 4, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
                ✓ {photos.length} foto{photos.length !== 1 ? "'s" : ""} geselecteerd
              </div>
            )}
          </div>
        )}

        {/* Step 4: Notes */}
        {faultType && (
          <div className="form-group">
            <label className="form-label">④ Aanvullende opmerkingen <span style={{ color: "var(--muted)" }}>(optioneel)</span></label>
            <textarea
              className="form-control"
              placeholder="Beschrijf het probleem zo specifiek mogelijk…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        )}

        {/* Submit */}
        {faultType && (
          <button
            className="btn btn-red"
            style={{ width: "100%", padding: "14px", fontSize: 15 }}
            onClick={handleSubmit}
            disabled={photos.length < 1}
          >
            Storing versturen →
          </button>
        )}

        {faultType && photos.length < 1 && (
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--red)", marginTop: 8, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
            Upload minimaal 1 foto om door te gaan
          </div>
        )}
      </div>
    </div>
  );
}
