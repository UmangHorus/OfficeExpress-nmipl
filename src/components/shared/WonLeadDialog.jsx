"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const WonLeadDialog = ({
  open,
  onOpenChange,
  wonLeadData,
  selectedWonLead,
  setSelectedWonLead,
}) => {
  const handleRowClick = (lead) => {
    setSelectedWonLead(lead == selectedWonLead ? null : lead);
    onOpenChange(false); // Close the dialog after selection
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center">
            Won Lead Lists
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4" />
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          {wonLeadData.length == 0 ? (
            <p className="text-center text-sm sm:text-base">
              No won leads available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[300px] sm:min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-[#4a5a6b] hover:bg-[#4a5a6b] text-white">
                    <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                      Lead ID
                    </TableHead>
                    <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                      Date & Time
                    </TableHead>
                    <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                      Reference Name
                    </TableHead>
                    <TableHead className="text-white text-xs sm:text-sm px-2 sm:px-4 py-2 text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wonLeadData.map((lead, index) => (
                    <TableRow
                      key={lead.lead_id}
                      className={`border-b cursor-pointer ${
                        lead == selectedWonLead ? "bg-gray-100 font-bold" : ""
                      }`}
                      onClick={() => handleRowClick(lead)}
                    >
                      <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                        {lead.lead_id}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                        {lead.lead_dt}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                        {lead.reference_name_optional || "-"}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                        {lead.status_flg}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WonLeadDialog;
