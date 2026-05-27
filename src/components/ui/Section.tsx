import { useState } from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const GhostButton = styled(Button)(() => ({
  fontFamily: 'Georgia, serif',
  fontSize: 12,
  color: '#333',
  letterSpacing: 1,
  padding: '4px 0',
  textTransform: 'none',
  background: 'none',
  '&:hover': {
    background: 'none',
  },
}));

interface SectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
}

export function Section({ title, children, action, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <hr style={{ border: "none", borderTop: "1px solid #e0ddd8", margin: "20px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 14 : 0 }}>
        <GhostButton
          onClick={() => setOpen(o => !o)}
          sx={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#444" }}
        >
          <span style={{ fontSize: 10, color: "#aaa", marginRight: 8 }}>{open ? "▾" : "▸"}</span>
          {title}
        </GhostButton>
        {open && action}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}