"use client"
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
  category: z.string(),
})

export default function Category() {

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category: "",
    }
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {


      form.reset()
      return
    } catch (error) {
      return error
    }
  }


  return (
    <>
    <p>comming soon</p>
    </>
  )
}