"use client";
import AddMeasurementPage from "@/components/measurement/AddMeasurementPage";
import Loading from "@/components/ui/Loading";
import { Suspense } from "react";

const Page = () => {
    return (
        <>
            <Suspense fallback={<Loading />}>
                <AddMeasurementPage />
            </Suspense>
        </>
    );
};

export default Page;