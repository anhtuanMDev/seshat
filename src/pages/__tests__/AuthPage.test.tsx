import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthPage from "../AuthPage";
import * as routerDom from "react-router-dom";
import { registerToGitHub, loginToGitHub } from "../../lib/githubSync";
import { showToast } from "../../store/toastStore";

// Mock dependencies
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});
vi.mock("../../lib/githubSync", () => ({
  registerToGitHub: vi.fn(),
  loginToGitHub: vi.fn(),
}));
vi.mock("../../store/toastStore", () => ({
  showToast: vi.fn(),
}));

// Create a valid mock JWT token
function createMockToken(expOffsetSec = 3600) {
  const header = btoa(JSON.stringify({ alg: "HS256" }));
  const payload = btoa(JSON.stringify({ exp: Date.now() + expOffsetSec * 1000 }));
  return `${header}.${payload}.signature`;
}

describe("AuthPage Edge-to-Edge", () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.mocked(routerDom.useNavigate).mockReturnValue(mockNavigate);
    vi.clearAllMocks();
    
    // Clear storage mocks
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders login mode by default", () => {
    render(<AuthPage />);
    expect(screen.getByText("Welcome to Seshat")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. alex")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter secret code")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("For password recovery")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("toggles between login and register mode", () => {
    render(<AuthPage />);
    const toggleBtn = screen.getByText("Need an account? Register");
    fireEvent.click(toggleBtn);
    
    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("For password recovery")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();

    const toggleBackBtn = screen.getByText("Already have an account? Login");
    fireEvent.click(toggleBackBtn);

    expect(screen.getByText("Welcome to Seshat")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("For password recovery")).not.toBeInTheDocument();
  });

  it("redirects immediately if a valid, unexpired token exists in localStorage", () => {
    localStorage.setItem("seshat-auth-token", createMockToken(3600)); // expires in 1 hour
    render(<AuthPage />);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("does not redirect if token is expired", () => {
    localStorage.setItem("seshat-auth-token", createMockToken(-3600)); // expired 1 hour ago
    render(<AuthPage />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not redirect if token is invalid/malformed", () => {
    localStorage.setItem("seshat-auth-token", "not.a.real.token");
    render(<AuthPage />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("prevents login submission if fields are empty", () => {
    render(<AuthPage />);
    const loginBtn = screen.getByRole("button", { name: "Login" });
    expect(loginBtn).toBeDisabled();
    
    fireEvent.change(screen.getByPlaceholderText("e.g. alex"), { target: { value: "testUser" } });
    expect(loginBtn).toBeDisabled(); // password still empty

    fireEvent.change(screen.getByPlaceholderText("Enter secret code"), { target: { value: "secret123" } });
    expect(loginBtn).not.toBeDisabled();
  });

  it("shows error and prevents registration if email is missing", async () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText("Need an account? Register")); // Switch to register
    
    fireEvent.change(screen.getByPlaceholderText("e.g. alex"), { target: { value: "newUser" } });
    fireEvent.change(screen.getByPlaceholderText("Enter secret code"), { target: { value: "secret123" } });
    
    const registerBtn = screen.getByRole("button", { name: "Register" });
    fireEvent.click(registerBtn);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Please provide an email address for password recovery.", "error");
      expect(registerToGitHub).not.toHaveBeenCalled();
    });
  });

  it("successfully registers, logs in, sets localStorage, and redirects", async () => {
    vi.mocked(registerToGitHub).mockResolvedValue();
    vi.mocked(loginToGitHub).mockResolvedValue("mock.new.token");
    
    render(<AuthPage />);
    fireEvent.click(screen.getByText("Need an account? Register"));
    
    fireEvent.change(screen.getByPlaceholderText("e.g. alex"), { target: { value: "newUser" } });
    fireEvent.change(screen.getByPlaceholderText("For password recovery"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Enter secret code"), { target: { value: "secret123" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(registerToGitHub).toHaveBeenCalledWith("newUser", "test@example.com", "secret123");
      expect(loginToGitHub).toHaveBeenCalledWith("newUser", "secret123");
      expect(localStorage.getItem("seshat-auth-token")).toBe("mock.new.token");
      expect(showToast).toHaveBeenCalledWith("Registration successful! Welcome to Seshat, newUser.", "success");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("successfully logs in with remember me unchecked (uses sessionStorage)", async () => {
    vi.mocked(loginToGitHub).mockResolvedValue("mock.session.token");
    localStorage.setItem("seshat-auth-token", "old.token.should.be.deleted"); // test cleanup
    
    render(<AuthPage />);
    
    fireEvent.change(screen.getByPlaceholderText("e.g. alex"), { target: { value: "existingUser" } });
    fireEvent.change(screen.getByPlaceholderText("Enter secret code"), { target: { value: "secret123" } });
    
    const rememberMeCheckbox = screen.getByLabelText("Remember me");
    fireEvent.click(rememberMeCheckbox); // uncheck
    expect(rememberMeCheckbox).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(loginToGitHub).toHaveBeenCalledWith("existingUser", "secret123");
      expect(sessionStorage.getItem("seshat-auth-token")).toBe("mock.session.token");
      expect(localStorage.getItem("seshat-auth-token")).toBeNull(); // It should have cleaned it up
      expect(showToast).toHaveBeenCalledWith("Welcome back, existingUser!", "success");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("handles login failure with error toast", async () => {
    vi.mocked(loginToGitHub).mockRejectedValue(new Error("Invalid credentials"));
    
    render(<AuthPage />);
    
    fireEvent.change(screen.getByPlaceholderText("e.g. alex"), { target: { value: "badUser" } });
    fireEvent.change(screen.getByPlaceholderText("Enter secret code"), { target: { value: "badPass" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Authentication failed: Invalid credentials", "error");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
