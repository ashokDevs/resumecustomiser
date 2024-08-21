import { editText } from "@/app/services/openai";

interface JsonLikeObject {
  replacements: { searchString: string; replaceString: string }[];
}

async function boom(extractedText: string, jobrole: string,user_id:string): Promise<[string[], string[]]> {
  try {
    if (extractedText) {
      const prompt: {role:string,content:string}[] =  [
    { role: "user", content: `Take a deep breath and perform this task.` },
    { role: "user", content: `Extracted text: ${extractedText}.` },
    { role: "user", content: `Edit the resume for job role: ${jobrole}.` },
    { role: "user", content: `- Modify only the selected text.` },
    { role: "user", content: `- Ensure the search string is present in the extracted text.` },
    { role: "user", content: `- Match new skills to the job role.` },
    { role: "user", content: `- Do not edit personal information, education, experience, or project sections.` },
    { role: "user", content: `- Return only the modified text.` }
  ];

      const response: string  = await editText(prompt,user_id);
      const jsonObj: JsonLikeObject = JSON.parse(response);

      const searchString: string[] = [];
      const replaceString: string[] = [];

      if (jsonObj && jsonObj.replacements) {
        jsonObj.replacements.forEach((replacement) => {
          searchString.push(replacement.searchString);
          replaceString.push(replacement.replaceString);
        });
      } else {
        throw new Error(
          "jsonObj is not a plain object or doesn't have replacements property."
        );
      }

      return [searchString, replaceString];
    } else {
      throw new Error("Extracted text is undefined or empty.");
    }
  } catch (error) {
    console.error("Error in boom():", error);
    throw error;
  }
}

export default boom;
