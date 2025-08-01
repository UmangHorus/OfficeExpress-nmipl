"use client";
// src/app/(dashboard)/leads/create/page.jsx
import CreateOrderPage from "@/components/orders/CreateOrderPage";
import Loading from "@/components/ui/Loading";
import { Suspense } from "react";

const Page = () => {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <CreateOrderPage />
      </Suspense>
    </>
  );
};

export default Page;
