/**
 * Slow-drifting veils of blue that cross-fade behind a section.
 *
 * Pure CSS (transform + opacity only, so it stays on the compositor) —
 * no canvas or WebGL, which keeps it cheap on phones and tablets.
 * Sits behind content and is fully decorative.
 */
type Tone = "dark" | "light";

export function AmbientFade({ tone = "dark" }: { tone?: Tone }) {
  const veils =
    tone === "dark"
      ? [
          "rgba(63,101,196,0.42)",
          "rgba(30,63,143,0.38)",
          "rgba(126,166,234,0.22)",
        ]
      : [
          "rgba(63,101,196,0.16)",
          "rgba(126,166,234,0.18)",
          "rgba(30,63,143,0.10)",
        ];

  return (
    <div className="ambient-fade pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span className="ambient-veil ambient-veil-1" style={{ background: `radial-gradient(closest-side, ${veils[0]}, transparent 70%)` }} />
      <span className="ambient-veil ambient-veil-2" style={{ background: `radial-gradient(closest-side, ${veils[1]}, transparent 70%)` }} />
      <span className="ambient-veil ambient-veil-3" style={{ background: `radial-gradient(closest-side, ${veils[2]}, transparent 70%)` }} />
    </div>
  );
}
