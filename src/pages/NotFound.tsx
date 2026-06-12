import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-5xl font-semibold tracking-tight">404</p>
      <p className="text-muted-foreground">That page doesn't exist.</p>
      <Button asChild variant="outline">
        <Link to="/">
          <ArrowLeft />
          Back to dashboard
        </Link>
      </Button>
    </div>
  );
}
