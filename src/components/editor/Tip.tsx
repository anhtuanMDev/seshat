interface TipProps {
  symbol: string;
  title: string;
  body: string;
}

export function Tip({ symbol, title, body }: TipProps) {
  return (
    <div style={styles.container}>
      <span className="seshat-flex-center" style={styles.symbolSpan}>
        {symbol}
      </span>
      <div>
        <div style={styles.title}>{title}</div>
        <div style={styles.body}>{body}</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: "var(--space-4)",
  },
  symbolSpan: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "1px solid var(--color-purple)",
    color: "var(--color-purple)",
    fontSize: 11,
    flexShrink: 0,
    marginTop: 1,
  },
  title: {
    fontSize: 13,
    color: "var(--text-primary)",
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
} satisfies Record<string, React.CSSProperties>;
