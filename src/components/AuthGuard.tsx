import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { checkTokenValidity } from "../lib/auth";

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
