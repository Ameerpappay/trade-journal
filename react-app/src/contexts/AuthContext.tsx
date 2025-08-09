import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "../services";
import type { User } from "../services/api/authService";
import { message } from "antd";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const response = await authService.getProfile();
        setUser(response.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      authService.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email, password });
      authService.setToken(response.token);
      setUser(response.user);
      message.success("Login successful!");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      message.error(error instanceof Error ? error.message : "Login failed");
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      const response = await authService.register({ email, password, name });
      authService.setToken(response.token);
      setUser(response.user);
      message.success("Registration successful!");
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      message.error(
        error instanceof Error ? error.message : "Registration failed"
      );
      return false;
    }
  };

  const logout = () => {
    authService.removeToken();
    setUser(null);
    message.success("Logged out successfully!");
  };

  const updateProfile = async (data: {
    name?: string;
    avatar?: string;
  }): Promise<boolean> => {
    try {
      const response = await authService.updateProfile(data);
      setUser(response.user);
      message.success("Profile updated successfully!");
      return true;
    } catch (error) {
      console.error("Profile update failed:", error);
      message.error(
        error instanceof Error ? error.message : "Profile update failed"
      );
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
