import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";

// ─── Composants utilitaires ───

function Badge({ children, color }) {
  const colors = {
    green:  { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
    amber:  { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
    gray:   { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" },
    orange: { background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" },
  };
  return (
    <span style={{ ...colors[color], borderRadius: 9999, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", display: "inline-block" }}>
      {children}
    </span>
  );
}

const TOUR_SHORT  = { tour1: "15 mars", tour2: "22 mars", both: "15 & 22 mars" };

function ConnectionStatus({ status }) {
  if (status === "pending") return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
      <span style={{ fontSize: 18 }}>⏳</span>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412" }}>Mise en relation en cours</div>
    </div>
  );
  if (status === "confirmed") return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
      <span style={{ fontSize: 18 }}>✅</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Mise en relation confirmée</div>
        <div style={{ fontSize: 12, color: "#15803d" }}>Pensez à établir la procuration sur maprocuration.gouv.fr</div>
      </div>
    </div>
  );
  return null;
}

function PersonCard({ person, type, connectionStatus }) {
  const isM = type === "mandataire";
  const accent = isM ? "#c2410c" : "#b45309";
  const isTermine = !!person.termine;

  return (
    <div style={{
      background: isTermine ? "#f3f4f6" : "#fff",
      border: `1px solid ${isTermine ? "#d1d5db" : "#fed7aa"}`,
      borderRadius: 14, padding: 20, opacity: isTermine ? 0.75 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: isTermine ? "#d1d5db" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 16,
        }}>
          {person.prenom[0]}{person.nom[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: isTermine ? "#9ca3af" : "#1f2937" }}>
            {person.prenom} {person.nom.charAt(0)}.
          </div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>{isM ? "Mandataire" : "Mandant"}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: person.message ? 10 : 0 }}>
        <Badge color="orange">{TOUR_SHORT[person.tours]}</Badge>
      </div>
      {person.message && (
        <p style={{ fontSize: 14, color: "#4b5563", margin: "10px 0 0", fontStyle: "italic", lineHeight: 1.5 }}>
          "{person.message}"
        </p>
      )}
      {isTermine && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#e5e7eb", borderRadius: 8, padding: "8px 12px", marginTop: 10 }}>
          <span>🔒</span>
          <span style={{ fontSize: 13, color: "#6b7280" }}>Ne cherche plus de mise en relation</span>
        </div>
      )}
      {connectionStatus && <ConnectionStatus status={connectionStatus} />}
    </div>
  );
}

// ─── Application publique ───

export default function PublicApp() {
  const [mandataires, setMandataires]   = useState([]);
  const [mandants, setMandants]         = useState([]);
  const [connections, setConnections]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState("home");
  const [formType, setFormType]         = useState(null);
  const [filterTour, setFilterTour]     = useState("all");
  const [form, setForm]                 = useState({ nom: "", prenom: "", email: "", tel: "", tours: "both", message: "" });
  const [toast, setToast]               = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [formSuccess, setFormSuccess]   = useState(false);

  const showToast = (msg, color = "#ea580c") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    const [m1, m2, c] = await Promise.all([
      supabase.from("mandataires").select("*").order("created_at", { ascending: true }),
      supabase.from("mandants").select("*").order("created_at", { ascending: true }),
      supabase.from("connections").select("*"),
    ]);
    if (m1.data) setMandataires(m1.data);
    if (m2.data) setMandants(m2.data);
    if (c.data) setConnections(c.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "mandataires" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "mandants" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const getConnectionStatus = (personId) => {
    const conn = connections.find(c => c.mandataire_id === personId || c.mandant_id === personId);
    return conn ? conn.status : null;
  };

  const stats = {
    mandataires: mandataires.filter(m => !m.termine && !getConnectionStatus(m.id)).length,
    mandants:    mandants.filter(m => !m.termine && !getConnectionStatus(m.id)).length,
    connected:   connections.length,
  };

  const filtered = (list) => filterTour === "all" ? list : list.filter(p => p.tours === filterTour || p.tours === "both");

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      showToast("Veuillez remplir les champs obligatoires.", "#ef4444");
      return;
    }
    setSubmitting(true);
    const table = formType === "mandataire" ? "mandataires" : "mandants";
    const { error } = await supabase
      .from(table)
      .insert([{ prenom: form.prenom, nom: form.nom, email: form.email, tel: form.tel || null, tours: form.tours, message: form.message || null }]);
    setSubmitting(false);
    if (error) {
      showToast("Erreur : " + error.message, "#ef4444");
      return;
    }
    setForm({ nom: "", prenom: "", email: "", tel: "", tours: "both", message: "" });
    setFormSuccess(true);
    fetchData();
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🗳️</div>
        <div style={{ color: "#6b7280" }}>Chargement…</div>
      </div>
    </div>
  );

  const sortByDate = (a, b) => new Date(a.created_at) - new Date(b.created_at);

  return (
    <div style={{ minHeight: "100vh" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 2000,
          background: toast.color, color: "#fff", padding: "10px 24px", borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>{toast.msg}</div>
      )}

      {/* HEADER */}
      <header style={{
        background: "linear-gradient(135deg, #7c2d12 0%, #c2410c 40%, #ea580c 70%, #f97316 100%)",
        color: "#fff", padding: "12px 16px",
        boxShadow: "0 4px 20px rgba(234,88,12,0.3)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, opacity: 0.1, pointerEvents: "none" }}>
          <svg viewBox="0 0 600 40" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
            <polygon points="0,40 50,15 120,30 200,5 280,25 350,10 420,20 500,8 560,22 600,12 600,40" fill="#fff" />
          </svg>
        </div>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <img src="/lsr_logo.png" alt="Le Seignus Renaissance" style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.8 }}>Allos 04260</div>
            <h1 style={{ margin: "2px 0 1px", fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>Procurations Électorales</h1>
            <p style={{ margin: "0 0 8px", opacity: 0.85, fontSize: 11 }}>Élections municipales • 15 et 22 mars 2026</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {[
                { n: stats.mandataires, l: `Mandataire${stats.mandataires > 1 ? "s" : ""} dispo.`, tab: "mandataires" },
                { n: stats.mandants,    l: `Mandant${stats.mandants > 1 ? "s" : ""} en attente`, tab: "mandants" },
                { n: stats.connected,   l: `Mise${stats.connected > 1 ? "s" : ""} en relation`, tab: null },
              ].map((s, i) => (
                <div key={i} onClick={s.tab ? () => setTab(s.tab) : undefined} style={{
                  background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px",
                  cursor: s.tab ? "pointer" : "default", textAlign: "center",
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 9, opacity: 0.85, whiteSpace: "nowrap" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* NAV BASSE */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "#fff", borderTop: "1px solid #e5e7eb",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)", display: "flex",
      }}>
        {[
          { id: "home",        icon: "🏠",  line1: "Accueil",      line2: "" },
          { id: "mandataires", icon: "🗳️",  line1: "Mandataires",  line2: "(présents)" },
          { id: "mandants",    icon: "📋",  line1: "Mandants",     line2: "(absents)" },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setFormSuccess(false); }} style={{
            flex: 1, padding: "10px 8px 14px", border: "none", background: "transparent",
            color: tab === t.id ? "#c2410c" : "#9ca3af",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            cursor: "pointer", position: "relative",
          }}>
            {tab === t.id && <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 3, background: "#c2410c", borderRadius: "0 0 3px 3px" }} />}
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === t.id ? 700 : 500, lineHeight: 1.2 }}>{t.line1}</span>
            {t.line2 && <span style={{ fontSize: 10, lineHeight: 1, opacity: 0.8 }}>{t.line2}</span>}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 90px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

          {/* ═══ HOME ═══ */}
          {tab === "home" && (
            <div>
              <h3 style={{ margin: "0 0 12px", color: "#1f2937", fontSize: 16 }}>ℹ️ Comment ça marche ?</h3>

              {/* Cas 1 — Absent */}
              <div style={{ background: "#fffbeb", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #fde68a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>📋</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#92400e" }}>Je serai absent(e) le jour du vote</div>
                    <div style={{ fontSize: 12, color: "#b45309" }}>→ Je cherche un mandataire</div>
                  </div>
                </div>
                {[
                  ["Inscrivez-vous dans l'onglet ", <strong key="a">Mandants (absents)</strong>, " en indiquant vos coordonnées et disponibilités."],
                  ["L'équipe du ", <strong key="b">Seignus Renaissance</strong>, " examine les inscriptions et recherche un mandataire compatible."],
                  ["Vous serez contacté(e) ", <strong key="c">directement</strong>, " avec les coordonnées de votre mandataire."],
                  ["Établissez ensemble la procuration sur ", <strong key="d">maprocuration.gouv.fr</strong>, "."],
                ].map((content, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    <span style={{ background: "#d97706", color: "#fff", borderRadius: "50%", width: 22, height: 22, minWidth: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                    <span>{content}</span>
                  </div>
                ))}
                <button onClick={() => { setFormType("mandant"); setTab("form"); setFormSuccess(false); }} style={{
                  marginTop: 12, width: "100%", background: "linear-gradient(135deg, #d97706, #b45309)",
                  color: "#fff", border: "none", borderRadius: 10, padding: "12px 16px",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>📋 M'inscrire comme mandant</button>
              </div>

              {/* Cas 2 — Présent */}
              <div style={{ background: "#fff7ed", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #fed7aa" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>🗳️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#9a3412" }}>Je serai présent(e) le jour du vote</div>
                    <div style={{ fontSize: 12, color: "#c2410c" }}>→ Je deviens mandataire</div>
                  </div>
                </div>
                {[
                  ["Inscrivez-vous dans l'onglet ", <strong key="a">Mandataires (présents)</strong>, " en indiquant vos coordonnées et disponibilités."],
                  ["L'équipe du ", <strong key="b">Seignus Renaissance</strong>, " examine les inscriptions et recherche un mandant compatible."],
                  ["Vous serez contacté(e) ", <strong key="c">directement</strong>, " avec les coordonnées de votre mandant."],
                  ["Établissez ensemble la procuration sur ", <strong key="d">maprocuration.gouv.fr</strong>, "."],
                ].map((content, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    <span style={{ background: "#ea580c", color: "#fff", borderRadius: "50%", width: 22, height: 22, minWidth: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                    <span>{content}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, fontSize: 12, color: "#92400e", background: "#fef3c7", borderRadius: 8, padding: "6px 10px" }}>
                  ⚠️ Vous ne pouvez détenir qu'<strong>une seule procuration</strong> établie en France.
                </div>
                <button onClick={() => { setFormType("mandataire"); setTab("form"); setFormSuccess(false); }} style={{
                  marginTop: 12, width: "100%", background: "linear-gradient(135deg, #ea580c, #c2410c)",
                  color: "#fff", border: "none", borderRadius: 10, padding: "12px 16px",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>🙋 M'inscrire comme mandataire</button>
              </div>

              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <p style={{ margin: 0, fontSize: 12, color: "#0c4a6e", lineHeight: 1.5 }}>
                  <strong>Confidentialité :</strong> vos coordonnées ne sont jamais affichées publiquement. Elles ne sont transmises qu'en cas de mise en relation par l'équipe.
                </p>
              </div>
            </div>
          )}

          {/* ═══ FORMULAIRE ═══ */}
          {tab === "form" && formType && !formSuccess && (
            <div>
              <button onClick={() => setTab("home")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>← Retour</button>
              <h2 style={{ margin: "0 0 20px", fontSize: 20, color: "#1f2937" }}>
                {formType === "mandataire" ? "🙋 Inscription mandataire" : "📋 Inscription mandant"}
              </h2>

              {[
                { key: "prenom", label: "Prénom *",                    ph: "Votre prénom" },
                { key: "nom",    label: "Nom *",                       ph: "Votre nom de famille" },
                { key: "email",  label: "Email * (confidentiel)",      ph: "votre@email.com", type: "email" },
                { key: "tel",    label: "Téléphone (confidentiel, optionnel)", ph: "06 ...", type: "tel" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.ph} value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  />
                  {(f.key === "email" || f.key === "tel") && (
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>🔒 Ne sera communiqué qu'en cas de mise en relation</p>
                  )}
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Disponibilité / Besoin *</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["both", "Les deux tours"], ["tour1", "1er tour (15 mars)"], ["tour2", "2nd tour (22 mars)"]].map(([v, l]) => (
                    <button key={v} onClick={() => setForm({ ...form, tours: v })} style={{
                      padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      border: form.tours === v ? "2px solid #ea580c" : "1px solid #d1d5db",
                      background: form.tours === v ? "#fff7ed" : "#fff",
                      color: form.tours === v ? "#9a3412" : "#6b7280",
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Message (optionnel)</label>
                <textarea placeholder="Un petit mot pour vous présenter…" value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })} rows={3}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              <button onClick={handleSubmit} disabled={submitting} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #ea580c, #c2410c)",
                color: "#fff", fontSize: 16, fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
              }}>{submitting ? "Envoi en cours…" : "Valider mon inscription"}</button>
            </div>
          )}

          {/* ═══ CONFIRMATION ═══ */}
          {tab === "form" && formSuccess && (
            <div style={{ textAlign: "center", padding: "24px 8px" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
              }}>✅</div>
              <h2 style={{ margin: "0 0 12px", fontSize: 22, color: "#1f2937", fontWeight: 800 }}>Inscription enregistrée !</h2>
              <p style={{ margin: "0 0 24px", fontSize: 15, color: "#6b7280", lineHeight: 1.6 }}>
                Votre inscription a bien été prise en compte.<br />
                L'équipe du Seignus Renaissance vous contactera dès qu'une mise en relation sera possible.
              </p>
              <button onClick={() => { setTab("home"); setFormSuccess(false); setFormType(null); }} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #ea580c, #c2410c)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>← Retour à l'accueil</button>
            </div>
          )}

          {/* ═══ LISTES ═══ */}
          {(tab === "mandataires" || tab === "mandants") && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 20, color: "#1f2937" }}>
                  {tab === "mandataires" ? "🙋 Mandataires" : "📋 Mandants"}
                </h2>
                <button onClick={() => { setFormType(tab === "mandataires" ? "mandataire" : "mandant"); setTab("form"); setFormSuccess(false); }} style={{
                  background: "#ea580c", color: "#fff", border: "none", borderRadius: 8,
                  padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>+ S'inscrire</button>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {[["all", "Tous"], ["tour1", "1er tour"], ["tour2", "2nd tour"], ["both", "Deux tours"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterTour(v)} style={{
                    padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: filterTour === v ? "2px solid #ea580c" : "1px solid #e5e7eb",
                    background: filterTour === v ? "#fff7ed" : "#fff",
                    color: filterTour === v ? "#9a3412" : "#6b7280",
                  }}>{l}</button>
                ))}
              </div>

              {(() => {
                const list = tab === "mandataires" ? mandataires : mandants;
                const f = filtered(list);
                if (f.length === 0) return (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === "mandataires" ? "🙋" : "📋"}</div>
                    <p style={{ fontSize: 15, margin: 0 }}>Aucune inscription pour le moment.</p>
                    <p style={{ fontSize: 13 }}>Soyez le/la premier(e) !</p>
                  </div>
                );
                const active = f.filter(p => !p.termine && !getConnectionStatus(p.id)).sort(sortByDate);
                const done   = f.filter(p =>  p.termine || !!getConnectionStatus(p.id)).sort(sortByDate);
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[...active, ...done].map(p => (
                      <PersonCard key={p.id} person={p}
                        type={tab === "mandataires" ? "mandataire" : "mandant"}
                        connectionStatus={getConnectionStatus(p.id)}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "24px 16px 32px", color: "#9ca3af", fontSize: 12 }}>
        <p style={{ margin: 0, fontWeight: 600, color: "#78716c" }}>Le Seignus Renaissance</p>
        <p style={{ margin: "4px 0 0" }}>Initiative citoyenne · Vos coordonnées ne sont jamais affichées publiquement.</p>
      </footer>
    </div>
  );
}
