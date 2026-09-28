// src/app/newsletter/verified/page.tsx
export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const alreadyVerified = message === "Email already verified.";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-3xl font-bold">
        {alreadyVerified ? "Already Verified!" : "Email Verified!"}
      </h1>
      <p className="mt-4">
        {alreadyVerified
          ? "This email is already verified. You're on the list!"
          : "Thank you for subscribing to our newsletter."}
      </p>
    </div>
  );
}
