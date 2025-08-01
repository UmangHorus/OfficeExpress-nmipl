import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Faqs = () => {
  return (
    <div className="container mx-auto px-4 py-6 svg-white">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Frequently Asked Questions
      </h1>

      {/* General Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">General</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem className="mb-2" value="general-1">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What is H-Office Office Express?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black rounded py-4 px-6">
              <p className="mb-4">
                <b> Streamline Your Sales with H-Office’ Office Express.</b>
                <br /> Managing your contacts, leads, and orders has never been
                this simple. <b>Office Express</b> by H-Office is a lightweight
                yet powerful solution designed to keep your entire sales process
                right at your fingertips.
              </p>
              <p className="mb-4">
                Whether you're closing leads, creating quotes, or tracking
                orders in real time, Office Express helps you move faster and
                smarter. Trusted by over 100 SMEs and enterprises, it’s the{" "}
                <b>
                  smallest, fastest, and smartest way to supercharge your sales.
                </b>
                <br />
                <br /> No learning curve. No clutter. Just pure productivity—on
                the go.
              </p>
              <ul className="list-disc pl-5">
                ✅ Instantly create and manage leads <br />
                ✅ Seamlessly track and fulfill orders <br />
                ✅ Access everything anytime, anywhere <br />
                ✅ Built for speed, built for scale <br />
              </ul>
              <p className="mt-4">
                <b>Your sales. Simplified. Optimized. Expressed.</b>
                <br />
                <b>Try H-Office’ Office Express today.</b>
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Sales Overview Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Sales Overview</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem className="mb-2" value="sales-1">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What is H-Office' Office Express?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Office Express is a powerful yet lightweight sales management tool
              that helps you effortlessly manage contacts, leads, orders, and
              order tracking—directly from your device.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-2">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What does the Sales Overview chart show?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              The Sales Overview graph provides a monthly summary of:
              <ul className="list-disc pl-5 mt-2">
                <li>
                  <b>Orders:</b> Total orders placed in each month.
                </li>
                <li>
                  <b>Pending Delivery:</b> Orders that are yet to be delivered.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-3">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Can I filter the sales data by date?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Yes. Use the dropdown on the top-right of the Sales Overview chart
              to filter results by time periods such as “This Month,” “Last
              Month,” etc.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-4">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What does "Total Customers" represent?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              It shows the total number of customers registered in the system
              (e.g., <b>3,456</b>).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-5">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What are "Active Customers"?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              These are customers who have placed or interacted with an order
              recently (e.g., <b>2,839</b>). The percentage change over the last
              7 days is also shown.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-6">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What are "Pending Orders"?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Pending Orders are orders that have been created but are still
              awaiting fulfillment or delivery (e.g., <b>600 pending orders</b>
              ).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-7">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What are "Completed Orders"?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Orders that have been fully processed and delivered successfully
              (e.g., <b>230 completed orders</b>).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-8">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What information is shown in the Recent Orders section?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Each recent order displays the following:
              <ul className="list-disc pl-5 mt-2 font-bold">
                <li>Order Number</li>
                <li>Created At (Date)</li>
                <li>Customer Name</li>
                <li>Items Ordered</li>
                <li>Customer Type (Individual/Company)</li>
                <li>Order Status (Accepted, Delivered, Refunded)</li>
                <li>View Order Button</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-9">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What are the possible order statuses?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              <ul className="list-disc pl-5">
                <li>
                  <b>Accepted:</b> Order has been approved and is in processing.
                </li>
                <li>
                  <b>Delivered:</b> Order has been successfully completed and
                  delivered.
                </li>
                <li>
                  <b>Refunded:</b> The order has been canceled and refunded.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-10">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Can I filter by customer type?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Not in this view directly, but the system keeps track of orders by{" "}
              <b>Individual</b> and <b>Company</b> types, allowing segmentation.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-11">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              How do I view detailed order information?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Click the <b>"View"</b> button next to any order in the "Recent
              Orders" section to open its detailed view.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-12">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What do the percentage changes next to each metric mean?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              These show how the number has increased or decreased over the{" "}
              <b>last 7 days</b>, giving you insights into recent trends.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-13">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Is this system mobile-friendly?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Yes. Office Express is designed to be lightweight and optimized for
              fingertip access—perfect for mobile use on the go.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-14">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Who can use Office Express?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              From startups to enterprises—over 100 businesses across various
              industries are using Office Express to simplify and scale their
              sales operations.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="sales-15">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              How can I get support or assistance?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              For technical help or onboarding assistance, contact the H-Office
              support team via your account dashboard or customer service
              portal.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Lead Management Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Lead Management</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem className="mb-2" value="lead-1">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What is the "Create New Lead" form used for?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              This form allows users to generate a new order lead by selecting a
              company, business division, and uploading order details through
              multiple methods including files, products, or voice note.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-2">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              How do I start creating a lead?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              <ul className="list-disc pl-5">
                <li>
                  First, select the <b>Company</b> and <b>Branch</b> from the
                  dropdown fields.
                </li>
                <li>
                  Then, choose the <b>business vertical (division)</b> for which
                  the order is intended.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-3">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Can I choose multiple divisions for a single lead?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              No. You can select only one <b>division per lead</b>.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-4">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              How can I upload the order details?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              You can choose from four options:
              <ul className="list-disc pl-5 mt-2 font-bold">
                <li>
                  Upload Order Details{" "}
                  <span className="font-normal">(via files)</span>
                </li>
                <li>Upload by Products</li>
                <li>
                  Select Products{" "}
                  <span className="font-normal">(from a predefined list)</span>
                </li>
                <li>Voice Note</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-5">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What file types are supported for uploads?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Supported formats include: <b>JPG, PNG, JPEG, and PDF</b> files.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-6">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Is there a limit on file uploads?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              You can upload:
              <ul className="list-disc pl-5 mt-2">
                <li>
                  A <b>single file</b>
                </li>
                <li>
                  <b>Multiple files</b> using the second option
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-7">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              How do I assign the lead to a contact?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Use the search bar under <b>Select Contact</b> to find an existing
              contact by name or company. Then click <b>Add.</b>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-8">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What are the delivery options available?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              You can choose from:
              <ul className="list-disc pl-5 mt-2 font-bold">
                <li>Pickup From Store</li>
                <li>To Be Delivered</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-9">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Is it mandatory to fill out the Remarks section?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              No. The <b>Remarks</b> field is <b>optional</b> and can be used to
              share special instructions or internal notes.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-10">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Can I create a lead using just a voice note?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Yes. Click on the <b>Voice Note</b> tab to record and upload audio
              instructions instead of typing or uploading documents.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="lead-11">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What happens after submitting the lead?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Once submitted, the lead will be saved into your system with all
              attached files and details for follow-up by your team.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Order Management Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Order Management</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem className="mb-2" value="order-1">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What is the "Create New Order" form used for?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              This form is designed for placing a detailed product order by
              selecting the company, division, products, payment terms, and
              delivery preference.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-2">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              How do I begin placing a new order?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Start by selecting:
              <ul className="list-disc pl-5 mt-2 font-bold">
                <li>Company</li>
                <li>Branch</li>
                <li>Business Division</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-3">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Can I place an order for multiple divisions at once?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              No. Only one division can be selected per order.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-4">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              How do I select a contact for this order?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Search by <b>name</b> or <b>company</b> in the "Select Contact"
              field and click <b>Add.</b>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-5">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What are the available payment terms?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              You can choose from the following:
              <ul className="list-disc pl-5 mt-2 font-bold">
                <li>100% Advance</li>
                <li>Full (Credit Days)</li>
                <li>Part / Advance</li>
                <li>EMI</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-6">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What product details need to be filled in?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Each product entry requires:
              <ul className="list-disc pl-5 mt-2 font-bold">
                <li>Conversion</li>
                <li>Category Name</li>
                <li>Product Name</li>
                <li>Packing</li>
                <li>Primary & Secondary units</li>
                <li>Stock</li>
                <li>MRP</li>
                <li>Rate</li>
                <li>Discount %</li>
                <li>Discount (₹)</li>
                <li>Total</li>
                <li>Schedule Date</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-7">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Can I delete a product from the list?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Yes. Click on the <b>trash icon</b> (🗑️) in the <b>Actions</b>{" "}
              column to delete the row.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-8">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What are the payment options available?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              You can select:
              <ul className="list-disc pl-5 mt-2 font-bold">
                <li>100% Advance</li>
                <li>Full (Credit Days)</li>
                <li>Part / Advance</li>
                <li>EMI</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-9">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What are the delivery options?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Choose between:
              <ul className="list-disc pl-5 mt-2 font-bold">
                <li>Pickup From Store</li>
                <li>To Be Delivered</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-10">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Is it mandatory to fill out the Remarks field?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              No. This field is <b>optional</b> and can be used for additional
              notes or special instructions.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="order-11">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What happens after the order is submitted?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              The system records the order and sends it to the appropriate
              processing team for fulfillment and delivery scheduling based on
              your selected terms.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Track My Orders Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Track My Orders</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem className="mb-2" value="track-1">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What does the 'Track My Orders' screen show?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              This screen provides a complete view of all your orders, including
              their status, number of items, customer type, and date of order.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="track-2">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What do the columns mean?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              <ul className="list-disc pl-5">
                <li>
                  <b>Order Number:</b> Unique ID for each order (e.g.,
                  #ORD1001).
                </li>
                <li>
                  <b>Created At:</b> The date the order was placed.
                </li>
                <li>
                  <b>Customer:</b> Name of the individual or company who placed
                  the order.
                </li>
                <li>
                  <b>Items:</b> Total number of products in the order.
                </li>
                <li>
                  <b>Customer Type:</b> Whether the buyer is an Individual or a
                  Company.
                </li>
                <li>
                  <b>Status:</b> Real-time progress of the order (Accepted,
                  Delivered, Refunded).
                </li>
                <li>
                  <b>View Order:</b> Click “View” to see full order details.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="track-3">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What do the different status colors mean?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              <ul className="list-disc pl-5">
                <li>
                  ✅ <b>Accepted</b> (Green): Order has been confirmed and is
                  being processed.
                </li>
                <li>
                  📦 <b>Delivered</b> (Blue): Order has been delivered
                  successfully.
                </li>
                <li>
                  ❌ <b>Refunded</b> (Red): Order was cancelled and refunded.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="track-4">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              How can I search for a specific order?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Use the <b>Search</b> bar at the top-right to filter orders by:
              <ul className="list-disc pl-5 mt-2 font-bold">
                <li>Order Number</li>
                <li>Customer Name</li>
                <li>Status</li>
                <li>Date, etc.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="track-5">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              How many orders can I view per page?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              By default, you see <b>10 orders per page</b>. Use the dropdown to
              increase or decrease entries shown.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="track-6">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              What happens when I click “View” in the ‘View Order’ column?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              You’ll be redirected to a detailed page displaying all product,
              payment, and delivery information related to that order.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="track-7">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Can I view older orders?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              Yes. Use the <b>Next</b> and <b>Previous</b> buttons at the bottom
              to scroll through additional pages.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem className="mb-2" value="track-8">
            <AccordionTrigger className="bg-[#4a5a6b] text-white hover:bg-[#4a5a6b]/90 py-4 px-6 rounded">
              Can I re-order a previously placed order?
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black py-4 px-6 rounded">
              At present, this screen only allows tracking and viewing.
              Re-ordering must be initiated via the <b>Create New Order</b>{" "}
              section.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
};

export default Faqs;
