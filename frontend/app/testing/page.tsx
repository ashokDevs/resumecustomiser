"use client";

import { useState } from "react";
import FileUpload from "../../components/FileUpload";
import JobDescriptionForm from "../../components/JobDescriptionForm";
import { ReplacementPairsTable } from "../../components/ReplacementPairsTable";
import { OutputFileViewer } from "../../components/OutputFileViewer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ReplacementPair {
  searchString: string;
  replaceString: string;
}

export default function CombinedPage() {
  const [fileName, setFileName] = useState<string | null>(null);
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
        setOutputFileUrl(responseJson.outputFileUrl || "");
        setJobMessage({ text: "Changes saved successfully", type: "success" });
      } else {
        throw new Error("Failed to save changes");
      }
    } catch (error) {
      console.error("Error during update:", error);
      setJobMessage({ text: "Failed to save changes", type: "error" });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Resume Tailoring Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Step 1: Upload Resume
            </h2>
            <FileUpload
              onSuccess={handleResumeUploadSuccess}
              onError={handleResumeUploadError}
            />
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
