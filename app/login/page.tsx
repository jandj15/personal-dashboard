export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%)",
      }}
    >
      <form
        method="post"
        action="/api/auth"
        style={{
          width: "320px",
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "var(--r-lg)",
          padding: "22px 22px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div className="brand" style={{ marginBottom: "2px" }}>
          <span className="dot"></span>
          <span className="crumb">D.A.V.I.D</span>
        </div>

        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
          }}
        >
          Acceso restringido
        </div>

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          autoFocus
          required
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            color: "var(--fg)",
            fontFamily: "var(--sans)",
            fontSize: "13px",
            padding: "9px 11px",
            outline: "none",
          }}
        />

        {error && (
          <div style={{ color: "var(--neg)", fontFamily: "var(--mono)", fontSize: "11px" }}>
            Contraseña incorrecta
          </div>
        )}

        <button
          type="submit"
          style={{
            background: "var(--cat-invest)",
            color: "oklch(0.16 0.01 250)",
            border: "none",
            borderRadius: "var(--r-sm)",
            fontFamily: "var(--mono)",
            fontWeight: 600,
            fontSize: "12px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "10px",
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
