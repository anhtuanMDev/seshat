import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(() => ({
  fontFamily: 'Georgia, serif',
  fontSize: 12,
  color: '#333',
  letterSpacing: 1,
  padding: '4px 0',
  textTransform: 'none',
  '&:hover': {
    background: 'none',
  },
}));

interface ToggleProps {
  label?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#444", marginBottom: 4 }}>{label}</label>}
      <StyledButton
        variant="outlined"
        onClick={() => onChange(!value)}
        sx={{
          borderColor: '#bbb',
          color: value ? '#27ae60' : '#c0392b',
          '&:hover': {
            borderColor: value ? '#27ae60' : '#c0392b',
          },
        }}
      >
        {value ? "Yes" : "No"}
      </StyledButton>
    </div>
  );
}