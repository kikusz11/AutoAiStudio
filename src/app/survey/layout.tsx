import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Survey | MindForge Studio",
  description:
    "Help us build better tools by sharing your feedback in this short, anonymous survey.",
  robots: "noindex, nofollow",
};

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
