'use client'
import { useRouter } from "next/navigation";
import { FallbackProps } from "react-error-boundary";

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const router = useRouter();
  const handleNavigation = () => {
    resetErrorBoundary();
    router.push(".")
  }

  return <div role="alert" className="h-[100vh] flex flex-col gap-y-6 space-y-6 justify-center items-center">
    <p className="text-lg font-semibold text-red-600">Something went wrong:</p>
    <pre>{error.message}</pre>
    <button
      className={"go-back-to-list-button"}
      onClick={handleNavigation}
      style={{
        backgroundColor: "#2656F6",
        color: "#fff",
        fontSize: "16px",
        lineHeight: "24px",
        fontWeight: "bold",
        width: "246px",
        padding: "11px 16px",
        borderRadius: "2px",
        border: "none",
        cursor: "pointer",
      }}
    >
      홈으로 돌아가기
    </button>
    <button onClick={() => resetErrorBoundary()}>다시 시도</button>
  </div>
};
export default ErrorFallback

