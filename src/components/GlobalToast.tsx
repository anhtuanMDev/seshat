import { Snackbar, Alert, useMediaQuery } from "@mui/material";
import { useSelector } from "@legendapp/state/react";
import { toastStore, hideToast } from "../store/toastStore";

export function GlobalToast() {
  const toast = useSelector(() => toastStore.get());
  const isMobile = useMediaQuery("(max-width:768px)");

  return (
    <Snackbar 
      open={toast.open} 
      autoHideDuration={6000} 
      onClose={hideToast}
      anchorOrigin={
        isMobile 
          ? { vertical: 'bottom', horizontal: 'center' } 
          : { vertical: 'top', horizontal: 'right' }
      }
    >
      <Alert 
        onClose={hideToast} 
        severity={toast.severity} 
        variant="filled" 
        sx={{ 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '0.85rem',
          padding: '2px 16px',
          alignItems: 'center',
          '& .MuiAlert-icon': { fontSize: '1.2rem' }
        }}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
}
