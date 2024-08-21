"use client"

import { useState, useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client"; // Adjust the import path as needed

export default function Setup() {
  const { user } = useClerk();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [resumeCount, setResumeCount] = useState(0);

  useEffect(() => {
    if (user) {
      const supabase = createClient();
      checkApiKey(supabase);
      fetchResumeCount(supabase);
    }
  }, [user]);

  async function checkApiKey(supabase: ReturnType<typeof createClient>) {
    const { data, error } = await supabase
      .from("api_keys")
      .select("openai_api_key")
      .eq("user_id", user!.id)
      .single();

    if (error) {
      console.error("Error checking API key:", error);
    } else {
      setHasApiKey(!!data?.openai_api_key);
    }
  }

  async function fetchResumeCount(supabase: ReturnType<typeof createClient>) {
    const { data, error } = await supabase
      .from("user_details")
      .select("number_of_resumes")
      .eq("user_id", user!.id)
      .single();

    if (error) {
      console.error("Error fetching resume count:", error);
    } else {
      setResumeCount(data?.number_of_resumes || 0);
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <Card className="w-[20rem]">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Welcome to Resume Customizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasApiKey ? (
            <>
              <p className="mb-4">
                To get started, please add your OpenAI API key in the settings.
              </p>
              <Button asChild>
                <a href="/settings">Go to Settings</a>
              </Button>
            </>
          ) : (
            <>
              <p className="mb-4">
                You're all set! Here's your current status:
              </p>
              <p className="text-2xl font-bold">
                {resumeCount} resumes customized
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
