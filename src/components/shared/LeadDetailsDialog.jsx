import { useState, useEffect } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  FileText,
  File,
  Mic,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import { leadService } from "@/lib/leadService";
import { useLoginStore } from "@/stores/auth.store";

const LeadDetailsDialog = ({ leadId, open, onOpenChange }) => {
  const { navConfig } = useLoginStore();

  const baseurl = process.env.NEXT_PUBLIC_API_BASE_URL_FALLBACK;
  const imageurl = process.env.NEXT_PUBLIC_API_BASE_URL_FALLBACK?.replace(
    /^https?:\/\//,
    ""
  );
  const leadLabel = navConfig?.labels?.leads || "Lead";

  // Fetch lead details
  const {
    data: leadData,
    error: leadError,
    isLoading: leadLoading,
  } = useQuery({
    queryKey: ["leadDetails", leadId],
    queryFn: () => leadService.checkLead(leadId),
    enabled: open && !!leadId,
    refetchOnMount: "always", // Force refetch when component mounts
    staleTime: 0, // Mark data as stale immediately
    cacheTime: 0, // Disable caching (use gcTime: 0 for React Query v5)
  });

  // Fetch attachments
  const {
    data: attachmentData,
    error: attachmentError,
    isLoading: attachmentLoading,
  } = useQuery({
    queryKey: ["leadAttachments", leadId],
    queryFn: () => leadService.getAttachmentOfLead(leadId),
    enabled: open && !!leadId,
    refetchOnMount: "always", // Force refetch when component mounts
    staleTime: 0, // Mark data as stale immediately
    cacheTime: 0, // Disable caching (use gcTime: 0 for React Query v5)
  });

  const [leadDetails, setLeadDetails] = useState(null);
  const [leaddivisionconfig, setLeadDivisionconfig] = useState(null);
  const [attachments, setAttachments] = useState([]);

  // Handle lead data
  useEffect(() => {
    if (leadData && leadData[0]?.STATUS == "SUCCESS") {
      setLeadDetails(leadData[0].DATA);
      setLeadDivisionconfig(leadData[0].config);
    } else if (leadData && leadData[0]?.STATUS == "ERROR") {
      toast.error(leadData[0]?.MSG || "Failed to fetch lead details");
      onOpenChange(false);
    }
    if (leadError) {
      toast.error("An error occurred while fetching lead details");
      onOpenChange(false);
    }
  }, [leadData, leadError, onOpenChange]);

  // Handle attachment data
  useEffect(() => {
    if (attachmentData && attachmentData[0]?.STATUS == "SUCCESS") {
      setAttachments(attachmentData[0].DATA);
    } else {
      setAttachments([]);
    }
    if (attachmentError) {
      toast.error("An error occurred while fetching attachments");
    }
  }, [attachmentData, attachmentError]);

  // Function to download PDF files
  const downloadPDF = async (url, fileName) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch the file");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl); // Clean up
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download the file. Please try again.");
    }
  };

  const calculateDiscountAmount = (qty, rate, discount) => {
    const quantity = parseFloat(qty || "0");
    const price = parseFloat(rate || "0");
    const discPercent = parseFloat(discount || "0");
    const totalBeforeDiscount = quantity * price;
    return (totalBeforeDiscount * discPercent) / 100;
  };

  const totalProductQty =
    leadDetails?.product_array?.reduce(
      (sum, product) => sum + parseFloat(product.productqty || "0"),
      0
    ) || 0;

  const totalProductRate =
    leadDetails?.product_array?.reduce(
      (sum, product) => sum + parseFloat(product.rate || "0"),
      0
    ) || 0;

  const totalProductAmount =
    leadDetails?.product_array?.reduce((sum, product) => {
      const qty = parseFloat(product.productqty || "0");
      const rate = parseFloat(product.rate || "0");
      const discountAmount = calculateDiscountAmount(
        product.productqty,
        product.rate,
        product.discount
      );
      return sum + (qty * rate - discountAmount);
    }, 0) || 0;

const remarks = leadDetails?.lead_array?.remarks || "";

// Split into parts (before/after Remark:)
const remarksParts = remarks.split(/<b>Remark:<\/b>/i); 

