import { useState } from "react";
import { Outlet } from "react-router-dom";
import DepartmentLayout from "../../shared/DepartmentLayout";

// Extracted from original WardenLayout logic
const HOSTELS = ["BH1", "BH2", "BH3", "BH4", "BH5", "GH"];

export default function WardenLayout() {
  const [selectedHostel, setSelectedHostel] = useState("");

  return (
    <DepartmentLayout
      role="warden"
      unitCodes={["warden"]}
      title="Warden In Charge"
      // Header badge shows the selected hostel's pending count only (none until a hostel is picked)
      pendingCountFilter={(req) => Boolean(selectedHostel) && req.hostel === selectedHostel}
    >
      {(contextData) => {
        // Filter data by selected hostel, if any
        const filteredPending = selectedHostel
          ? contextData.pending.filter((req) => req.hostel === selectedHostel)
          : contextData.pending;

        const filteredApproved = selectedHostel
          ? contextData.approved.filter((req) => req.hostel === selectedHostel)
          : contextData.approved;

        const filteredRejected = selectedHostel
          ? contextData.rejected.filter((req) => req.hostel === selectedHostel)
          : contextData.rejected;

        return (
          <Outlet
            context={{
              ...contextData,
              // Overwrite with filtered versions
              pending: filteredPending,
              approved: filteredApproved,
              rejected: filteredRejected,

              // Provide the custom hostel context that child pages need
              HOSTELS,
              // Pending count per hostel, for the hostel dropdown
              pendingByHostel: contextData.pending.reduce((acc, r) => {
                acc[r.hostel] = (acc[r.hostel] || 0) + 1;
                return acc;
              }, {}),
              selectedHostel,
              setSelectedHostel,
              hostelSelected: Boolean(selectedHostel),
            }}
          />
        );
      }}
    </DepartmentLayout>
  );
}
