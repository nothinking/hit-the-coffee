import { redirect } from "next/navigation";
export default function Home() {
  redirect("/shops");
  return null;
} 