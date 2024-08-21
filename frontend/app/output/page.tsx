"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from
 "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Search, Copy, Check, Loader2 } from "lucide-react";

interface FormValues {
  jobDescription: string;
}

interface ReplacementPair {
  searchString: string;
  replaceString: string;
}

export default function JobUploadForm() {
  const [replacementPairs, setReplacementPairs] = useState<ReplacementPair[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [outputFileUrl, setOutputFileUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>();

  const jobDescription = watch("jobDescription");

  const handleRemovePair = (index: number) => {
    setReplacementPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditPair = (index: number, field: "searchString" | "replaceString", value: string) => {
    setReplacementPairs((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair))
    );
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
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
        reset();
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

  const filteredPairs = replacementPairs.filter(
    (pair) =>
      pair.searchString.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.replaceString.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputFileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Job Description Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label className="text-lg font-semibold" htmlFor="jobDescription">
                Job Description:
              </Label>
              <Textarea
                className="w-full h-64 mt-2"
                placeholder="Paste the job description here"
                id="jobDescription"
                {...register("jobDescription", {
                  required: "Job description is required",
                })}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{errors.jobDescription?.message}</span>
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
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {showResults && (
        <Card>
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
    </div>
  );
}