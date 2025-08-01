"use client";
// src/app/(dashboard)/leads/create/page.jsx
import CreateLeadPage from "@/components/lead/CreateLeadPage";
import Loading from "@/components/ui/Loading";
import { Suspense } from "react";

const Page = () => {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <CreateLeadPage />
      </Suspense>
    </>
  );
};

export default Page;
