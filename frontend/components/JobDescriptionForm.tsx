// components/JobDescriptionForm.tsx
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface JobFormValues {
  jobDescription: string;
}

export default function JobDescriptionForm({
  onResult,
}: {
  onResult: (pairs: any[]) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<JobFormValues>();

  const jobDescription = watch("jobDescription");

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

        onResult(pairs);
        reset();
        setMessage({
          text: "Job description processed successfully",
          type: "success",
        });
      } else {
        setMessage({
          text: "Failed to process job description",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error during upload:", error);
      setMessage({ text: "An error occurred", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onJobSubmit)} className="space-y-4">
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
  );
}
