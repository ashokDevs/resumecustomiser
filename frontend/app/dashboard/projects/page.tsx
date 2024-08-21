"use client";

import { useState,useEffect } from "react";
import FileUpload from "../../../components/FileUpload";
import JobDescriptionForm from "../../../components/JobDescriptionForm";
import { ReplacementPairsTable } from "../../../components/ReplacementPairsTable";
import { OutputFileViewer } from "../../../components/OutputFileViewer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import {createClient } from '@/utils/supabase/client'
import { useClerk } from "@clerk/clerk-react";

interface ReplacementPair {
  searchString: string;
  replaceString: string;
}

export default function CombinedPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [existingResume, setExistingResume] = useState<string | null>(null);
  const [resumeMessage, setResumeMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [replacementPairs, setReplacementPairs] = useState<ReplacementPair[]>(
    []
  );
  const [showResults, setShowResults] = useState(false);
  const [jobMessage, setJobMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [outputFileUrl, setOutputFileUrl] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useClerk();

   useEffect(() => {
     async function fetchUserResume() {
       if (user) {
         const supabase = createClient();
         const { data, error } = await supabase
           .from("user_details")
           .select("resume_name")
           .eq("user_id", user.id)
           .single();

         if (data && data.resume_name) {
           setExistingResume(data.resume_name);
         }
       }
     }

     fetchUserResume();
   }, [user]);
  const handleResumeUploadSuccess = (message: string) => {
    setResumeMessage({ text: message, type: "success" });
  };

  const handleResumeUploadError = (message: string) => {
    setResumeMessage({ text: message, type: "error" });
  };

  const handleJobSubmit = (pairs: ReplacementPair[]) => {
    setReplacementPairs(pairs);
    setShowResults(true);
    setJobMessage({
      text: "Job description processed successfully",
      type: "success",
    });
  };

  const handleSaveChanges = async () => {

    const [isPaid, setIsPaid] = useState(false);
    useEffect(() => {
      if (user) {
        const supabase = createClient();
        checkApiKey(supabase);
      }
    }, [user]);
    async function checkApiKey(supabase: ReturnType<typeof createClient>) {
      const { data, error } = await supabase
        .from("orders")
        .select("status")
        .eq("user_id", user)
        .single();

      if (error) {
        console.error("Error checking API key:", error);
      } else {
        if (data?.status === "paid") {
          setIsPaid(true);
        }
      }
    }
    if(isPaid){

      try {
        const response = await fetch("/api/finalOutput", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ replacementPairs }),
        });
  
        if (response.ok) {
          const responseJson = await response.json();
          // Update the state or perform actions based on the response
          setOutputFileUrl(responseJson.fileUrl || "");
          setJobMessage({ text: "Changes saved successfully", type: "success" });
        } else {
          throw new Error("Failed to save changes");
        }
      } catch (error) {
        console.error("Error during update:", error);
        setJobMessage({ text: "Failed to save changes", type: "error" });
      }
    } else {}
  };

  return (
    <div className="container mx-auto p-4 space-y-8 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">Resume Tailoring Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section>
  <h2 className="text-xl font-semibold mb-4">
    Step 1: Upload Resume
  </h2>
  {existingResume ? (
    <div className="space-y-4">
      <p>Current resume: {existingResume}</p>
      <Button onClick={() => setExistingResume(null)}>
        Upload Different Resume
      </Button>
    </div>
  ) : (
    <FileUpload
      onSuccess={(message) => {
        handleResumeUploadSuccess(message);
        setExistingResume(fileName);  // Assuming fileName is set in FileUpload component
      }}
      onError={handleResumeUploadError}
    />
  )}
  {resumeMessage && (
    <Alert
      variant={
        resumeMessage.type === "success" ? "default" : "destructive"
      }
      className="mt-4"
    >
      {resumeMessage.type === "success" ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertTitle>
        {resumeMessage.type === "success" ? "Success" : "Error"}
      </AlertTitle>
      <AlertDescription>{resumeMessage.text}</AlertDescription>
    </Alert>
  )}
</section>

          <section>
            <h2 className="text-xl font-semibold mb-4">
              Step 2: Process Job Description
            </h2>
            <JobDescriptionForm onResult={handleJobSubmit} />
            {jobMessage && (
              <Alert
                variant={
                  jobMessage.type === "success" ? "default" : "destructive"
                }
                className="mt-4"
              >
                {jobMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {jobMessage.type === "success" ? "Success" : "Error"}
                </AlertTitle>
                <AlertDescription>{jobMessage.text}</AlertDescription>
              </Alert>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {showResults && (
            <section>
              <h2 className="text-xl font-semibold mb-4">
                Step 3: Review and Edit Replacements
              </h2>
              <ReplacementPairsTable
                pairs={replacementPairs}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onEditPair={(index, field, value) =>
                  setReplacementPairs((prev) =>
                    prev.map((pair, i) =>
                      i === index ? { ...pair, [field]: value } : pair
                    )
                  )
                }
                onRemovePair={(index) =>
                  setReplacementPairs((prev) =>
                    prev.filter((_, i) => i !== index)
                  )
                }
              />
              <Button onClick={handleSaveChanges} className="mt-4">
                Save Changes
              </Button>
            </section>
          )}

          {outputFileUrl && (
            <section>
              <h2 className="text-xl font-semibold mb-4">
                Step 4: Download Tailored Resume
              </h2>
              <OutputFileViewer outputFileUrl={outputFileUrl} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
