/**
 * Design System Color Reference
 *
 * A comprehensive visual catalog of every color token in the Amber Stone
 * design system. This is a documentation page — not a component story.
 *
 * Tokens referenced: all --color-*, --surface-*, --text-*, --tone-*, --gradient-*, --overlay-*
 * See: DESIGN.md, globals.css
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design Tokens/Colors",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj;

/* ─── ColorCard Helper ───────────────────────────────────────────── */

function ColorCard({
  variable,
  value,
  bgClass,
  textClass,
  borderClass,
  usage,
  textSample,
}: {
  variable: string;
  value: string;
  bgClass?: string;
  textClass?: string;
  borderClass?: string;
  usage?: string;
  textSample?: string;
}) {
  const needsBorder =
    variable.includes("light") ||
    variable.includes("bg") ||
    variable.includes("border") ||
    variable.includes("ghost") ||
    variable.includes("subtle") ||
    variable === "--overlay-dark";

  return (
    <div
      style={{
        background: "var(--surface-dark-alt)",
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)",
        padding: "12px",
        minWidth: "180px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "60px",
          borderRadius: "var(--radius-sm)",
          background: `var(${variable})`,
          border: needsBorder ? "1px solid var(--surface-border)" : "none",
          marginBottom: "8px",
        }}
      />
      <div
        style={{
          color: "var(--text-primary)",
          fontSize: "13px",
          fontFamily: "monospace",
        }}
      >
        {variable}
      </div>
      <div
        style={{
          color: "var(--text-muted)",
          fontSize: "11px",
          fontFamily: "monospace",
        }}
      >
        {value}
      </div>
      {bgClass && (
        <div
          style={{
            color: "var(--text-tertiary)",
            fontSize: "10px",
            marginTop: "2px",
          }}
        >
          {bgClass}
        </div>
      )}
      {borderClass && (
        <div style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>{borderClass}</div>
      )}
      {textClass && (
        <div style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>{textClass}</div>
      )}
      {usage && (
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "10px",
            marginTop: "4px",
            fontStyle: "italic",
          }}
        >
          {usage}
        </div>
      )}
      {textSample && (
        <div
          style={{
            color: `var(${variable})`,
            fontSize: "15px",
            marginTop: "6px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {textSample}
        </div>
      )}
    </div>
  );
}

/* ─── Section Wrapper ────────────────────────────────────────────── */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        marginBottom: "48px",
      }}
    >
      <h2
        style={{
          color: "var(--text-primary)",
          fontSize: "22px",
          fontWeight: 700,
          margin: "0 0 6px 0",
          borderBottom: "2px solid var(--color-primary-border)",
          paddingBottom: "10px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ─── Sub-heading ────────────────────────────────────────────────── */

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        color: "var(--text-secondary)",
        fontSize: "16px",
        fontWeight: 600,
        margin: "20px 0 12px 0",
      }}
    >
      {children}
    </h3>
  );
}

/* ─── Grid Layout ────────────────────────────────────────────────── */

function ColorGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
        gap: "12px",
        marginTop: "16px",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Semantic Set Row ───────────────────────────────────────────── */

