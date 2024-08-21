import { useState, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Upload as UploadIcon } from "lucide-react";

interface FileUploadProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface ResumeFormValues {
  file: FileList;
}

export default function FileUpload({ onSuccess, onError }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResumeFormValues>();

  const onResumeSubmit: SubmitHandler<ResumeFormValues> = async (data) => {
    setUploading(true);
    setError(null);

    if (!data.file || data.file.length === 0) {
      setError("Please select a resume file");
      setUploading(false);
      onError("Please select a resume file");
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
        onSuccess(result.message);
      } else {
        setError(result.error || "Upload failed");
        onError(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setError("An unexpected error occurred");
      onError("An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError(null);
      setValue("file", event.target.files as FileList);
      console.log("File selected:", file.name);
    } else {
      setFileName(null);
      setValue("file", undefined as any);
      console.log("No file selected");
    }
  };

  return (
    <form onSubmit={handleSubmit(onResumeSubmit)} className="space-y-4">
      <div className="mb-4">
        <Label htmlFor="resume" className="block mb-2">
          Upload Your Resume (only .docx format)
        </Label>
        <div className="relative">
          <Input
            id="resume"
            type="file"
            accept=".docx"
            {...register("file", { required: true })}
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

      {errors.file && (
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
  );
}
