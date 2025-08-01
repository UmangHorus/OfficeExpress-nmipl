import { useLoginStore } from "@/stores/auth.store";
import SearchDropdown from "./SearchDropdown";

const ContactSearch = ({
  contacts,
  onSelect,
  productSearch = true,
  selectedItem,
}) => {
  const contactLabel = useLoginStore(
    (state) => state.navConfig?.labels?.contacts || "Contact"
  );
  const contactLabelPlural = `${contactLabel.toLowerCase()}${
    !contactLabel.endsWith("s") ? "s" : ""
  }`;
  const filterContacts = (contacts, searchValue) => {
    const searchLower = searchValue.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.title.toLowerCase().includes(searchLower) ||
        (contact.Email && contact.Email.toLowerCase().includes(searchLower)) ||
        (contact.mobile && contact.mobile.includes(searchValue))
    );
  };

  const renderContact = (contact) => (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline">
        <span className="font-medium truncate">{contact.title}</span>
        {contact.typeShortLabel && (
          <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
            {contact.typeShortLabel.startsWith("(") &&
            contact.typeShortLabel.endsWith(")")
              ? contact.typeShortLabel
              : `(${contact.typeShortLabel})`}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-1 gap-y-0.5 text-xs text-gray-500">
        {contact.Email && <span className="truncate">{contact.Email}</span>}-
        {contact.mobile && <span className="truncate">{contact.mobile}</span>}
      </div>
    </div>
  );

  const searchOptions = {
    placeholder: `Search ${contactLabelPlural} by name, email or phone...`,
    emptyMessage: `No ${contactLabelPlural} found.`,
    typeLabel: contactLabelPlural,
    inputClassName:
      "w-full rounded-lg rounded-r-none border-r-0 border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  };

  return (
    <SearchDropdown
      items={contacts}
      getDisplayValue={(contact) => `${contact.title || ""}`}
      renderItem={renderContact}
      filterFn={filterContacts}
      onSelect={onSelect}
      selectedItem={selectedItem} // Pass selectedItem to SearchDropdown
      {...searchOptions}
      productSearch={productSearch}
    />
  );
};

export default ContactSearch;
