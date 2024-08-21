import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const cookieStore = cookies();

  const supabase: any = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  const reqText = await req.text();
  return webhooksHandler(reqText, req, supabase);
}

async function handleOrderCreated(
  event: any,
  supabase: ReturnType<typeof createServerClient>
) {
  const order = event.data.attributes;
  const customData = event.meta.custom_data
  const customerEmail = order.user_email;

  const orderData = {
    order_id: order.id,
    customer_id: order.customer_id,
    total: order.total,
    currency: order.currency,
    status: order.status,
    user_id: customData.user_id,
    email: customerEmail,
  };

  const { data, error } = await supabase.from("orders").insert([orderData]);

  if (error) {
    console.error("Error inserting order:", error);
    return NextResponse.json({
      status: 500,
      error: "Error inserting order",
    });
  }

  // Update user credits if applicable
  /* if (order.status === "paid") {
    try {
      const { data: user, error: userError } = await supabase
        .from("user")
        .select("*")
        .eq("user_id", order.custom_data?.userId);
      if (userError) throw new Error("Error fetching user");

      const updatedCredits = Number(user?.[0]?.credits || 0) + order.total;
      const { data: updatedUser, error: userUpdateError } = await supabase
        .from("user")
        .update({ credits: updatedCredits })
        .eq("user_id", order.custom_data?.userId);
      if (userUpdateError) throw new Error("Error updating user credits");

      return NextResponse.json({
        status: 200,
        message: "Order created and credits updated successfully",
        updatedUser,
      });
    } catch (error) {
      console.error("Error handling order creation:", error);
      return NextResponse.json({
        status: 500,
        error,
      });
    }
  } */

  return NextResponse.json({
    status: 200,
    message: "Order created successfully",
    data,
  });
}

async function webhooksHandler(
  reqText: string,
  request: NextRequest,
  supabase: ReturnType<typeof createServerClient>
): Promise<NextResponse> {
  const signature = request.headers.get("X-Signature");

  // Verify the webhook signature
  const hmac = crypto.createHmac(
    "sha256",
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!
  );
  hmac.update(reqText);
  const digest = hmac.digest("hex");

  if (signature !== digest) {
    return NextResponse.json({
      status: 401,
      error: "Invalid signature",
    });
  }

  const event = JSON.parse(reqText);

  if (event.meta.event_name === "order_created") {
    return handleOrderCreated(event, supabase);
  } else {
    return NextResponse.json({
      status: 400,
      error: "Unhandled event type",
    });
  }
}
