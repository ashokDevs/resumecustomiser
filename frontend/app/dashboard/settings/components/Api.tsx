"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface APIKeysProps {
  userId: string;
}

export function Api({ userId }: APIKeysProps) {
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (userId) {
      const supabase = createClient();
      checkApiKey(supabase);
    }
  }, [userId]);

  async function checkApiKey(supabase: ReturnType<typeof createClient>) {
    const { data, error } = await supabase
      .from("api_keys")
      .select("openai_api_key")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error checking API key:", error);
    } else {
      setHasApiKey(!!data?.openai_api_key);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("api_keys")
        .upsert({ user_id: userId, openai_api_key: apiKey });

      if (error) {
        throw error;
      }

      setMessage("API key stored successfully");
      setApiKey("");
      setHasApiKey(true);
    } catch (error) {
      setMessage("An error occurred while storing the API key");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApiKey = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      setMessage("API key deleted successfully");
      setHasApiKey(false);
    } catch (error) {
      setMessage("An error occurred while deleting the API key");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-3">API Key</h3>
      {!hasApiKey ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Label htmlFor="apiKey">Enter your API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            required
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit API Key"}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p>Your OpenAI API key is set.</p>
          <Button
            onClick={handleDeleteApiKey}
            variant="destructive"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete API Key"}
          </Button>
        </div>
      )}
      {message && (
        <p className="mt-3 text-sm font-medium text-green-600">{message}</p>
      )}
    </div>
  );
}
