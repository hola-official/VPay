import TokenLockList from "../components/TokenLockList";
import TokenLockNav from "../../../components/TokenLockNav";

export default function LPLockListPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container mx-auto">
        {/* <TokenLockNav /> */}
        <TokenLockList type="lp" />
      </div>
    </main>
  );
}
