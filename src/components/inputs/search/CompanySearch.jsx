import SearchDropdown from './SearchDropdown';

const CompanySearch = ({ contacts, onSelect, onInputChange, productSearch = true, selectedItem }) => {
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
            {contact.typeShortLabel.startsWith("(") && contact.typeShortLabel.endsWith(")")
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

  return (
    <SearchDropdown
      items={contacts}
      placeholder="Search companies by name..."
      emptyMessage="No companies found."
      typeLabel="Companies"
      getDisplayValue={(contact) => `${contact.title || ''}`}
      renderItem={renderContact}
      filterFn={filterContacts}
      onSelect={onSelect}
      onInputChange={onInputChange} // Pass the new prop
      productSearch={productSearch}
      selectedItem={selectedItem}
    />
  );
};

export default CompanySearch;