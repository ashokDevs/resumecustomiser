"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";

interface CheckoutResponse {
  checkoutUrl?: string;
  message?: string;
}
type PricingCardProps = {
  user: any;
  handleCheckout: (variantId: string) => Promise<void>;
  variantId: string;
  title: string;
  price: number;
  description: string;
  features: string[];
  actionLabel: string;
};

const PricingHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <section className="text-center">
    <h1 className="text-3xl lg:text-5xl font-bold">{title}</h1>
    <p className="text-lg text-gray-600 dark:text-gray-400 pt-1">{subtitle}</p>
    <br />
  </section>
);

const PricingCard = ({
  user,
  handleCheckout,
  variantId,
  title,
  price,
  description,
  features,
  actionLabel,
}: PricingCardProps) => (
  <Card className="w-72 flex flex-col justify-between py-1 border-zinc-700 mx-auto sm:mx-0">
    <div>
      <CardHeader className="pb-8 pt-4">
        <CardTitle className="text-zinc-700 dark:text-zinc-300 text-lg">
          {title}
        </CardTitle>
        <div className="flex gap-0.5">
          <h2 className="text-3xl font-bold">${price}</h2>
        </div>
        <CardDescription className="pt-1.5 h-12">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {features.map((feature: string) => (
          <CheckItem key={feature} text={feature} />
        ))}
      </CardContent>
    </div>
    <CardFooter className="mt-2">
      <Button
        onClick={() => handleCheckout(variantId)}
        className="relative inline-flex w-full items-center justify-center rounded-md bg-black text-white dark:bg-white px-6 font-medium dark:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        type="button"
      >
        <div className="absolute -inset-0.5 -z-10 rounded-lg bg-gradient-to-b from-[#c7d2fe] to-[#8678f9] opacity-75 blur" />
        {actionLabel}
      </Button>
    </CardFooter>
  </Card>
);

const CheckItem = ({ text }: { text: string }) => (
  <div className="flex gap-2">
    <CheckCircle2 size={18} className="my-auto text-green-400" />
    <p className="pt-0.5 text-zinc-700 dark:text-zinc-300 text-sm">{text}</p>
  </div>
);

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      setup: () => void;
      openPopup: (url: string) => void;
    };
  }
}

export default function Pricing() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Lemon.js script
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCheckout = async (variantId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.emailAddresses?.[0]?.emailAddress,
          variantId,
        }),
      });

      if (!response.ok) {
        // Handle non-2xx HTTP responses
        const errorData: CheckoutResponse = await response.json();
        console.error("API responded with error:", errorData.message);
        toast(`Error: ${errorData.message}`);
        return;
      }

      const data: CheckoutResponse = await response.json();

      if (data.checkoutUrl) {
        if (window.LemonSqueezy && window.LemonSqueezy.openPopup) {
          window.LemonSqueezy.openPopup(data.checkoutUrl);
        } else {
          window.location.href = data.checkoutUrl;
        }
      } else {
        console.error("Failed to create checkout");
        toast("Failed to create checkout");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast("Error during checkout");
    } finally {
      setLoading(false);
    }
  };


  const plan = {
    title: "Buy once use forever",
    price: 49.99,
    description: "All the features you need to get selected",
    features: [
      " Unlimited usage",
      " Bring your own openAI API key",
      " Find jobs(coming soon)",
      " gpt-4o",
    ],
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID!,
    actionLabel: loading ? "Processing..." : "Buy Now",
  };

  return (
    <div>
      <PricingHeader
        title="Pro Plan"
        subtitle="Boost your productivity with our comprehensive solution"
      />
      <section className="flex justify-center mt-8">
        <PricingCard user={user} handleCheckout={handleCheckout} {...plan} />
      </section>
    </div>
  );
}
