"use server";
import axios from "axios";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const template = async () => {
  const supabase = createServerComponentClient({ cookies });

  try {
    let { data: user, error } = await supabase.from("user").select("*");

    if (user) return user;

    if (error) return error;
  } catch (error: any) {
    throw new Error(error.message);
  }
};


const LEMON_SQUEEZY_ENDPOINT = "https://api.lemonsqueezy.com/v1/";

export const lemonSqueezyApiInstance = axios.create({
  baseURL: LEMON_SQUEEZY_ENDPOINT,
  headers: {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY_TEST}`,
  },
});