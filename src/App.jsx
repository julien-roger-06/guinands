import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";

// ─── Petits composants utilitaires ───

function Badge({ children, color }) {
  const colors = {
    green: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
    blue: { background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" },
    amber: { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
    gray: { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" },
    purple: { background: "#f3e8ff", color: "#6b21a8", border: "1px solid #e9d5ff" },
    orange: { background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" },
  };
  return (
    <span style={{ ...colors[color], borderRadius: 9999, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", display: "inline-block" }}>
      {children}
    </span>
  );
}

const TOUR_SHORT = { tour1: "15 mars", tour2: "22 mars", both: "15 & 22 mars" };
const TOUR_LABELS = { tour1: "1er tour (15 mars)", tour2: "2nd tour (22 mars)", both: "Les deux tours" };

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


function ConnectionStatus({ status }) {
  if (status === "pending") return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
      <span style={{ fontSize: 18, animation: "pulse 2s infinite" }}>⏳</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412" }}>Mise en relation en cours</div>
        <div style={{ fontSize: 12, color: "#c2410c" }}>Un email a été envoyé aux deux parties</div>
      </div>
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

function PersonCard({ person, type, connectionStatus, onRequestConnect, onDelete, onEdit, onToggleTermine, currentUserId, hasSession }) {
  const isM = type === "mandataire";
  const accent = isM ? "#c2410c" : "#b45309";
  const isMine = person.id === currentUserId;
  const hasConnection = !!connectionStatus;
  const isTermine = !!person.termine;

  return (
    <div style={{
      background: isTermine ? "#f3f4f6" : (hasConnection ? "#fafafa" : "#fff"),
      border: `1px solid ${isTermine ? "#d1d5db" : (hasConnection ? "#e5e7eb" : "#fed7aa")}`,
      borderRadius: 14, padding: 20, position: "relative", transition: "all 0.2s",
      opacity: isTermine ? 0.75 : 1,
    }}>
      {isMine && <div style={{ position: "absolute", top: 12, right: 12 }}><Badge color="purple">Vous</Badge></div>}
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
          <div style={{ fontWeight: 700, fontSize: 16, color: isTermine ? "#9ca3af" : "#1f2937" }}>{person.prenom} {person.nom.charAt(0)}.</div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>{isM ? "Mandataire" : "Mandant"}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        <Badge color="orange">{TOUR_SHORT[person.tours]}</Badge>
      </div>
      {person.message && <p style={{ fontSize: 14, color: "#4b5563", margin: "0 0 12px", fontStyle: "italic", lineHeight: 1.5 }}>"{person.message}"</p>}
      {isTermine && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#e5e7eb", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
          <span>🔒</span>
          <span style={{ fontSize: 13, color: "#6b7280" }}>Ne cherche plus de mise en relation</span>
        </div>
      )}
      {connectionStatus && <ConnectionStatus status={connectionStatus} />}
      {!hasConnection && !isMine && !isTermine && (
        <button onClick={() => onRequestConnect(person)} style={{
          marginTop: 10, background: "linear-gradient(135deg, #ea580c, #c2410c)",
          color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px",
          fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%",
        }}>🤝 Demander la mise en relation</button>
      )}
      {isMine && hasSession && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={() => onEdit(person)} style={{
            flex: 1, background: "#fff7ed", color: "#c2410c",
            border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 12px",
            fontSize: 13, cursor: "pointer", fontWeight: 600,
          }}>✏️ Modifier</button>
          <button onClick={() => onToggleTermine(person, !isTermine)} style={{
            flex: 1, background: isTermine ? "#fff7ed" : "#f3f4f6",
            color: isTermine ? "#c2410c" : "#6b7280",
            border: `1px solid ${isTermine ? "#fed7aa" : "#e5e7eb"}`,
            borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
          }}>{isTermine ? "🔄 Je cherche à nouveau" : "🔒 Ne plus chercher"}</button>
          <button onClick={() => onDelete(person.id)} style={{
            background: "transparent", color: "#9ca3af",
            border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px",
            fontSize: 13, cursor: "pointer",
          }}>Retirer</button>
        </div>
      )}
      {isMine && !hasSession && (
        <p style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          Connectez-vous via le lien reçu par email pour modifier ou retirer votre inscription.
        </p>
      )}
    </div>
  );
}

// ─── Application principale ───

export default function App() {
  const [mandataires, setMandataires] = useState([]);
  const [mandants, setMandants] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // { id, type }
  const [pendingEmail, setPendingEmail] = useState(null);
  const [tab, setTab] = useState("home");
  const [formType, setFormType] = useState(null);
  const [connectModal, setConnectModal] = useState(null);
  const [filterTour, setFilterTour] = useState("all");
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", tel: "", tours: "both", message: "" });
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authStep, setAuthStep] = useState("input");
  const [authLoading, setAuthLoading] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ prenom: "", nom: "", tel: "", tours: "both", message: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  const showToast = (msg, color = "#ea580c") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Charger les données depuis Supabase ───

  const fetchData = useCallback(async () => {
    const [m1, m2, c] = await Promise.all([
      supabase.from("mandataires").select("*").order("created_at", { ascending: false }),
      supabase.from("mandants").select("*").order("created_at", { ascending: false }),
      supabase.from("connections").select("*"),
    ]);
    if (m1.data) setMandataires(m1.data);
    if (m2.data) setMandants(m2.data);
    if (c.data) setConnections(c.data);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Temps réel : écouter les changements ───

  useEffect(() => {
    const channel = supabase
      .channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "mandataires" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "mandants" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // ─── Résoudre l'utilisateur courant depuis la session Supabase ───

  const resolveCurrentUser = useCallback(async (user) => {
    if (!user) { setCurrentUser(null); return; }
    for (const [table, type] of [["mandataires", "mandataire"], ["mandants", "mandant"]]) {
      const { data } = await supabase
        .from(table)
        .select("id, user_id")
        .eq("email", user.email)
        .maybeSingle();
      if (data) {
        if (!data.user_id) {
          await supabase.from(table).update({ user_id: user.id }).eq("id", data.id);
        }
        if (!data.user_id || data.user_id === user.id) {
          setCurrentUser({ id: data.id, type });
          setPendingEmail(null);
          return;
        }
      }
    }
    setCurrentUser(null);
  }, []);

  // ─── Authentification Supabase ───

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) resolveCurrentUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) resolveCurrentUser(session.user);
      else setCurrentUser(null);
    });
    return () => subscription.unsubscribe();
  }, [resolveCurrentUser]);

  // ─── Helpers ───

  const getConnectionStatus = (personId) => {
    const conn = connections.find(c => c.mandataire_id === personId || c.mandant_id === personId);
    return conn ? conn.status : null;
  };

  const stats = {
    mandataires: mandataires.filter(m => !m.termine && !getConnectionStatus(m.id)).length,
    mandants: mandants.filter(m => !m.termine && !getConnectionStatus(m.id)).length,
    connected: connections.length,
  };

  const isAdmin = session?.user?.email === "julien.roger@me.com";

  const myPerson = currentUser
    ? (currentUser.type === "mandataire" ? mandataires : mandants).find(p => p.id === currentUser.id)
    : null;
  const myConnection = currentUser
    ? connections.find(c => c.mandataire_id === currentUser.id || c.mandant_id === currentUser.id)
    : null;

  const filtered = (list) => filterTour === "all" ? list : list.filter(p => p.tours === filterTour || p.tours === "both");

  // ─── Magic link ───

  const handleSendMagicLink = async () => {
    if (!authEmail) return;
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail,
      options: { shouldCreateUser: true },
    });
    setAuthLoading(false);
    if (error) {
      showToast("Erreur : " + error.message, "#ef4444");
    } else {
      setAuthStep("sent");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
    setPendingEmail(null);
    setAuthEmail("");
    setAuthStep("input");
  };

  // ─── Inscription ───

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

    if (error) {
      setSubmitting(false);
      showToast("Erreur : " + error.message, "#ef4444");
      return;
    }

    // Envoyer le magic link pour activer le compte
    await supabase.auth.signInWithOtp({
      email: form.email,
      options: { shouldCreateUser: true },
    });

    setSubmitting(false);
    setPendingEmail(form.email);
    setForm({ nom: "", prenom: "", email: "", tel: "", tours: "both", message: "" });
    setFormType(null);
    setTab("confirmation");
    fetchData();
  };

  // ─── Mise en relation ───

  const handleRequestConnect = (target) => {
    if (!currentUser) {
      showToast("Inscrivez-vous d'abord.", "#ef4444");
      setTab("home");
      return;
    }
    setConnectModal(target);
  };

  const confirmConnect = async () => {
    if (!currentUser || !connectModal) return;
    setSubmitting(true);
    const isM = currentUser.type === "mandataire";

    const { error } = await supabase.from("connections").insert([{
      mandataire_id: isM ? currentUser.id : connectModal.id,
      mandant_id: isM ? connectModal.id : currentUser.id,
      status: "pending",
    }]);

    if (!error) {
      try {
        const mandataireData = isM ? myPerson : connectModal;
        const mandantData = isM ? connectModal : myPerson;
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mandataire: mandataireData, mandant: mandantData }),
        });
      } catch (e) {
        console.warn("Email non envoyé:", e);
      }
    }

    setSubmitting(false);
    setConnectModal(null);
    if (error) showToast("Erreur : " + error.message, "#ef4444");
    else {
      showToast("Mise en relation demandée !");
      fetchData();
    }
  };

  // ─── Suppression ───

  const handleDelete = (type, id) => setConfirmDelete({ type, id });

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    const table = type === "mandataire" ? "mandataires" : "mandants";
    await supabase.from("connections").delete().or(`mandataire_id.eq.${id},mandant_id.eq.${id}`);
    await supabase.from(table).delete().eq("id", id);
    setConfirmDelete(null);
    showToast("Inscription retirée.", "#6b7280");
    if (currentUser?.id === id) {
      await supabase.auth.signOut();
      setSession(null);
      setCurrentUser(null);
    }
    fetchData();
  };

  // ─── Édition ───

  const handleEditOpen = (person, personType) => {
    setEditForm({
      prenom: person.prenom,
      nom: person.nom,
      tel: person.tel || "",
      tours: person.tours,
      message: person.message || "",
    });
    setEditModal({ ...person, _editType: personType || currentUser?.type });
  };

  const handleEditSubmit = async () => {
    if (!editForm.prenom || !editForm.nom) {
      showToast("Veuillez remplir les champs obligatoires.", "#ef4444");
      return;
    }
    setEditSubmitting(true);
    const table = (editModal._editType || currentUser.type) === "mandataire" ? "mandataires" : "mandants";
    const { error } = await supabase
      .from(table)
      .update({
        prenom: editForm.prenom,
        nom: editForm.nom,
        tel: editForm.tel || null,
        tours: editForm.tours,
        message: editForm.message || null,
      })
      .eq("id", editModal.id);
    setEditSubmitting(false);
    if (error) {
      showToast("Erreur : " + error.message, "#ef4444");
    } else {
      setEditModal(null);
      showToast("Inscription modifiée !");
      fetchData();
    }
  };

  const handleToggleTermine = async (person, newValue) => {
    const table = currentUser.type === "mandataire" ? "mandataires" : "mandants";
    const { error } = await supabase.from(table).update({ termine: newValue }).eq("id", person.id);
    if (error) showToast("Erreur : " + error.message, "#ef4444");
    else {
      showToast(newValue ? "Inscription marquée comme terminée." : "Vous cherchez à nouveau !");
      fetchData();
    }
  };

  const handleResetDB = async () => {
    await supabase.from("connections").delete().not("id", "is", null);
    await supabase.from("mandataires").delete().not("id", "is", null);
    await supabase.from("mandants").delete().not("id", "is", null);
    setResetModal(false);
    setResetConfirmText("");
    showToast("Base de données réinitialisée.", "#6b7280");
    fetchData();
  };

  // ─── Rendu ───

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🗳️</div>
        <div style={{ color: "#6b7280" }}>Chargement…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 2000,
          background: toast.color, color: "#fff", padding: "10px 24px", borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", animation: "fadeIn 0.3s ease",
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
          {/* Logo */}
          <img src="/lsr_logo.png" alt="Le Seignus Renaissance" style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.8 }}>Allos 04260</div>
            <h1 style={{ margin: "2px 0 1px", fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>Procurations Électorales</h1>
            <p style={{ margin: "0 0 8px", opacity: 0.85, fontSize: 11 }}>Élections municipales • 15 et 22 mars 2026</p>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {[
                { n: stats.mandataires, l: `Mandataire${stats.mandataires > 1 ? "s" : ""} dispo.`, tab: "mandataires" },
                { n: stats.mandants, l: `Mandant${stats.mandants > 1 ? "s" : ""} en attente`, tab: "mandants" },
                { n: stats.connected, l: `Mise${stats.connected > 1 ? "s" : ""} en relation`, tab: null },
              ].map((s, i) => (
                <div key={i} onClick={s.tab ? () => setTab(s.tab) : undefined} style={{
                  background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px",
                  cursor: s.tab ? "pointer" : "default", textAlign: "center",
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 9, opacity: 0.85, whiteSpace: "nowrap" }}>{s.l}</div>
                </div>
              ))}

              <div style={{ marginLeft: "auto" }}>
                {myPerson && (
                  <span style={{ fontSize: 12, opacity: 0.9, marginRight: 8 }}>
                    👤 <strong>{myPerson.prenom} {myPerson.nom.charAt(0)}.</strong>
                  </span>
                )}
                {session ? (
                  <button onClick={handleSignOut} style={{
                    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                    color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 11,
                    cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap",
                  }}>Se déconnecter</button>
                ) : (
                  <button onClick={() => { setAuthModal(true); setAuthStep("input"); setAuthEmail(""); }} style={{
                    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                    color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 11,
                    cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap",
                  }}>🔑 Se connecter</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* NAV BASSE */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "#fff", borderTop: "1px solid #e5e7eb",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        display: "flex",
      }}>
        {[
          { id: "home", icon: "🏠", line1: "Accueil", line2: "" },
          { id: "mandataires", icon: "🗳️", line1: "Mandataires", line2: "(présents)" },
          { id: "mandants", icon: "📋", line1: "Mandants", line2: "(absents)" },
          ...(isAdmin ? [{ id: "admin", icon: "⚙️", line1: "Admin", line2: "" }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
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
              {myPerson && myConnection && (
                <div style={{ marginBottom: 20 }}>
                  <ConnectionStatus status={myConnection.status} />
                  {myConnection.status === "pending" && (
                    <p style={{ fontSize: 13, color: "#6b7280", margin: "8px 0 0", lineHeight: 1.6 }}>
                      Consultez l'email envoyé à <strong>{myPerson.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}</strong> pour les coordonnées de votre binôme.
                    </p>
                  )}
                </div>
              )}

              <h3 style={{ margin: "0 0 12px", color: "#1f2937", fontSize: 16 }}>ℹ️ Comment ça marche ?</h3>

              {/* Cas 1 — Présent */}
              <div style={{ background: "#fff7ed", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #fed7aa" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>🗳️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#9a3412" }}>Je serai présent(e) le jour du vote</div>
                    <div style={{ fontSize: 12, color: "#c2410c" }}>→ Je deviens mandataire</div>
                  </div>
                </div>
                {[
                  ["Rendez-vous dans l'onglet ", <strong key="a">Mandataires (présents)</strong>, " et inscrivez-vous."],
                  ["Parcourez l'onglet ", <strong key="b">Mandants (absents)</strong>, " et cliquez « Demander la mise en relation », ou attendez qu'un absent vous contacte."],
                  ["Vous recevrez un ", <strong key="c">email confidentiel</strong>, " avec les coordonnées de votre binôme."],
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
              </div>

              {/* Cas 2 — Absent */}
              <div style={{ background: "#fffbeb", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #fde68a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>📋</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#92400e" }}>Je serai absent(e) le jour du vote</div>
                    <div style={{ fontSize: 12, color: "#b45309" }}>→ Je cherche un mandataire</div>
                  </div>
                </div>
                {[
                  ["Rendez-vous dans l'onglet ", <strong key="a">Mandants (absents)</strong>, " et inscrivez-vous."],
                  ["Parcourez l'onglet ", <strong key="b">Mandataires (présents)</strong>, " et cliquez sur ", <strong key="c">« Demander la mise en relation »</strong>, " sur le profil de votre choix."],
                  ["Un ", <strong key="d">email confidentiel</strong>, " est envoyé aux deux parties avec vos coordonnées respectives."],
                  ["Établissez ensemble la procuration sur ", <strong key="e">maprocuration.gouv.fr</strong>, "."],
                ].map((content, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    <span style={{ background: "#d97706", color: "#fff", borderRadius: "50%", width: 22, height: 22, minWidth: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                    <span>{content}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <p style={{ margin: 0, fontSize: 12, color: "#0c4a6e", lineHeight: 1.5 }}>
                  <strong>Confidentialité :</strong> vos coordonnées ne sont jamais affichées publiquement. Elles ne sont transmises qu'en cas de mise en relation.
                </p>
              </div>

              {!currentUser ? (
                <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                  <button onClick={() => { setFormType("mandataire"); setTab("form"); }} style={{
                    background: "linear-gradient(135deg, #ea580c, #c2410c)", color: "#fff",
                    border: "none", borderRadius: 12, padding: "18px 24px", fontSize: 16,
                    fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 15px rgba(234,88,12,0.3)",
                  }}>🙋 Je serai présent(e) — Devenir mandataire</button>
                  <button onClick={() => { setFormType("mandant"); setTab("form"); }} style={{
                    background: "linear-gradient(135deg, #d97706, #b45309)", color: "#fff",
                    border: "none", borderRadius: 12, padding: "18px 24px", fontSize: 16,
                    fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 15px rgba(217,119,6,0.3)",
                  }}>📋 Je serai absent(e) — Chercher un mandataire</button>
                </div>
              ) : (
                <div style={{ background: "#fff7ed", borderRadius: 12, padding: 16, border: "1px solid #fed7aa", textAlign: "center" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 14, color: "#9a3412", fontWeight: 600 }}>Vous êtes inscrit(e) comme {currentUser.type}.</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#c2410c" }}>
                    Consultez les {currentUser.type === "mandataire" ? "mandants" : "mandataires"} disponibles.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ FORMULAIRE ═══ */}
          {tab === "form" && formType && (
            <div>
              <button onClick={() => setTab("home")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>← Retour</button>
              <h2 style={{ margin: "0 0 20px", fontSize: 20, color: "#1f2937" }}>
                {formType === "mandataire" ? "🙋 Inscription mandataire" : "📋 Inscription mandant"}
              </h2>

              {[
                { key: "prenom", label: "Prénom *", ph: "Votre prénom" },
                { key: "nom", label: "Nom *", ph: "Votre nom de famille" },
                { key: "email", label: "Email * (confidentiel)", ph: "votre@email.com", type: "email" },
                { key: "tel", label: "Téléphone (confidentiel, optionnel)", ph: "06 ...", type: "tel" },
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
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}>{submitting ? "Envoi en cours…" : "Valider mon inscription"}</button>
            </div>
          )}

          {/* ═══ CONFIRMATION EMAIL ═══ */}
          {tab === "confirmation" && pendingEmail && (
            <div style={{ textAlign: "center", padding: "16px 8px" }}>
              {/* Icône */}
              <div style={{
                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px",
                background: "linear-gradient(135deg, #ea580c, #f97316)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
              }}>✉️</div>

              <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1f2937", fontWeight: 800 }}>
                Vérifiez votre email !
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 15, color: "#6b7280", lineHeight: 1.6 }}>
                Un lien de connexion vient d'être envoyé à
              </p>

              {/* Email mis en valeur */}
              <div style={{
                background: "#fff7ed", border: "2px solid #fed7aa", borderRadius: 12,
                padding: "14px 20px", marginBottom: 28, display: "inline-block",
              }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: "#c2410c" }}>{pendingEmail}</span>
              </div>

              {/* Étapes */}
              <div style={{ background: "#f9fafb", borderRadius: 12, padding: "20px 20px", marginBottom: 24, textAlign: "left" }}>
                <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 1 }}>Que faire maintenant ?</p>
                {[
                  ["📬", "Ouvrez votre boîte mail"],
                  ["🔗", "Cliquez sur le lien « Activer mon compte »"],
                  ["✅", "Vous serez connecté(e) automatiquement"],
                ].map(([icon, text], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", background: "#fff",
                      border: "1.5px solid #e5e7eb", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 18, flexShrink: 0,
                    }}>{icon}</div>
                    <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>

              <p style={{ margin: "0 0 24px", fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
                Le lien expire dans <strong>24 heures</strong>. Vérifiez aussi vos spams si vous ne le trouvez pas.
              </p>

              {/* Bouton retour */}
              <button onClick={() => setTab("home")} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #ea580c, #c2410c)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 15px rgba(234,88,12,0.3)",
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
                {!currentUser && (
                  <button onClick={() => { setFormType(tab === "mandataires" ? "mandataire" : "mandant"); setTab("form"); }} style={{
                    background: "#ea580c", color: "#fff", border: "none", borderRadius: 8,
                    padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>+ S'inscrire</button>
                )}
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
                const sortByDate = (a, b) => new Date(a.created_at) - new Date(b.created_at);
                const active = f.filter(p => !p.termine && !getConnectionStatus(p.id)).sort(sortByDate);
                const done = f.filter(p => p.termine || !!getConnectionStatus(p.id)).sort(sortByDate);
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[...active, ...done].map(p => (
                      <PersonCard key={p.id} person={p}
                        type={tab === "mandataires" ? "mandataire" : "mandant"}
                        connectionStatus={getConnectionStatus(p.id)}
                        onRequestConnect={handleRequestConnect}
                        onDelete={(id) => handleDelete(tab === "mandataires" ? "mandataire" : "mandant", id)}
                        onEdit={handleEditOpen}
                        onToggleTermine={handleToggleTermine}
                        currentUserId={currentUser?.id}
                        hasSession={!!session}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ═══ ADMIN ═══ */}
          {tab === "admin" && isAdmin && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 20, color: "#1f2937" }}>⚙️ Administration</h2>

              {/* Mandataires */}
              <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "#c2410c" }}>🗳️ Mandataires ({mandataires.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {mandataires.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucun mandataire.</p>}
                {mandataires.map(p => (
                  <div key={p.id} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{p.prenom} {p.nom}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{p.email} · {TOUR_SHORT[p.tours]}{p.termine ? " · 🔒 terminé" : ""}{getConnectionStatus(p.id) ? ` · ${getConnectionStatus(p.id) === "confirmed" ? "✅ confirmé" : "⏳ en cours"}` : ""}</div>
                      {p.message && <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginTop: 2 }}>"{p.message}"</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleEditOpen(p, "mandataire")} style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✏️</button>
                      <button onClick={() => handleDelete("mandataire", p.id)} style={{ background: "#fff", color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mandants */}
              <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "#b45309" }}>📋 Mandants ({mandants.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
                {mandants.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucun mandant.</p>}
                {mandants.map(p => (
                  <div key={p.id} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{p.prenom} {p.nom}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{p.email} · {TOUR_SHORT[p.tours]}{p.termine ? " · 🔒 terminé" : ""}{getConnectionStatus(p.id) ? ` · ${getConnectionStatus(p.id) === "confirmed" ? "✅ confirmé" : "⏳ en cours"}` : ""}</div>
                      {p.message && <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginTop: 2 }}>"{p.message}"</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleEditOpen(p, "mandant")} style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✏️</button>
                      <button onClick={() => handleDelete("mandant", p.id)} style={{ background: "#fff", color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Zone de danger */}
              <div style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#991b1b" }}>⚠️ Zone dangereuse</h3>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>
                  La réinitialisation supprime <strong>toutes les inscriptions et connexions</strong> de façon irréversible.
                </p>
                <button onClick={() => setResetModal(true)} style={{
                  background: "#ef4444", color: "#fff", border: "none", borderRadius: 8,
                  padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>🗑️ Réinitialiser la base de données</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal mise en relation */}
      <Modal open={!!connectModal} onClose={() => setConnectModal(null)}>
        {connectModal && (
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 20, color: "#1f2937" }}>🤝 Mise en relation</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6b7280" }}>
              Vous souhaitez être mis(e) en relation avec <strong>{connectModal.prenom} {connectModal.nom.charAt(0)}.</strong> ?
            </p>
            <div style={{ background: "#f9fafb", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #ea580c, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff" }}>
                  {connectModal.prenom[0]}{connectModal.nom[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#1f2937" }}>{connectModal.prenom} {connectModal.nom.charAt(0)}.</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{TOUR_LABELS[connectModal.tours]}</div>
                </div>
              </div>
              {connectModal.message && <p style={{ fontSize: 14, color: "#4b5563", fontStyle: "italic", margin: 0 }}>"{connectModal.message}"</p>}
            </div>
            <div style={{ background: "#fff7ed", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid #fed7aa" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#9a3412", lineHeight: 1.6 }}>
                📧 Un email sera envoyé à <strong>chacune des deux parties</strong> contenant les coordonnées de l'autre.
              </p>
            </div>
            <button onClick={confirmConnect} disabled={submitting} style={{
              width: "100%", padding: "14px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #ea580c, #c2410c)", color: "#fff",
              fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1, marginBottom: 8,
            }}>{submitting ? "Envoi…" : "✉ Confirmer la mise en relation"}</button>
            <button onClick={() => setConnectModal(null)} style={{
              width: "100%", padding: "12px", borderRadius: 10,
              border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280",
              fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>Annuler</button>
          </div>
        )}
      </Modal>

      {/* Modal suppression */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 18, color: "#1f2937" }}>Retirer votre inscription ?</h3>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>Votre profil et vos éventuelles mises en relation seront supprimés.</p>
          <button onClick={doDelete} style={{
            width: "100%", padding: "12px", borderRadius: 10, border: "none",
            background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8,
          }}>Oui, retirer mon inscription</button>
          <button onClick={() => setConfirmDelete(null)} style={{
            width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #e5e7eb",
            background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>Annuler</button>
        </div>
      </Modal>

      {/* Modal authentification (magic link) */}
      <Modal open={authModal} onClose={() => { setAuthModal(false); setAuthStep("input"); setAuthEmail(""); }}>
        {authStep === "input" ? (
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, color: "#1f2937" }}>🔑 Se connecter</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
              Entrez l'email utilisé lors de votre inscription pour recevoir un lien de connexion.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email d'inscription</label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMagicLink()}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button onClick={handleSendMagicLink} disabled={authLoading || !authEmail} style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: authEmail ? "linear-gradient(135deg, #ea580c, #c2410c)" : "#d1d5db",
              color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: authEmail && !authLoading ? "pointer" : "not-allowed",
              opacity: authLoading ? 0.7 : 1, marginBottom: 8,
            }}>{authLoading ? "Envoi en cours…" : "✉ Recevoir le lien de connexion"}</button>
            <button onClick={() => { setAuthModal(false); setAuthStep("input"); setAuthEmail(""); }} style={{
              width: "100%", padding: "11px", borderRadius: 10,
              border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280",
              fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>Annuler</button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <h3 style={{ margin: "0 0 12px", fontSize: 20, color: "#1f2937" }}>Email envoyé !</h3>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>
              Un lien de connexion a été envoyé à <strong>{authEmail}</strong>.<br />
              Cliquez dessus pour vous connecter et accéder à votre inscription.
            </p>
            <button onClick={() => { setAuthModal(false); setAuthStep("input"); setAuthEmail(""); }} style={{
              width: "100%", padding: "12px", borderRadius: 10,
              border: "none", background: "linear-gradient(135deg, #ea580c, #c2410c)",
              color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>OK, j'ai compris</button>
          </div>
        )}
      </Modal>

      {/* Modal édition */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 20, color: "#1f2937" }}>✏️ Modifier mon inscription</h3>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6b7280" }}>
            Modifiez les informations de votre profil.
          </p>

          {[
            { key: "prenom", label: "Prénom *", ph: "Votre prénom" },
            { key: "nom", label: "Nom *", ph: "Votre nom de famille" },
            { key: "tel", label: "Téléphone (optionnel)", ph: "06 ...", type: "tel" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
              <input type={f.type || "text"} placeholder={f.ph} value={editForm[f.key]}
                onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Disponibilité *</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["both", "Les deux tours"], ["tour1", "1er tour (15 mars)"], ["tour2", "2nd tour (22 mars)"]].map(([v, l]) => (
                <button key={v} onClick={() => setEditForm({ ...editForm, tours: v })} style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: editForm.tours === v ? "2px solid #ea580c" : "1px solid #d1d5db",
                  background: editForm.tours === v ? "#fff7ed" : "#fff",
                  color: editForm.tours === v ? "#9a3412" : "#6b7280",
                }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Message (optionnel)</label>
            <textarea placeholder="Un petit mot pour vous présenter…" value={editForm.message}
              onChange={e => setEditForm({ ...editForm, message: e.target.value })} rows={3}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          <button onClick={handleEditSubmit} disabled={editSubmitting} style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #ea580c, #c2410c)", color: "#fff",
            fontWeight: 700, fontSize: 15, cursor: editSubmitting ? "not-allowed" : "pointer",
            opacity: editSubmitting ? 0.7 : 1, marginBottom: 8,
          }}>{editSubmitting ? "Enregistrement…" : "Enregistrer les modifications"}</button>
          <button onClick={() => setEditModal(null)} style={{
            width: "100%", padding: "11px", borderRadius: 10,
            border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>Annuler</button>
        </div>
      </Modal>

      {/* Modal réinitialisation DB (admin) */}
      <Modal open={resetModal} onClose={() => { setResetModal(false); setResetConfirmText(""); }}>
        <div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, color: "#991b1b" }}>⚠️ Réinitialiser la base de données</h3>
          <p style={{ margin: "0 0 8px", fontSize: 14, color: "#7f1d1d", lineHeight: 1.6 }}>
            Cette action supprime <strong>toutes les inscriptions et toutes les connexions</strong>. Elle est <strong>irréversible</strong>.
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#374151" }}>
            Pour confirmer, tapez exactement : <strong>RÉINITIALISER</strong>
          </p>
          <input
            value={resetConfirmText}
            onChange={e => setResetConfirmText(e.target.value)}
            placeholder="RÉINITIALISER"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #fca5a5", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 16, fontFamily: "monospace" }}
          />
          <button onClick={handleResetDB} disabled={resetConfirmText !== "RÉINITIALISER"} style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: resetConfirmText === "RÉINITIALISER" ? "#ef4444" : "#d1d5db",
            color: "#fff", fontWeight: 700, fontSize: 15,
            cursor: resetConfirmText === "RÉINITIALISER" ? "pointer" : "not-allowed",
            marginBottom: 8,
          }}>Confirmer la suppression totale</button>
          <button onClick={() => { setResetModal(false); setResetConfirmText(""); }} style={{
            width: "100%", padding: "11px", borderRadius: 10,
            border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>Annuler</button>
        </div>
      </Modal>

      <footer style={{ textAlign: "center", padding: "24px 16px 32px", color: "#9ca3af", fontSize: 12 }}>
        <p style={{ margin: 0, fontWeight: 600, color: "#78716c" }}>Le Seignus Renaissance</p>
        <p style={{ margin: "4px 0 0" }}>Initiative citoyenne · Vos coordonnées ne sont jamais affichées publiquement.</p>
      </footer>
    </div>
  );
}
