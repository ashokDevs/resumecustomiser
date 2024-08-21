import { NextResponse } from "next/server";
import boom from "@/lib/resumeEditor";
import { createClient } from "@/utils/supabase/client";
import { actionTemplate } from "@/utils/actions/action-template";


export async function POST(req) {
  const supabase = createClient();
  const user = await actionTemplate();
  const formData = await req.formData();

  const jobDesc = await formData.get("jobDescription")?.toString() || '';

  let { data: user_details, error } = await supabase
    .from("user_details")
    .select("resume_description,resume_name")
    .eq("user_id", `${user}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!user_details || user_details.length === 0) {
    return NextResponse.json(
      { error: "User details not found" },
      { status: 404 }
    );
  }

  const { resume_description, resume_name: resumeName } = user_details[0];


   const res = supabase.storage
    .from("resumes")
    .getPublicUrl(`${user}/${resumeName}`);
  if(res){
    const fileUrl = res.data.publicUrl; 
    const [searchText,replaceText] =await boom(resume_description, jobDesc,user);
  
    return NextResponse.json({ success: true, searchText, replaceText });
  }
}