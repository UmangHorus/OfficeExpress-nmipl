"use client";
import MeasurementsTable from "@/components/measurement/MeasurementsTable";
import { useLoginStore } from "@/stores/auth.store";
const TrackMeasurementsPage = () => {

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold mb-6">Measurements</h1>
            <MeasurementsTable />
        </div>
    );
};

export default TrackMeasurementsPage;
