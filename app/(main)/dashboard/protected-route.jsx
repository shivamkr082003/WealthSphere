"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useSignIn, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function ProtectedRoute() {
  const router = useRouter();
  const { isLoaded, user, isSignedIn } = useUser();
  const { isLoaded: isSignInLoaded } = useSignIn();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleRetry = () => {
    setIsRedirecting(true);
    router.refresh();
    setTimeout(() => {
      if (isSignedIn) {
        router.replace("/dashboard");
      } else {
        setIsRedirecting(false);
      }
    }, 1000);
  };

  if (!isLoaded || !isSignInLoaded) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Authentication Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You need to sign in to access this page.
          </p>

          <div className="flex flex-col gap-3">
            <SignInButton redirectUrl="/dashboard">
              <Button className="w-full">Sign In</Button>
            </SignInButton>

            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={isRedirecting}
              className="w-full"
            >
              {isRedirecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "I'm already signed in"
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            If you're experiencing issues, please make sure cookies are enabled
            in your browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
