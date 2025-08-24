import TokenLockForm from "./components/vestingManagerForm";
// import TokenLockNav from "@/components/TokenLockNav";

export default function Payroll() {
  return (
    <main className="min-h-screen text-white p-4 md:p-8">
      <div className="container mx-auto">
        {/* <TokenLockNav /> */}
        <TokenLockForm />
      </div>
    </main>
  );
}
