import { NextRequest, NextResponse } from "next/server";
import { actionTemplate } from "@/utils/actions/action-template";
import { createClient } from "@/utils/supabase/client";

export async function POST(req: NextRequest) {
  console.log("Received upload request");
  const supabase = createClient();
  const formData = await req.formData();

  const file = formData.get("file") as File | null;
  console.log("File:", file);

  if (!file) {
    return NextResponse.json(
      { success: false, error: "No file uploaded" },
      { status: 400 }
    );
  }

  try {
    const user = await actionTemplate();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Send request to Flask API
    const flaskApiUrl = process.env.FLASK_API_URL + "/extract_text";
    const flaskResponse = await fetch("http://127.0.0.1:5000/extract_text", {
      method: "POST",
      body: formData,
    });

    if (!flaskResponse.ok) {
      throw new Error(
        `Flask API responded with status: ${flaskResponse.status}`
      );
    }

    const resumeData = await flaskResponse.json();
    const uid = user;

    const { data, error } = await supabase.from("user_details").insert([
      {
        user_id: uid,
        resume_description: resumeData.extracted_text,
        resume_name: file.name,
      },
    ]);

    if (error) {
      console.error("Database insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: storageData, error: storageError } = await supabase.storage
      .from("resumes")
      .upload(`${uid}/${file.name}`, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return NextResponse.json(
        { success: false, error: storageError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      storageData,
      extracted_text: resumeData.extracted_text,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
