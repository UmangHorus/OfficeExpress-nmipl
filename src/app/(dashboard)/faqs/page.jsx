// src/app/(dashboard)/Faqs/page.jsx

import Faqs from "@/components/faqs/faqs";

const FaqsPage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">FaqsPage</h1>
      <Faqs />
      {/* Your FaqPage content here */}
    </div>
  );
};

export default FaqsPage;
