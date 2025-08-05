import TokenLockForm from "./components/TokenLockForm";
import TokenLockNav from "@/components/TokenLockNav";

export default function TokenLockPage() {
  return (
    <main className="min-h-screen text-white p-4 md:p-8">
      <div className="container mx-auto">
        {/* <TokenLockNav /> */}
        <TokenLockForm />
      </div>
    </main>
  );
}
