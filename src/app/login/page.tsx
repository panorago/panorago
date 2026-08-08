import { redirect } from "next/navigation";

/** Public alias — opens Join Panora (not Command Center). */
export default function LoginAliasPage() {
  redirect("/?join=1");
}
