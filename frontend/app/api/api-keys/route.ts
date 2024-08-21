import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import encryptApiKey from "@/utils/api-keys/encryption";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  const { user_id, api_key } = await request.json();

  if (!user_id || !api_key) {
    return NextResponse.json(
      { error: "Missing user_id or api_key" },
      { status: 400 }
    );
  }

  try {
    const encryptedApiKey = encryptApiKey(api_key);

    // Store in Supabase
    const { data, error } = await supabase
      .from("api_keys")
      .upsert(
        { user_id, openai_api_key: encryptedApiKey }
        
      );

    if (error) throw error;

    return NextResponse.json(
      { message: "API key stored securely" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error storing API key:", error);
    return NextResponse.json(
      { error: "Failed to store API key" },
      { status: 500 }
    );
  }
}
