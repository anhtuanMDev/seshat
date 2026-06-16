import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function checkTokenValidity(): boolean {
  const savedToken = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
  if (!savedToken) return false;

  try {
    const parts = savedToken.split(".");
    if (parts.length < 3 || !parts[1]) return false;
    const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(decodeURIComponent(payloadStr.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    return Date.now() < payload.exp;
  } catch {
    return false;
  }
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isValid = checkTokenValidity();

  useEffect(() => {
    if (!isValid && location.pathname !== "/auth") {
      navigate("/auth", { replace: true });
    }
  }, [isValid, navigate, location.pathname]);

  if (!isValid) {
    return null;
  }

  return <>{children}</>;
}