function SemanticRow({
  label,
  baseVar,
  baseValue,
  bgVar,
  bgValue,
  borderVar,
  borderValue,
  textClass,
  bgClass,
  borderClass,
}: {
  label: string;
  baseVar: string;
  baseValue: string;
  bgVar: string;
  bgValue: string;
  borderVar: string;
  borderValue: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "stretch",
        marginBottom: "12px",
      }}
    >
      {/* Label */}
      <div
        style={{
          minWidth: "100px",
          display: "flex",
          alignItems: "center",
          color: "var(--text-secondary)",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {label}
      </div>

      {/* Base */}
      <div
        style={{
          flex: 1,
          background: "var(--surface-dark-alt)",
          border: "1px solid var(--surface-border)",
          borderRadius: "var(--radius-md)",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "var(--radius-sm)",
            background: `var(${baseVar})`,
          }}
        />
        <div style={{ color: "var(--text-muted)", fontSize: "10px", fontFamily: "monospace" }}>
          {baseVar}
        </div>
        <div style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>{textClass}</div>
      </div>

      {/* BG Tint */}
      <div
        style={{
          flex: 1,
          background: "var(--surface-dark-alt)",
          border: "1px solid var(--surface-border)",
          borderRadius: "var(--radius-md)",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "var(--radius-sm)",
            background: `var(${bgVar})`,
            border: "1px solid var(--surface-border)",
          }}
        />
        <div style={{ color: "var(--text-muted)", fontSize: "10px", fontFamily: "monospace" }}>
          {bgVar}
        </div>
        <div style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>{bgClass}</div>
      </div>

      {/* Border */}
      <div
        style={{
          flex: 1,
          background: "var(--surface-dark-alt)",
          border: "1px solid var(--surface-border)",
          borderRadius: "var(--radius-md)",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-dark)",
            border: "2px solid " + `var(${borderVar})`,
          }}
        />
        <div style={{ color: "var(--text-muted)", fontSize: "10px", fontFamily: "monospace" }}>
          {borderVar}
        </div>
        <div style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>{borderClass}</div>
      </div>
    </div>
  );
}

/* ─── SRS Row ────────────────────────────────────────────────────── */

function SRSRow({
  emoji,
  label,
  colorVar,
  colorValue,
  effect,
}: {
  emoji: string;
  label: string;
  colorVar: string;
  colorValue: string;
  effect: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: "var(--surface-dark)",
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
        marginBottom: "8px",
      }}
    >
      <div style={{ fontSize: "28px" }}>{emoji}</div>
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "var(--radius-sm)",
          background: `var(${colorVar})`,
        }}
      />
      <div>
        <div style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "13px", fontFamily: "monospace" }}>
          {colorVar} — {colorValue}
        </div>
      </div>
      <div
        style={{
          marginLeft: "auto",
          color: "var(--text-tertiary)",
          fontSize: "14px",
        }}
      >
        {effect}
      </div>
    </div>
  );
}

/* ─── Gradient Swatch ────────────────────────────────────────────── */

function GradientCard({ variable, bgClass }: { variable: string; bgClass: string }) {
  return (
    <div
      style={{
        background: "var(--surface-dark-alt)",
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)",
        padding: "12px",
        minWidth: "280px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "80px",
          borderRadius: "var(--radius-sm)",
          background: `var(${variable})`,
          marginBottom: "8px",
        }}
      />
      <div
        style={{
          color: "var(--text-primary)",
          fontSize: "13px",
          fontFamily: "monospace",
        }}
      >
        {variable}
      </div>
      <div style={{ color: "var(--text-tertiary)", fontSize: "10px", marginTop: "2px" }}>
        {bgClass}
      </div>
    </div>
  );
}

/* ─── Main Page Component ───────────────────────────────────────── */

