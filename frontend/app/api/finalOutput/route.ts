import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
import { output } from "@/app/services/output";
import { actionTemplate } from "@/utils/actions/action-template";

export async function POST(req: NextRequest) {
  try {
    // Extract replacementPairs from the request body
    const { replacementPairs } = await req.json();

    // Initialize Supabase client and get user details
    const supabase = createClient();
    const user = await actionTemplate();

    // Fetch user details to get resume name
    const { data: user_details, error } = await supabase
      .from("user_details")
      .select("resume_name")
      .eq("user_id", `${user}`)
      .single(); // Single record expected

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!user_details) {
      return NextResponse.json(
        { error: "User details not found" },
        { status: 404 }
      );
    }

    const { resume_name: resumeName } = user_details;

    // Get file URL from Supabase storage
    const { data } = supabase.storage
      .from("resumes")
      .getPublicUrl(`${user}/${resumeName}`);

    if (!data?.publicUrl) {
      return NextResponse.json(
        { error: "Failed to get file URL" },
        { status: 500 }
      );
    }

    const fileUrl = data.publicUrl;

    // Split replacementPairs into searchString and replaceString arrays
    const searchStrings = replacementPairs.map(
      (pair: { searchString: string }) => pair.searchString
    );
    const replaceStrings = replacementPairs.map(
      (pair: { replaceString: string }) => pair.replaceString
    );

    // Call the output function
    const outputFile = await output(fileUrl, searchStrings, replaceStrings);

    // Return the processed file information in the response
    return NextResponse.json(
      {
        message: "File processed successfully",
        fileUrl: outputFile, // Ensure outputFile contains the public URL
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
