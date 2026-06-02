import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function checkTokenValidity(): boolean {
  const savedToken = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
  if (!savedToken) return false;

  try {
    const payloadStr = atob(savedToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(decodeURIComponent(escape(payloadStr)));
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
