import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("seshat-github-user") || sessionStorage.getItem("seshat-github-user");
    const savedCode = localStorage.getItem("seshat-github-code") || sessionStorage.getItem("seshat-github-code");
    
    if (!savedUser || !savedCode) {
      if (location.pathname !== "/auth") {
        navigate("/auth", { replace: true });
      }
    }
    setIsChecking(false);
  }, [navigate, location.pathname]);

  if (isChecking) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
