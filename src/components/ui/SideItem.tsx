import { useState } from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const GhostButton = styled(Button)(() => ({
  fontFamily: 'Georgia, serif',
  fontSize: 12,
  color: '#333',
  padding: 0,
  textTransform: 'none',
  background: 'none',
  '&:hover': {
    background: 'none',
  },
}));

interface SideItemProps {
  label: string;
  sub?: string;
  active?: boolean;
  color?: string;
  onClick: () => void;
  onDelete?: () => void;
}

export function SideItem({ label, sub, active, color, onClick, onDelete }: SideItemProps) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: "8px 24px", cursor: "pointer", background: active ? "#f0ede8" : hover ? "#f5f3f0" : "transparent",
        display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.1s" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: color || "#1a1a1a", display: "flex", alignItems: "center", gap: 6 }}>
          {color && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        </div>
        {sub && <div style={{ color: "#444", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
      </div>
      {(hover || active) && onDelete && (
        <GhostButton onClick={e => { e.stopPropagation(); onDelete(); }} sx={{ fontSize: 16, color: "#888", padding: 0, marginLeft: 6 }}>×</GhostButton>
      )}
    </div>
  );
}