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

interface EventPickerProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  events: Array<{ id: string; time: number; title: string }>;
}

export function EventPicker({ label, value, onChange, events }: EventPickerProps) {
  return (
    <StyledFormControl variant="standard">
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value}
        onChange={e => onChange(e.target.value as string)}
        label={label}
      >
        <MenuItem value="">— none —</MenuItem>
        {[...events].sort((a, b) => a.time - b.time).map(e => (
          <MenuItem key={e.id} value={e.id}>T{e.time} · {e.title}</MenuItem>
        ))}
      </Select>
    </StyledFormControl>
  );
}