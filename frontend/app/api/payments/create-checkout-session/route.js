import { lemonSqueezyApiInstance } from "@/utils/actions/template";

export const dynamic = "force-dynamic";

export async function POST(req) {
  console.log("Starting POST request handler");

  try {
    const reqData = await req.json();
    console.log("Received Request Data:", JSON.stringify(reqData, null, 2));

    // Validate required fields
    if (!reqData.variantId || !reqData.userId || !reqData.email) {
      console.error("Missing required fields in request data");
      return new Response(
        JSON.stringify({
          message: "variantId, userId, and email are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const storeId = process.env.STORE_ID || "YOUR_STORE_ID";
    const variantId = reqData.variantId.toString();

    console.log("Store ID:", storeId);
    console.log("Variant ID:", variantId);

    // Check if IDs are available
    if (!storeId) {
      console.error("Store ID is missing or invalid.");
      return new Response(
        JSON.stringify({ message: "Store ID is missing or invalid." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!variantId) {
      console.error("Variant ID is missing or invalid.");
      return new Response(
        JSON.stringify({ message: "Variant ID is missing or invalid." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const requestBody = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              user_id: reqData.userId.toString(),
              email: reqData.email.toString(),
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    console.log("Sending request to Lemon Squeezy API");
    const { data: response } = await lemonSqueezyApiInstance.post(
      "/checkouts",
      requestBody
    );
    console.log("Received response from Lemon Squeezy API");

    console.log("Full API Response:", JSON.stringify(response, null, 2));

    const checkoutUrl = response.data.attributes.url;

    console.log("Checkout URL:", checkoutUrl);

    return new Response(JSON.stringify({ checkoutUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error occurred during request processing:");
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    console.error("Full error object:", error);

    return new Response(
      JSON.stringify({
        message: "An error occurred",
        error: error.response?.data || error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
