import TokenLockNav from "@/components/TokenLockNav";
import TokenLockForm from "./components/ContactPage"

export default function ContactPage() {
  return (
    <main className="min-h-screen text-white p-4 md:p-8">
      <div className="container mx-auto">
        {/* <TokenLockNav /> */}
        <TokenLockForm />
      </div>
    </main>
  );
}