function ColorsPage() {
  const pageStyle: React.CSSProperties = {
    background: "var(--surface-dark-alt)",
    minHeight: "100vh",
    padding: "40px 48px",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const introStyle: React.CSSProperties = {
    color: "var(--text-muted)",
    fontSize: "14px",
    marginBottom: "40px",
    lineHeight: 1.6,
  };

  return (
    <div style={pageStyle}>
      <h1
        style={{
          color: "var(--text-primary)",
          fontSize: "28px",
          fontWeight: 800,
          margin: "0 0 4px 0",
          letterSpacing: "-0.02em",
        }}
      >
        🎨 Color Reference
      </h1>
      <p style={introStyle}>
        Amber Stone design system — every color token defined in{" "}
        <code style={{ color: "var(--color-primary)" }}>globals.css</code>. Swatches use{" "}
        <code style={{ color: "var(--color-primary)" }}>var(--xxx)</code> so they stay in sync with
        the actual tokens.
      </p>

      {/* ═══ 1. Surface Colors ═══ */}
      <Section id="surface" title="1. Surface Colors">
        <ColorGrid>
          <ColorCard
            variable="--surface-dark"
            value="#262321"
            bgClass="bg-surface-dark"
            usage="Primary card surface"
          />
          <ColorCard
            variable="--surface-dark-alt"
            value="#1c1917"
            bgClass="bg-surface-dark-alt"
            usage="Page background, alt cards"
          />
          <ColorCard
            variable="--surface-dark-alt-2"
            value="#2d2a27"
            bgClass="bg-surface-dark-alt-2"
            usage="Modal, grid buttons"
          />
          <ColorCard
            variable="--surface-hover"
            value="rgba(61,57,53,0.5)"
            bgClass="bg-surface-hover"
            usage="Hover state"
          />
          <ColorCard
            variable="--surface-border"
            value="#3d3935"
            borderClass="border-surface"
            usage="Borders"
          />
          <ColorCard variable="--surface-overlay" value="rgba(38,35,33,0.3)" usage="Overlay tint" />
        </ColorGrid>
      </Section>

      {/* ═══ 2. Surface Light (White Opacity) ═══ */}
      <Section id="surface-light" title="2. Surface Light (White Opacity)">
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            margin: "0 0 12px 0",
          }}
        >
          Shown on a dark background strip to make the white opacity visible
        </p>
        <div
          style={{
            background: "var(--surface-dark)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--surface-border)",
            padding: "24px",
          }}
        >
          <ColorGrid>
            <ColorCard
              variable="--surface-light-3"
              value="rgba(255,255,255,0.03)"
              bgClass="bg-surface-light-3"
              usage="Very subtle"
            />
            <ColorCard
              variable="--surface-light-5"
              value="rgba(255,255,255,0.05)"
              bgClass="bg-surface-light-5"
              usage="Subtle"
            />
            <ColorCard
              variable="--surface-light-8"
              value="rgba(255,255,255,0.08)"
              bgClass="bg-surface-light-8"
              usage="Light hover"
            />
            <ColorCard
              variable="--surface-light-10"
              value="rgba(255,255,255,0.1)"
              bgClass="bg-surface-light-10"
              usage="Input bg"
            />
            <ColorCard
              variable="--surface-light-20"
              value="rgba(255,255,255,0.2)"
              bgClass="bg-surface-light-20"
              usage="Avatar bg"
            />
          </ColorGrid>
        </div>
      </Section>

      {/* ═══ 3. Primary Palette (Amber/Brown) ═══ */}
      <Section id="primary" title="3. Primary Palette (Amber / Brown)">
        <ColorGrid>
          <ColorCard
            variable="--color-primary"
            value="#b45309"
            bgClass="bg-primary"
            usage="Amber base"
          />
          <ColorCard variable="--color-primary-dark" value="#92400e" usage="Darker amber" />
          <ColorCard variable="--color-primary-light" value="#d97706" usage="Lighter amber" />
          <ColorCard
            variable="--color-primary-bg"
            value="rgba(180,83,9,0.18)"
            bgClass="bg-primary-bg"
            usage="Primary bg tint"
          />
          <ColorCard
            variable="--color-primary-bg-light"
            value="rgba(180,83,9,0.08)"
            bgClass="bg-primary-bg-light"
            usage="Lightest primary tint"
          />
          <ColorCard
            variable="--color-primary-bg-medium"
            value="rgba(180,83,9,0.12)"
            bgClass="bg-primary-bg-medium"
            usage="Medium primary tint"
          />
          <ColorCard
            variable="--color-primary-border"
            value="rgba(180,83,9,0.3)"
            borderClass="border-primary-border"
            usage="Subtle border"
          />
          <ColorCard
            variable="--color-primary-border-strong"
            value="rgba(180,83,9,0.4)"
            usage="Strong border"
          />
          <ColorCard
            variable="--color-primary-border-hover"
            value="rgba(180,83,9,0.6)"
            usage="Hover border"
          />
        </ColorGrid>
      </Section>

      {/* ═══ 4. Semantic Colors ═══ */}
      <Section id="semantic" title="4. Semantic Colors">
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            margin: "0 0 16px 0",
          }}
        >
          Each row shows <strong style={{ color: "var(--text-secondary)" }}>base</strong> |{" "}
          <strong style={{ color: "var(--text-secondary)" }}>bg tint</strong> |{" "}
          <strong style={{ color: "var(--text-secondary)" }}>border</strong>
        </p>

        <SubHeading>✅ Success (Emerald)</SubHeading>
        <SemanticRow
          label="Success"
          baseVar="--color-success"
          baseValue="#34d399"
          bgVar="--color-success-bg"
          bgValue="rgba(52,211,153,0.15)"
          borderVar="--color-success-border"
          borderValue="rgba(52,211,153,0.3)"
          textClass="text-success"
          bgClass="bg-success-bg"
          borderClass="N/A"
        />

        <SubHeading>❌ Error (Warm Red)</SubHeading>
        <SemanticRow
          label="Error"
          baseVar="--color-error"
          baseValue="#ef6b6b"
          bgVar="--color-error-bg"
          bgValue="rgba(239,107,107,0.15)"
          borderVar="--color-error-border"
          borderValue="rgba(239,107,107,0.3)"
          textClass="text-error"
          bgClass="bg-error-bg"
          borderClass="N/A"
        />

        <SubHeading>⚠️ Warning (Amber/Gold)</SubHeading>
        <SemanticRow
          label="Warning"
          baseVar="--color-warning"
          baseValue="#f59e0b"
          bgVar="--color-warning-bg"
          bgValue="rgba(245,158,11,0.15)"
          borderVar="--color-warning-border"
          borderValue="rgba(245,158,11,0.3)"
          textClass="text-warning"
          bgClass="N/A"
          borderClass="N/A"
        />

        <SubHeading>ℹ️ Info (Warm Amber-Yellow)</SubHeading>
        <SemanticRow
          label="Info"
          baseVar="--color-info"
          baseValue="#fcd34d"
          bgVar="--color-info-bg"
          bgValue="rgba(252,211,77,0.15)"
          borderVar="--color-info-border"
          borderValue="rgba(252,211,77,0.3)"
          textClass="N/A"
          bgClass="bg-info-bg"
          borderClass="N/A"
        />

        <SubHeading>🔷 Info-blue (Gold — character-level feedback)</SubHeading>
        <SemanticRow
          label="Info-blue"
          baseVar="--color-info-blue"
          baseValue="#d4a843"
          bgVar="--color-info-blue-bg"
          bgValue="rgba(212,168,67,0.15)"
          borderVar="--color-info-blue-border"
          borderValue="rgba(212,168,67,0.3)"
          textClass="N/A"
          bgClass="N/A"
          borderClass="N/A"
        />

        <SubHeading>🟠 Info-purple (Amber — meaning-level feedback)</SubHeading>
        <SemanticRow
          label="Info-purple"
          baseVar="--color-info-purple"
          baseValue="#f59e0b"
          bgVar="--color-info-purple-bg"
          bgValue="rgba(245,158,11,0.15)"
          borderVar="--color-info-purple-border"
          borderValue="rgba(245,158,11,0.3)"
          textClass="N/A"
          bgClass="N/A"
          borderClass="N/A"
        />

        <SubHeading>🪨 Neutral (Warm Stone Grey)</SubHeading>
        <SemanticRow
          label="Neutral-grey"
          baseVar="--color-neutral-grey"
          baseValue="#78716c"
          bgVar="--color-neutral-grey-bg"
          bgValue="rgba(120,113,108,0.15)"
          borderVar="--color-neutral-grey-border"
          borderValue="rgba(120,113,108,0.3)"
          textClass="N/A"
          bgClass="N/A"
          borderClass="N/A"
        />
      </Section>

      {/* ═══ 5. Tone Colors (Pinyin Tones) ═══ */}
      <Section id="tones" title="5. Tone Colors (Pinyin Tones)">
        <ColorGrid>
          <ColorCard
            variable="--tone-1"
            value="#ff4444"
            textClass="tone-1"
            usage="1st tone (high level)"
          />
          <ColorCard
            variable="--tone-2"
            value="#ff8c00"
            textClass="tone-2"
            usage="2nd tone (rising)"
          />
          <ColorCard
            variable="--tone-3"
            value="#4caf50"
            textClass="tone-3"
            usage="3rd tone (dipping)"
          />
          <ColorCard
            variable="--tone-4"
            value="#2196f3"
            textClass="tone-4"
            usage="4th tone (falling)"
          />
          <ColorCard
            variable="--tone-5"
            value="#9e9e9e"
            textClass="tone-5"
            usage="5th tone (neutral)"
          />
        </ColorGrid>
      </Section>

      {/* ═══ 6. SRS Rating Colors ═══ */}
      <Section id="srs" title="6. SRS Rating Colors">
        <SRSRow
          emoji="🔴"
          label="Again"
          colorVar="--color-error"
          colorValue="#ef6b6b"
          effect="Reset interval"
        />
        <SRSRow
          emoji="🟡"
          label="Good"
          colorVar="--color-warning"
          colorValue="#f59e0b"
          effect="×2 interval"
        />
        <SRSRow
          emoji="🟢"
          label="Easy"
          colorVar="--color-success"
          colorValue="#34d399"
          effect="×3 interval"
        />
      </Section>

      {/* ═══ 7. Text Colors (White Opacity Scale) ═══ */}
      <Section id="text" title="7. Text Colors (White Opacity Scale)">
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            margin: "0 0 16px 0",
          }}
        >
          White text with opacity scale — from most visible to least visible
        </p>
        <div
          style={{
            background: "var(--surface-dark)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--surface-border)",
            padding: "24px",
          }}
        >
          <ColorGrid>
            <ColorCard
              variable="--text-primary"
              value="rgba(255,255,255,0.95)"
              textClass="text-primary"
              usage="Primary body text"
              textSample="The quick brown fox jumps over the lazy dog."
            />
            <ColorCard
              variable="--text-secondary"
              value="rgba(255,255,255,0.85)"
              textClass="text-secondary"
              usage="Secondary text"
              textSample="The quick brown fox jumps over the lazy dog."
            />
            <ColorCard
              variable="--text-tertiary"
              value="rgba(255,255,255,0.70)"
              textClass="text-tertiary"
              usage="Tertiary / labels"
              textSample="The quick brown fox jumps over the lazy dog."
            />
            <ColorCard
              variable="--text-muted"
              value="rgba(255,255,255,0.50)"
              textClass="text-muted"
              usage="Muted / placeholders"
              textSample="The quick brown fox jumps over the lazy dog."
            />
            <ColorCard
              variable="--text-subtle"
              value="rgba(255,255,255,0.20)"
              usage="Subtle / decorative"
              textSample="The quick brown fox jumps over the lazy dog."
            />
            <ColorCard
              variable="--text-ghost"
              value="rgba(255,255,255,0.05)"
              usage="Ghost / invisible text"
              textSample="The quick brown fox jumps over the lazy dog."
            />
          </ColorGrid>
        </div>
      </Section>

      {/* ═══ 8. Gradients ═══ */}
      <Section id="gradients" title="8. Gradients">
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginTop: "16px",
          }}
        >
          <GradientCard variable="--gradient-primary" bgClass="bg-gradient-primary" />
          <GradientCard variable="--gradient-success" bgClass="bg-gradient-success" />
        </div>
      </Section>

      {/* ═══ 9. Special Colors ═══ */}
      <Section id="special" title="9. Special Colors">
        <ColorGrid>
          <ColorCard variable="--color-xp" value="#fbbf24" usage="XP / achievement" />
          <ColorCard variable="--overlay-dark" value="rgba(0,0,0,0.7)" usage="Modal backdrop" />
        </ColorGrid>
      </Section>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--surface-border)",
          paddingTop: "24px",
          marginTop: "48px",
          color: "var(--text-muted)",
          fontSize: "12px",
          textAlign: "center",
        }}
      >
        Amber Stone Design System — Generated from{" "}
        <code style={{ color: "var(--color-primary)" }}>globals.css</code> and{" "}
        <code style={{ color: "var(--color-primary)" }}>DESIGN.md</code>
      </div>
    </div>
  );
}

/* ─── Default Story ──────────────────────────────────────────────── */

export const Default: Story = {
  render: () => <ColorsPage />,
};
