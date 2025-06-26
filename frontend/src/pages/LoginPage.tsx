import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { LogIn, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { user, signIn, signUp, signInAnonymous, isLoading } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/chat" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      const result = await signUp(email, password, username);
      if (result.error) {
        setError(result.error);
      }
    } else {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      }
    }
  };

  const handleAnonymousSignIn = async () => {
    setError("");
    const result = await signInAnonymous();
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center",
        "bg-gradient-to-br from-blue-50 to-indigo-100",
        "dark:from-slate-900 dark:to-slate-800"
      )}
    >
      <Card className="max-w-md w-full border-0 shadow-lg dark:bg-slate-900/50 dark:backdrop-blur-sm">
        <CardHeader className="text-center">
          <div
            className={cn(
              "mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-4",
              "bg-primary dark:bg-primary/20"
            )}
          >
            <Users className="h-6 w-6 text-primary-foreground dark:text-primary" />
          </div>
          <CardTitle className="text-3xl text-foreground">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp ? "Join the chat community" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                  >
                    Username
                  </label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-background"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    {isSignUp ? (
                      <UserPlus className="h-4 w-4 mr-2" />
                    ) : (
                      <LogIn className="h-4 w-4 mr-2" />
                    )}
                    {isSignUp ? "Sign Up" : "Sign In"}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleAnonymousSignIn}
                disabled={isLoading}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Continue as Guest
              </Button>
            </div>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
