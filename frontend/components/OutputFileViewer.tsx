import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";

interface OutputFileViewerProps {
  outputFileUrl: string; // Assume this URL points to a PDF
}

export const OutputFileViewer: React.FC<OutputFileViewerProps> = ({
  outputFileUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputFileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Document</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Display the PDF in an iframe */}
          <iframe
            src={outputFileUrl}
            width="100%"
            height="600"
            frameBorder="0"
            title="Document Viewer"
          ></iframe>
          <div className="flex items-center space-x-2">
            <a
              href={outputFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Processed Document
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
        </div>
      </CardContent>
    </Card>
  );
};
