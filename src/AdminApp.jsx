import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";

const ADMIN_EMAILS = ["julien.roger@me.com", "franckjouve@yahoo.fr"];

const TOUR_SHORT  = { tour1: "15 mars", tour2: "22 mars", both: "15 & 22 mars" };
const TOUR_LABELS = { tour1: "1er tour (15 mars)", tour2: "2nd tour (22 mars)", both: "Les deux tours" };

function generateEmailText(mandataire, mandant) {
  return `Bonjour,

L'équipe du Seignus Renaissance a établi une mise en relation pour les procurations électorales d'Allos (15 et 22 mars 2026).

──────────────────────────────
MANDATAIRE (présent le jour du vote)
Nom : ${mandataire.prenom} ${mandataire.nom}
Email : ${mandataire.email}${mandataire.tel ? `\nTéléphone : ${mandataire.tel}` : ""}
Disponibilité : ${TOUR_LABELS[mandataire.tours] || mandataire.tours}
──────────────────────────────
MANDANT (absent le jour du vote)
Nom : ${mandant.prenom} ${mandant.nom}
Email : ${mandant.email}${mandant.tel ? `\nTéléphone : ${mandant.tel}` : ""}
Besoin : ${TOUR_LABELS[mandant.tours] || mandant.tours}
──────────────────────────────

Prenez contact entre vous pour organiser la procuration, puis :
→ Le mandant établit la procuration sur maprocuration.gouv.fr en indiquant l'identité du mandataire.

Cordialement,
L'équipe du Seignus Renaissance – Allos`;
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 16, padding: 32, maxWidth: 480, width: "90%", boxShadow: "0 25px 50px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── Page de login admin ───

function AdminLogin({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [step, setStep]         = useState("input"); // input | sent | error
  const [loading, setLoading]   = useState(false);
  const [errMsg, setErrMsg]     = useState("");

  const handleSend = async () => {
    const e = email.trim().toLowerCase();
    if (!ADMIN_EMAILS.includes(e)) {
      setErrMsg("Cet email n'est pas autorisé à accéder à l'interface admin.");
      setStep("error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + "/admin" },
    });
    setLoading(false);
    if (error) {
      setErrMsg("Erreur : " + error.message);
      setStep("error");
    } else {
      setStep("sent");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, maxWidth: 400, width: "90%", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/lsr_logo.png" alt="LSR" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", marginBottom: 16 }} />
          <h1 style={{ margin: 0, fontSize: 20, color: "#1f2937", fontWeight: 800 }}>Administration</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>Procurations Allos — Accès restreint</p>
        </div>

        {step === "input" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email administrateur</label>
              <input
                type="email" placeholder="votre@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button onClick={handleSend} disabled={loading || !email} style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: email ? "linear-gradient(135deg, #ea580c, #c2410c)" : "#d1d5db",
              color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: email && !loading ? "pointer" : "not-allowed",
              opacity: loading ? 0.7 : 1,
            }}>{loading ? "Envoi…" : "Recevoir le lien de connexion"}</button>
          </>
        )}

        {step === "sent" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>
              Un lien de connexion a été envoyé à <strong>{email}</strong>.<br />
              Cliquez dessus pour accéder à l'interface admin.
            </p>
            <button onClick={() => { setStep("input"); setEmail(""); }} style={{
              marginTop: 16, background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13
            }}>← Retour</button>
          </div>
        )}

        {step === "error" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
            <p style={{ fontSize: 14, color: "#ef4444", lineHeight: 1.6, marginBottom: 16 }}>{errMsg}</p>
            <button onClick={() => { setStep("input"); setErrMsg(""); }} style={{
              background: "#f3f4f6", border: "none", color: "#374151", cursor: "pointer",
              fontSize: 13, padding: "8px 16px", borderRadius: 8, fontWeight: 600,
            }}>← Retour</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Interface admin ───

export default function AdminApp() {
  const [session, setSession]           = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [mandataires, setMandataires]   = useState([]);
  const [mandants, setMandants]         = useState([]);
  const [connections, setConnections]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);

  // Modals
  const [editModal, setEditModal]             = useState(null); // { person, type }
  const [editForm, setEditForm]               = useState({ prenom: "", nom: "", email: "", tel: "", tours: "both", message: "" });
  const [editSubmitting, setEditSubmitting]   = useState(false);
  const [confirmDelete, setConfirmDelete]     = useState(null); // { type, id }
  const [resetModal, setResetModal]           = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [connectModal, setConnectModal]       = useState(false);
  const [newConnMandataire, setNewConnMandataire] = useState("");
  const [newConnMandant, setNewConnMandant]   = useState("");
  const [connSubmitting, setConnSubmitting]   = useState(false);
  const [emailPreviewModal, setEmailPreviewModal] = useState(null); // { mandataire, mandant }
  const [copied, setCopied]                   = useState(false);

  const showToast = (msg, color = "#ea580c") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Auth ───

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // ─── Data ───

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

  useEffect(() => {
    if (session) fetchData();
  }, [session, fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "mandataires" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "mandants" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // ─── Helpers ───

  const getConnectionStatus = (personId) => {
    const conn = connections.find(c => c.mandataire_id === personId || c.mandant_id === personId);
    return conn ? conn.status : null;
  };

  const getConnectionPartner = (personId) => {
    const conn = connections.find(c => c.mandataire_id === personId || c.mandant_id === personId);
    if (!conn) return null;
    const partnerId = conn.mandataire_id === personId ? conn.mandant_id : conn.mandataire_id;
    return [...mandataires, ...mandants].find(p => p.id === partnerId) || null;
  };

  // ─── Actions ───

  const handleEditOpen = (person, type) => {
    setEditForm({ prenom: person.prenom, nom: person.nom, email: person.email || "", tel: person.tel || "", tours: person.tours, message: person.message || "" });
    setEditModal({ person, type });
  };

  const handleEditSubmit = async () => {
    if (!editForm.prenom || !editForm.nom) { showToast("Champs obligatoires manquants.", "#ef4444"); return; }
    setEditSubmitting(true);
    const table = editModal.type === "mandataire" ? "mandataires" : "mandants";
    const { error } = await supabase.from(table).update({
      prenom: editForm.prenom, nom: editForm.nom, email: editForm.email,
      tel: editForm.tel || null, tours: editForm.tours, message: editForm.message || null,
    }).eq("id", editModal.person.id);
    setEditSubmitting(false);
    if (error) showToast("Erreur : " + error.message, "#ef4444");
    else { setEditModal(null); showToast("Modifié !"); fetchData(); }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    const table = type === "mandataire" ? "mandataires" : "mandants";
    await supabase.from("connections").delete().or(`mandataire_id.eq.${id},mandant_id.eq.${id}`);
    await supabase.from(table).delete().eq("id", id);
    setConfirmDelete(null);
    showToast("Supprimé.", "#6b7280");
    fetchData();
  };

  const handleToggleTermine = async (person, type, newValue) => {
    const table = type === "mandataire" ? "mandataires" : "mandants";
    const { error } = await supabase.from(table).update({ termine: newValue }).eq("id", person.id);
    if (error) showToast("Erreur : " + error.message, "#ef4444");
    else { showToast(newValue ? "Marqué terminé." : "Réactivé !"); fetchData(); }
  };

  const handleDeleteConnection = async (id) => {
    const { error } = await supabase.from("connections").delete().eq("id", id);
    if (error) showToast("Erreur suppression : " + error.message, "#ef4444");
    else { showToast("Mise en relation supprimée.", "#6b7280"); fetchData(); }
  };

  const handleConfirmConnection = async (id) => {
    const { error } = await supabase.from("connections").update({ status: "confirmed" }).eq("id", id);
    if (error) showToast("Erreur confirmation : " + error.message, "#ef4444");
    else { showToast("Procuration confirmée !"); fetchData(); }
  };

  const handleCreateConnection = async () => {
    if (!newConnMandataire || !newConnMandant) { showToast("Sélectionnez un mandataire et un mandant.", "#ef4444"); return; }
    setConnSubmitting(true);
    const { error } = await supabase.from("connections").insert([{
      mandataire_id: newConnMandataire, mandant_id: newConnMandant, status: "pending",
    }]);
    setConnSubmitting(false);
    if (error) showToast("Erreur : " + error.message, "#ef4444");
    else {
      const mand = mandataires.find(p => p.id === newConnMandataire);
      const mant = mandants.find(p => p.id === newConnMandant);
      setConnectModal(false);
      setNewConnMandataire("");
      setNewConnMandant("");
      fetchData();
      setEmailPreviewModal({ mandataire: mand, mandant: mant });
    }
  };

  const handleResetDB = async () => {
    await supabase.from("connections").delete().not("id", "is", null);
    await supabase.from("mandataires").delete().not("id", "is", null);
    await supabase.from("mandants").delete().not("id", "is", null);
    setResetModal(false);
    setResetConfirmText("");
    showToast("Base réinitialisée.", "#6b7280");
    fetchData();
  };

  // ─── Vérification admin ───

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6b7280" }}>Chargement…</div>
    </div>
  );

  if (!session) return <AdminLogin />;

  const userEmail = session.user?.email;
  if (!ADMIN_EMAILS.includes(userEmail)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <p style={{ color: "#ef4444", fontWeight: 700 }}>Accès non autorisé ({userEmail})</p>
        <button onClick={handleSignOut} style={{ background: "#f3f4f6", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Se déconnecter</button>
      </div>
    );
  }

  // ─── Render ───

  const availableMandataires = mandataires.filter(m => !getConnectionStatus(m.id));
  const availableMandants    = mandants.filter(m => !getConnectionStatus(m.id));

  const personRow = (p, type) => {
    const connStatus  = getConnectionStatus(p.id);
    const partner     = getConnectionPartner(p.id);
    const isMandataire = type === "mandataire";
    const accentBg    = isMandataire ? "#fff7ed" : "#fffbeb";
    const accentBorder = isMandataire ? "#fed7aa" : "#fde68a";
    const accentColor  = isMandataire ? "#c2410c" : "#b45309";

    return (
      <div key={p.id} style={{ background: p.termine ? "#f3f4f6" : "#f9fafb", border: `1px solid ${p.termine ? "#d1d5db" : "#e5e7eb"}`, borderRadius: 10, padding: "12px 14px", opacity: p.termine ? 0.8 : 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>
              {p.prenom} {p.nom}
              {p.termine && <span style={{ marginLeft: 8, fontSize: 11, color: "#9ca3af" }}>🔒 terminé</span>}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              📧 {p.email}
              {p.tel && <span> · 📱 {p.tel}</span>}
              <span> · 📅 {TOUR_SHORT[p.tours]}</span>
            </div>
            {p.message && <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginTop: 2 }}>"{p.message}"</div>}
            {connStatus && (
              <div style={{ marginTop: 4, fontSize: 11, color: connStatus === "confirmed" ? "#166534" : "#9a3412" }}>
                {connStatus === "confirmed" ? "✅ Confirmée" : "⏳ En cours"} avec {partner ? `${partner.prenom} ${partner.nom}` : "?"}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
            <button onClick={() => handleToggleTermine(p, type, !p.termine)} style={{
              background: p.termine ? accentBg : "#f3f4f6", color: p.termine ? accentColor : "#6b7280",
              border: `1px solid ${p.termine ? accentBorder : "#e5e7eb"}`, borderRadius: 8,
              padding: "5px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600,
            }}>{p.termine ? "🔄 Réactiver" : "🔒 Terminer"}</button>
            <button onClick={() => handleEditOpen(p, type)} style={{
              background: accentBg, color: accentColor, border: `1px solid ${accentBorder}`,
              borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600,
            }}>✏️ Modifier</button>
            <button onClick={() => setConfirmDelete({ type, id: p.id })} style={{
              background: "#fff", color: "#9ca3af", border: "1px solid #e5e7eb",
              borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer",
            }}>🗑️</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 2000,
          background: toast.color, color: "#fff", padding: "10px 24px", borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>{toast.msg}</div>
      )}

      {/* HEADER */}
      <header style={{
        background: "linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)",
        color: "#fff", padding: "14px 20px",
        boxShadow: "0 4px 20px rgba(234,88,12,0.3)",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/lsr_logo.png" alt="LSR" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Administration</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Procurations Allos · {userEmail}</div>
            </div>
          </div>
          <button onClick={handleSignOut} style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 12,
            cursor: "pointer", fontWeight: 600,
          }}>Se déconnecter</button>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 40px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Chargement…</div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
              {[
                { label: "Mandataires",       value: mandataires.length,  color: "#c2410c" },
                { label: "Mandants",          value: mandants.length,     color: "#b45309" },
                { label: "Mises en relation", value: connections.length,  color: "#166534" },
                { label: "Disponibles",       value: availableMandataires.length + availableMandants.length, color: "#1d4ed8" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", flex: "1 1 120px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Mises en relation */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#1f2937" }}>🤝 Mises en relation ({connections.length})</h2>
                <button onClick={() => { setConnectModal(true); setNewConnMandataire(""); setNewConnMandant(""); }} style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff",
                  border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>+ Créer une mise en relation</button>
              </div>

              {connections.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucune mise en relation.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {connections.map(c => {
                    const mand = mandataires.find(p => p.id === c.mandataire_id);
                    const mant = mandants.find(p => p.id === c.mandant_id);
                    return (
                      <div key={c.id} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>
                            {c.status === "confirmed" ? "✅" : "⏳"} {mand ? `${mand.prenom} ${mand.nom}` : "?"} ↔ {mant ? `${mant.prenom} ${mant.nom}` : "?"}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            Mandataire : {mand?.email || "?"}{mand?.tel ? ` · ${mand.tel}` : ""}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            Mandant : {mant?.email || "?"}{mant?.tel ? ` · ${mant.tel}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          {c.status === "pending" && (
                            <button onClick={() => handleConfirmConnection(c.id)} style={{
                              background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0",
                              borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600,
                            }}>Valider la procuration</button>
                          )}
                          <button onClick={() => handleDeleteConnection(c.id)} style={{
                            background: "#fff", color: "#9ca3af", border: "1px solid #e5e7eb",
                            borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer",
                          }}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mandataires */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#c2410c" }}>🗳️ Mandataires ({mandataires.length})</h2>
              {mandataires.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucun mandataire.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mandataires.map(p => personRow(p, "mandataire"))}
                </div>
              )}
            </div>

            {/* Mandants */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#b45309" }}>📋 Mandants ({mandants.length})</h2>
              {mandants.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucun mandant.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mandants.map(p => personRow(p, "mandant"))}
                </div>
              )}
            </div>

            {/* Zone dangereuse */}
            <div style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#991b1b" }}>⚠️ Zone dangereuse</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>
                La réinitialisation supprime <strong>toutes les inscriptions et connexions</strong> de façon irréversible.
              </p>
              <button onClick={() => setResetModal(true)} style={{
                background: "#ef4444", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>🗑️ Réinitialiser la base de données</button>
            </div>
          </>
        )}
      </main>

      {/* Modal : créer mise en relation */}
      <Modal open={connectModal} onClose={() => setConnectModal(false)}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, color: "#1f2937" }}>🤝 Créer une mise en relation</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Mandataire (présent)</label>
          <select value={newConnMandataire} onChange={e => setNewConnMandataire(e.target.value)} style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, outline: "none",
          }}>
            <option value="">— Choisir un mandataire —</option>
            {availableMandataires.map(p => (
              <option key={p.id} value={p.id}>{p.prenom} {p.nom} · {p.email} · {TOUR_SHORT[p.tours]}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Mandant (absent)</label>
          <select value={newConnMandant} onChange={e => setNewConnMandant(e.target.value)} style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, outline: "none",
          }}>
            <option value="">— Choisir un mandant —</option>
            {availableMandants.map(p => (
              <option key={p.id} value={p.id}>{p.prenom} {p.nom} · {p.email} · {TOUR_SHORT[p.tours]}</option>
            ))}
          </select>
        </div>

        <button onClick={handleCreateConnection} disabled={!newConnMandataire || !newConnMandant || connSubmitting} style={{
          width: "100%", padding: "13px", borderRadius: 10, border: "none",
          background: newConnMandataire && newConnMandant ? "linear-gradient(135deg, #16a34a, #15803d)" : "#d1d5db",
          color: "#fff", fontWeight: 700, fontSize: 15,
          cursor: newConnMandataire && newConnMandant && !connSubmitting ? "pointer" : "not-allowed",
          opacity: connSubmitting ? 0.7 : 1, marginBottom: 8,
        }}>{connSubmitting ? "Création…" : "Créer la mise en relation"}</button>
        <button onClick={() => setConnectModal(false)} style={{
          width: "100%", padding: "11px", borderRadius: 10,
          border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280",
          fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>Annuler</button>
      </Modal>

      {/* Modal : prévisualisation email mise en relation */}
      <Modal open={!!emailPreviewModal} onClose={() => { setEmailPreviewModal(null); setCopied(false); }}>
        {emailPreviewModal && (() => {
          const { mandataire, mandant } = emailPreviewModal;
          const subject = "Mise en relation – Procurations Allos";
          const body = generateEmailText(mandataire, mandant);
          const mailto = `mailto:${mandataire.email},${mandant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

          return (
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 18, color: "#166534" }}>✅ Mise en relation créée</h3>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>Envoyez cet email aux deux parties.</p>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Destinataires</div>
                <div style={{ background: "#f3f4f6", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1f2937", fontFamily: "monospace" }}>
                  {mandataire.email}, {mandant.email}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Objet</div>
                <div style={{ background: "#f3f4f6", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1f2937" }}>
                  {subject}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Corps du message</div>
                <pre style={{
                  background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8,
                  padding: "12px 14px", fontSize: 12, color: "#374151", lineHeight: 1.6,
                  whiteSpace: "pre-wrap", fontFamily: "monospace", maxHeight: 260, overflowY: "auto", margin: 0,
                }}>{body}</pre>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={() => {
                  navigator.clipboard.writeText(body);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }} style={{
                  flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb",
                  background: copied ? "#dcfce7" : "#f9fafb", color: copied ? "#166534" : "#374151",
                  fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}>
                  {copied ? "✅ Copié !" : "📋 Copier le texte"}
                </button>
                <a href={mailto} style={{
                  flex: 1, padding: "11px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #ea580c, #c2410c)", color: "#fff",
                  fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "center",
                  textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  ✉️ Ouvrir dans Mail
                </a>
              </div>

              <button onClick={() => { setEmailPreviewModal(null); setCopied(false); }} style={{
                width: "100%", padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb",
                background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>Fermer</button>
            </div>
          );
        })()}
      </Modal>

      {/* Modal : édition */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, color: "#1f2937" }}>✏️ Modifier</h3>
        {[
          { key: "prenom", label: "Prénom *",  ph: "Prénom" },
          { key: "nom",    label: "Nom *",     ph: "Nom" },
          { key: "email",  label: "Email *",   ph: "email@example.com", type: "email" },
          { key: "tel",    label: "Téléphone", ph: "06 ...", type: "tel" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
            <input type={f.type || "text"} placeholder={f.ph} value={editForm[f.key]}
              onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Tours</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(TOUR_LABELS).map(([v, l]) => (
              <button key={v} onClick={() => setEditForm({ ...editForm, tours: v })} style={{
                padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: editForm.tours === v ? "2px solid #ea580c" : "1px solid #d1d5db",
                background: editForm.tours === v ? "#fff7ed" : "#fff",
                color: editForm.tours === v ? "#9a3412" : "#6b7280",
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Message</label>
          <textarea value={editForm.message} onChange={e => setEditForm({ ...editForm, message: e.target.value })} rows={3}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>
        <button onClick={handleEditSubmit} disabled={editSubmitting} style={{
          width: "100%", padding: "13px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #ea580c, #c2410c)", color: "#fff",
          fontWeight: 700, fontSize: 15, cursor: editSubmitting ? "not-allowed" : "pointer",
          opacity: editSubmitting ? 0.7 : 1, marginBottom: 8,
        }}>{editSubmitting ? "Enregistrement…" : "Enregistrer"}</button>
        <button onClick={() => setEditModal(null)} style={{
          width: "100%", padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb",
          background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>Annuler</button>
      </Modal>

      {/* Modal : suppression */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <h3 style={{ margin: "0 0 12px", fontSize: 18, color: "#1f2937" }}>Supprimer cette inscription ?</h3>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>Le profil et ses mises en relation seront supprimés définitivement.</p>
        <button onClick={doDelete} style={{
          width: "100%", padding: "12px", borderRadius: 10, border: "none",
          background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8,
        }}>Oui, supprimer</button>
        <button onClick={() => setConfirmDelete(null)} style={{
          width: "100%", padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb",
          background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>Annuler</button>
      </Modal>

      {/* Modal : reset DB */}
      <Modal open={resetModal} onClose={() => { setResetModal(false); setResetConfirmText(""); }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 20, color: "#991b1b" }}>⚠️ Réinitialiser la base</h3>
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "#7f1d1d", lineHeight: 1.6 }}>
          Supprime <strong>toutes les inscriptions et connexions</strong>. Irréversible.
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#374151" }}>
          Tapez exactement : <strong>RÉINITIALISER</strong>
        </p>
        <input value={resetConfirmText} onChange={e => setResetConfirmText(e.target.value)}
          placeholder="RÉINITIALISER"
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #fca5a5", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 16, fontFamily: "monospace" }}
        />
        <button onClick={handleResetDB} disabled={resetConfirmText !== "RÉINITIALISER"} style={{
          width: "100%", padding: "13px", borderRadius: 10, border: "none",
          background: resetConfirmText === "RÉINITIALISER" ? "#ef4444" : "#d1d5db",
          color: "#fff", fontWeight: 700, fontSize: 15,
          cursor: resetConfirmText === "RÉINITIALISER" ? "pointer" : "not-allowed",
          marginBottom: 8,
        }}>Confirmer la suppression</button>
        <button onClick={() => { setResetModal(false); setResetConfirmText(""); }} style={{
          width: "100%", padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb",
          background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>Annuler</button>
      </Modal>
    </div>
  );
}
