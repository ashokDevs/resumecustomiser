import OpenAI from "openai";
import { decryptApiKey } from "utils/api-keys/encryption";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Function to fetch and decrypt the API key
async function getDecryptedApiKey(userId: string) {
  const { data, error } = await supabase
    .from("api_keys")
    .select("openai_api_key")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching API key from Supabase:", error);
    throw new Error("Failed to fetch API key");
  }

  if (!data || !data.openai_api_key) {
    throw new Error("API key not found for user: " + userId);
  }

  try {
    const decryptedApiKey = decryptApiKey(data.openai_api_key);
    console.log("Successfully decrypted API Key for user:", userId);
    return decryptedApiKey;
  } catch (decryptionError) {
    console.error("Error decrypting API key:", decryptionError);
    throw new Error("Failed to decrypt API key");
  }
}

// Function to initialize OpenAI client
async function initializeOpenAI(userId: string) {
  try {
    const apiKey = await getDecryptedApiKey(userId);
    console.log("Initializing OpenAI with API Key:", apiKey);
    return new OpenAI({ apiKey: apiKey });
  } catch (error) {
    console.error("Error initializing OpenAI client:", error);
    throw error;
  }
}

// Function to edit text using OpenAI
export async function editText(prompt: any, userId: string): Promise<string> {
  const fun_desc = [
    {
      name: "replace_text",
      description: "Replaces text with new text",
      parameters: {
        type: "object",
        properties: {
          replacements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                searchString: {
                  type: "string",
                  description:
                    "The text in the extracted text, e.g., 'web developer who loves js'",
                },
                replaceString: {
                  type: "string",
                  description:
                    "The new text that will replace the old text, e.g., 'web developer who loves ReactJS'",
                },
              },
              required: ["searchString", "replaceString"],
            },
          },
        },
        required: ["replacements"],
      },
    },
  ];

  try {
    const openai = await initializeOpenAI(userId);
    console.log("Calling OpenAI API with prompt:", prompt);
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: prompt,
      functions: fun_desc,
      function_call: "auto",
    });

    console.log("Received response from OpenAI:", chatCompletion);

    const functionCallArguments =
      chatCompletion?.choices[0]?.message?.function_call?.arguments;

    if (typeof functionCallArguments === "string") {
      return functionCallArguments;
    } else if (functionCallArguments) {
      return JSON.stringify(functionCallArguments);
    } else {
      return JSON.stringify(chatCompletion?.choices[0]?.message || "");
    }
  } catch (error) {
    console.error("Error in editText:", error);
    return JSON.stringify({
      error: "An error occurred while processing the request",
    });
  }
}

// Example usage (uncomment for testing)
// editText(prompt, userId).then(result => console.log(result)).catch(error => console.error(error));
