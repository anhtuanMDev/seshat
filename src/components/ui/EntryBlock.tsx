import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const GhostButton = styled(Button)(() => ({
  fontFamily: 'Georgia, serif',
  fontSize: 12,
  color: '#333',
  background: 'none',
  '&:hover': {
    background: 'none',
  },
}));

interface EntryBlockProps {
  color?: string;
  onDelete: () => void;
  children: React.ReactNode;
}

export function EntryBlock({ color, onDelete, children }: EntryBlockProps) {
  return (
    <div style={{ marginBottom: 24, paddingLeft: 14, borderLeft: `2px solid ${color || "#ddd"}` }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <GhostButton onClick={onDelete} sx={{ color: "#aaa", fontSize: 12 }}>remove</GhostButton>
      </div>
      {children}
    </div>
  );
}