"use client";

import { useState, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from 'react-pdf';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Upload as UploadIcon, X, Search, Copy, Check, Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ResumeFormValues {
  file: FileList;
}

interface JobFormValues {
  jobDescription: string;
}

interface ReplacementPair {
  searchString: string;
  replaceString: string;
}

export default function CombinedPage() {
  // Resume upload state
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Job description state
  const [replacementPairs, setReplacementPairs] = useState<ReplacementPair[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [outputFileUrl, setOutputFileUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const {
    register: registerResume,
    handleSubmit: handleSubmitResume,
    formState: { errors: resumeErrors },
    setValue: setResumeValue,
  } = useForm<ResumeFormValues>();

  const {
    register: registerJob,
    handleSubmit: handleSubmitJob,
    formState: { errors: jobErrors },
    reset: resetJob,
    watch: watchJob,
  } = useForm<JobFormValues>();

  const jobDescription = watchJob("jobDescription");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  if (typeof Promise.withResolvers === "undefined") {
    if (typeof window !== "undefined") {
      // @ts-expect-error This does not exist outside of polyfill which this is doing
      window.Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
    } else {
      // @ts-expect-error This does not exist outside of polyfill which this is doing
      global.Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
    }
  }


  // Resume upload handlers
  const onResumeSubmit: SubmitHandler<ResumeFormValues> = async (data) => {
    setUploading(true);
    setError(null);

    if (!data.file || data.file.length === 0) {
      setError("Please select a resume file");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", data.file[0]);

    try {
      const response = await fetch("/api/uploadResume", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        console.log("Upload successful:", result.message);
        setMessage({ text: "Resume uploaded successfully", type: "success" });
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setError("An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError(null);
      setResumeValue("file", event.target.files as FileList);
      console.log("File selected:", file.name);
    } else {
      setFileName(null);
      setResumeValue("file", undefined as any);
      console.log("No file selected");
    }
  };

  // Job description handlers
  const onJobSubmit: SubmitHandler<JobFormValues> = async (data) => {
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("jobDescription", data.jobDescription);
    try {
      const response = await fetch("/api/job", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const responseJson = await response.json();
        const { searchText, replaceText } = responseJson;

        const pairs = searchText.map((search: string, index: number) => ({
          searchString: search,
          replaceString: replaceText[index],
        }));

        setReplacementPairs(pairs);
        setShowResults(true);
        resetJob();
        setMessage({ text: "Job description processed successfully", type: "success" });
      } else {
        setMessage({ text: "Failed to process job description", type: "error" });
      }
    } catch (error) {
      console.error("Error during upload:", error);
      setMessage({ text: "An error occurred", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePair = (index: number) => {
    setReplacementPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditPair = (index: number, field: "searchString" | "replaceString", value: string) => {
    setReplacementPairs((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair))
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setMessage(null);
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
        setMessage({ text: "Changes saved successfully", type: "success" });
      } else {
        setMessage({ text: "Failed to save changes", type: "error" });
      }
    } catch (error) {
      console.error("Error during update:", error);
      setMessage({ text: "An error occurred", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputFileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPairs = replacementPairs.filter(
    (pair) =>
      pair.searchString.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.replaceString.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 flex space-x-8">
      {/* Left column: Resume upload */}
      <div className="w-1/2">
        <Card>
          <CardHeader>
            <CardTitle>Resume Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitResume(onResumeSubmit)} className="space-y-4">
              <div className="mb-4">
                <Label htmlFor="resume" className="block mb-2">
                  Upload Your Resume (only .docx format)
                </Label>
                <div className="relative">
                  <Input
                    id="resume"
                    type="file"
                    accept=".docx"
                    {...registerResume("file", { required: true })}
                    disabled={uploading}
                    className="hidden"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-center"
                    disabled={uploading}
                  >
                    <UploadIcon className="mr-2 h-4 w-4" />
                    {fileName ? "Change File" : "Select File"}
                  </Button>
                  {fileName && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected file: {fileName}
                    </p>
                  )}
                </div>
              </div>

              {resumeErrors.file && (
                <p className="mt-2 text-red-500 flex items-center">
                  <AlertCircle className="mr-2" size={16} />
                  Please select a resume file
                </p>
              )}
              {error && (
                <p className="mt-2 text-red-500 flex items-center">
                  <AlertCircle className="mr-2" size={16} />
                  {error}
                </p>
              )}

              <Button
                className="mt-6 w-full"
                type="submit"
                disabled={uploading || !fileName}
              >
                {uploading ? "Uploading..." : "Upload Resume"}
              </Button>

              {!uploading && fileName && !error && (
                <p className="mt-2 text-green-500 flex items-center justify-center">
                  <CheckCircle className="mr-2" size={16} />
                  File selected and ready to upload
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right column: Job description and PDF viewer */}
      <div className="w-1/2">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Job Description Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitJob(onJobSubmit)} className="space-y-4">
              <div>
                <Label className="text-lg font-semibold" htmlFor="jobDescription">
                  Job Description:
                </Label>
                <Textarea
                  className="w-full h-64 mt-2"
                  placeholder="Paste the job description here"
                  id="jobDescription"
                  {...registerJob("jobDescription", {
                    required: "Job description is required",
                  })}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{jobErrors.jobDescription?.message}</span>
                  <span>{jobDescription?.length || 0} characters</span>
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {message && (
          <div className={`p-4 rounded-md mb-8 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {showResults && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Replacement Pairs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Input
                  type="text"
                  placeholder="Search replacement pairs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm pr-10"
                />
                <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Search String</TableHead>
                    <TableHead>Replace String</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPairs.map((pair, index) => (
                    <TableRow key={index}>
                      <TableCell>{pair.searchString}</TableCell>
                      <TableCell>
                        <Input
                          value={pair.replaceString}
                          onChange={(e) =>
                            handleEditPair(index, "replaceString", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePair(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                onClick={handleSaveChanges}
                className="mt-4"
                variant="secondary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              {outputFileUrl && (
                <div className="mt-4 flex items-center space-x-2">
                 <a 
                    href={outputFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Processed PDF
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="ml-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {outputFileUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Generated PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <Document
                file={outputFileUrl}
                onLoadSuccess={({ numPages }) => console.log(`Loaded ${numPages} pages`)}
                onLoadError={(error) => console.error('Error while loading document:', error)}
              >
                <Page pageNumber={1} />
              </Document>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}