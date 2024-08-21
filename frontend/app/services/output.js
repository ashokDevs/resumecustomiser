import { createClient } from "@/utils/supabase/client";
import { actionTemplate } from "@/utils/actions/action-template";

export async function output(fileUrl, searchStrings, replaceStrings) {
  // Fetch user information
  const user = await actionTemplate();
  const supabase = createClient();
  const destinationFilePath = `${user}/result.docx`;

  // JSON payload for API request
  const postData = JSON.stringify({
    file_url: fileUrl,
    searchStrings: searchStrings,
    replaceStrings: replaceStrings,
  });

  // Making the API call to the Flask server
  const response = await fetch("http://127.0.0.1:5000/job", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: postData,
  });

  if (!response.ok) {
    const error = await response.json(); // Get error details from response
    throw new Error(
      `Failed with status code: ${response.status}, Error: ${error.error}`
    );
  }

  // Retrieve the file as a blob
  const fileBlob = await response.blob(); // Get the response body as a Blob

  // Convert the Blob to ArrayBuffer
  const fileBuffer = await fileBlob.arrayBuffer();

  // Save the file in Supabase
 const { data, error } = await supabase.storage
   .from("resumes") // Replace with your Supabase storage bucket name
   .upload(destinationFilePath, new Uint8Array(fileBuffer), {
     contentType:
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
     upsert: true,
   });

 if (error) {
   console.error("Upload failed:", error.message);
   return;
 }

 if (data) {
   // Ensure the destinationFilePath matches the path used in `getPublicUrl`
   const { data: publicUrlData, error: urlError } = supabase.storage
     .from("resumes")
     .getPublicUrl(destinationFilePath); // Use the same path as used during upload

   if (urlError) {
     console.error("Failed to get public URL:", urlError.message);
     return;
   }

   if (publicUrlData) {
     const { publicUrl } = publicUrlData;
     if (publicUrl) {
       console.log("Public URL:", publicUrl);
       return publicUrl;
     } else {
       console.log("No URL returned");
     }
   } else {
     console.log("No data returned from getPublicUrl");
   }
 }


  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

   // Return any relevant information about the uploaded file
}