// Clean each part (remove ALL HTML tags, trim whitespace)
const cleanPart = (str) => 
  str?.replace(/<[^>]+>/g, '')  // Remove all HTML tags
     .replace(/&nbsp;/g, ' ')   // Replace &nbsp; with space
     .trim() || "";

const typeProducts = cleanPart(remarksParts[0]);
const typeRemarks = cleanPart(remarksParts[1]);

  if (leadLoading || attachmentLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle>Loading {leadLabel}</DialogTitle>
          </DialogHeader>
          <p className="text-center">Loading...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[425px] md:w-full md:max-w-[600px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center">
            {leadLabel} Details
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4" />
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6 details-page">
          {/* Customer and Lead Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-[#4CAF93] bg-opacity-20 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                <h3 className="text-base sm:text-lg font-semibold">
                  Customer Details
                </h3>
              </div>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">
                    Contact:
                  </p>
                  <p className="w-full sm:w-2/3">
                    {leadDetails?.lead_array?.contact || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">
                    Mobile:
                  </p>
                  <p className="w-full sm:w-2/3">
                    {leadDetails?.lead_array?.contact_mobile || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">
                    Email:
                  </p>
                  <p className="w-full sm:w-2/3">
                    {leadDetails?.lead_array?.contact_email || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">
                    Customer Name:
                  </p>
                  <p className="w-full sm:w-2/3">
                    {leadDetails?.lead_array?.reference_name_optional || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div className="bg-[#4CAF93] bg-opacity-20 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                <h3 className="text-base sm:text-lg font-semibold">
                  {leadLabel} Details
                </h3>
              </div>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">
                    {leadLabel} ID:
                  </p>
                  <p className="w-full sm:w-2/3">
                    {leadDetails?.lead_array?.lead_id || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">
                    {leadLabel} Date & Time:
                  </p>
                  <p className="w-full sm:w-2/3">
                    {leadDetails?.lead_array?.lead_dt || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">
                    {leadLabel} Title:
                  </p>
                  <p className="w-full sm:w-2/3">
                    {leadDetails?.lead_array?.lead_title || "-"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <p className="w-full sm:w-1/3 font-medium text-[#287F71]">
                    {leadLabel} Status:
                  </p>
                  <p className="w-full sm:w-2/3">
                    {leadDetails?.lead_array?.lead_status || "-"}
                  </p>
                </div>
                {leaddivisionconfig?.config > 0 && (
                  <div className="flex flex-col sm:flex-row">
                    <p className="w-full sm:w-1/3 font-medium text-[#287F71]">
                      Division:
                    </p>
                    <p className="w-full sm:w-2/3">
                      {leaddivisionconfig?.cd_name || "-"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          {(leadDetails?.product_array?.[0]?.productid || typeProducts) && (
            <div>
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <File className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                <h3 className="text-base sm:text-lg font-semibold">
                  Product Details
                </h3>
              </div>
              {typeProducts && (
                <p className="text-center mb-3 sm:mb-4 text-sm sm:text-base">
                  {typeProducts}
                </p>
              )}
              {leadDetails?.product_array?.[0]?.productid && (
                <div className="overflow-x-auto">
                  <Table className="min-w-[300px] sm:min-w-[600px]">
                    <TableHeader>
                      <TableRow className="bg-[#4a5a6b] hover:bg-[#4a5a6b] text-white">
                        <TableHead className="text-white text-xs sm:text-sm md:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                          Image
                        </TableHead>
                        <TableHead className="text-white text-xs sm:text-sm md:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                          Product
                        </TableHead>
                        <TableHead className="text-white text-xs sm:text-sm md:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                          Unit
                        </TableHead>
                        <TableHead className="text-white text-xs sm:text-sm md:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                          Qty
                        </TableHead>
                        <TableHead className="text-white text-xs sm:text-sm md:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                          Rate
                        </TableHead>
                        <TableHead className="text-white text-xs sm:text-sm md:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                          Disc (%)
                        </TableHead>
                        <TableHead className="text-white text-xs sm:text-sm md:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                          Disc
                        </TableHead>
                        <TableHead className="text-white text-xs sm:text-sm md:text-base px-2 sm:px-4 py-2 bg-[#4a5a6b] text-center">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadDetails?.product_array?.map((product, index) => {
                        const discountAmount = calculateDiscountAmount(
                          product.productqty,
                          product.rate,
                          product.discount
                        );
                        const amount =
                          parseFloat(product.productqty || "0") *
                            parseFloat(product.rate || "0") -
                          discountAmount;
                        return (
                          <TableRow key={index}>
                            <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                              <img
                                src={`${baseurl}/viewimage/getproduct/${product.product_image}/normal`}
                                alt="Product Image"
                                width={40}
                                height={40}
                                className="border-2 border-gray-400 shadow-md mx-auto"
                              />
                            </TableCell>
                            <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                              {product.productname} ({product.productcode})
                            </TableCell>
                            <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                              {product.unit || "-"}
                            </TableCell>
                            <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                              {product.productqty || "-"}
                            </TableCell>
                            <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                              {product.rate || "-"}
                            </TableCell>
                            <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                              {product.discount || "0"}
                            </TableCell>
                            <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                              {discountAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">
                              {amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-center">
                          Total
                        </TableCell>
                        <TableCell
                          className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center"
                          colSpan={2}
                        />
                        <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-center">
                          {totalProductQty}
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-center">
                          {totalProductRate ? totalProductRate : "-"}
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-center">
                          -
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-center">
                          -
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-center">
                          {totalProductAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Order Picture */}
          {leadDetails?.lead_array?.bot_file && (
            <div>
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <File className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                <h3 className="text-base sm:text-lg font-semibold">
                  {leadDetails.lead_array.bot_file.endsWith(".mp3")
                    ? "Voice Order"
                    : "Order Attachment"}
                </h3>
              </div>
              {leadDetails.lead_array.bot_file.endsWith(".pdf") ? (
                <div className="text-center">
                  <a
                    href="#"
                    className="text-blue-600 hover:underline text-sm sm:text-base"
                    onClick={(e) => {
                      e.preventDefault();
                      const fileUrl = `${baseurl}/public/dmsfile/${imageurl}/bot/files/${leadDetails.lead_array.bot_file}`;
                      const fileName =
                        leadDetails.lead_array.bot_file.split("__")[0] ||
                        "document.pdf";
                      downloadPDF(fileUrl, fileName);
                    }}
                  >
                    Download PDF
                  </a>
                </div>
              ) : leadDetails.lead_array.bot_file.endsWith(".mp3") ? (
                <audio
                  controls
                  src={`${baseurl}/public/dmsfile/${imageurl}/bot/files/${leadDetails.lead_array.bot_file}`}
                  className="w-full"
                />
              ) : (
                <div className="flex justify-center">
                  <img
                    src={`${baseurl}/public/dmsfile/${imageurl}/bot/files/${leadDetails.lead_array.bot_file}`}
                    alt="Order Picture"
                    width={150}
                    height={150}
                    className="object-contain sm:w-[200px] sm:h-[200px]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Remarks and Attachments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {typeRemarks && (
              <div>
                <div className="flex items-center mb-2">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />{" "}
                  <h3 className="text-base sm:text-lg font-semibold">
                    Remarks
                  </h3>
                </div>
                <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                  <p className="text-sm sm:text-base">{typeRemarks}</p>
                </div>
              </div>
            )}
            {leadDetails?.lead_array?.bot_file_remark?.endsWith(".mp3") && (
              <div>
                <div className="flex items-center mb-2">
                  <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                  <h3 className="text-base sm:text-lg font-semibold">
                    Voice Remarks
                  </h3>
                </div>
                <audio
                  controls
                  src={`${baseurl}/public/dmsfile/${imageurl}/bot/files/${leadDetails.lead_array.bot_file_remark}`}
                  className="w-full"
                />
              </div>
            )}
            {attachments.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Paperclip className="h-5 w-5 sm:h-6 sm:w-6 text-[#287F71] mr-2" />
                  <h3 className="text-base sm:text-lg font-semibold">
                    Attachments
                  </h3>
                </div>
                <div className="flex flex-col space-y-2">
                  {attachments.map((attach, index) => (
                    <a
                      key={index}
                      href={`${baseurl}/dmsfiles/downloadfiles/${attach.file_id}`}
                      className="text-blue-600 hover:underline text-sm sm:text-base"
                      download
                    >
                      Attachment {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailsDialog;
