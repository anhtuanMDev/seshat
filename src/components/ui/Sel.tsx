import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledFormControl = styled(FormControl)(() => ({
  width: '100%',
  marginBottom: 16,
  '& .MuiInputBase-root': {
    fontFamily: 'Georgia, serif',
    fontSize: 13,
    color: '#1a1a1a',
    background: 'transparent',
    '&:before': {
      borderBottom: '1px solid #bbb',
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#444',
  },
}));

interface SelProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  opts: string[];
}

export function Sel({ label, value, onChange, opts }: SelProps) {
  return (
    <StyledFormControl variant="standard">
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value}
        onChange={e => onChange(e.target.value as string)}
        label={label}
      >
        <MenuItem value="">—</MenuItem>
        {opts.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </Select>
    </StyledFormControl>
  );
}