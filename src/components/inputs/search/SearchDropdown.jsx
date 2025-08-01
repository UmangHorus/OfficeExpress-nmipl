import React from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchDropdown } from "@/hooks/useSearchDropdown";
import { useSearchParams } from "next/navigation";

const SearchDropdown = ({
  items = [],
  placeholder = "Search...",
  emptyMessage = "No items found.",
  typeLabel = "Items",
  getDisplayValue = (item) => item.name,
  renderItem = (item) => <span>{getDisplayValue(item)}</span>,
  filterFn,
  onSelect,
  onInputChange,
  className = "",
  inputClassName = "",
  dropdownClassName = "",
  productSearch = false,
  selectedItem,
}) => {
  const {
    searchValue,
    setSearchValue,
    selectedItem: internalSelectedItem,
    isOpen,
    setIsOpen,
    setSelectedItem,
    highlightedIndex,
    setHighlightedIndex,
    inputRef,
    dropdownRef,
    filteredItems,
    handleSelectItem,
    clearSelection,
  } = useSearchDropdown(
    items,
    getDisplayValue,
    filterFn,
    onSelect,
    selectedItem
  );

  const searchParams = useSearchParams();
  const contactId = searchParams?.get("contact_id");
  const orderId = searchParams?.get("orderId");

  const shouldDisable =
    (!productSearch && !!contactId) || (!productSearch && !!orderId);

  const handleItemSelect = (item) => {
    handleSelectItem(item);
  };

  const getDropdownStyle = () => {
    if (!productSearch || !inputRef.current) return {};

    // Only apply fixed positioning on screens larger than mobile (md breakpoint)
    return window.innerWidth >= 768
      ? {
          position: "fixed",
          width: `${inputRef.current.offsetWidth}px`,
          top: `${
            inputRef.current.getBoundingClientRect().bottom + window.scrollY
          }px`,
          left: `${
            inputRef.current.getBoundingClientRect().left + window.scrollX
          }px`,
        }
      : {};
  };

  return (
    <div
      className={`${
        productSearch ? "relative" : "relative"
      } w-full ${className}`}
    >
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => {
            if (shouldDisable) return;
            const newValue = e.target.value;
            setSearchValue(newValue);
            setIsOpen(true);
            if (onInputChange) onInputChange(newValue);
            if (newValue === "") {
              setSelectedItem(null);
              if (onSelect) onSelect(null);
            }
          }}
          onFocus={(e) => {
            if (shouldDisable) return;
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          placeholder={internalSelectedItem ? "" : placeholder}
          className={`${inputClassName} pr-8 truncate ${
            shouldDisable ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          disabled={shouldDisable}
        />
        {internalSelectedItem && !shouldDisable && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              clearSelection();
              if (onInputChange) onInputChange("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 bg-background z-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && !shouldDisable && (
        <div
          ref={dropdownRef}
          className={`${
            productSearch ? "" : "absolute"
          } mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-md max-h-64 overflow-auto z-50 ${dropdownClassName}`}
          style={productSearch ? getDropdownStyle() : {}}
        >
          {filteredItems.length === 0 ? (
            <div className="py-2 px-4 text-gray-500">
              {searchValue.trim() ? emptyMessage : "Type to search..."}
            </div>
          ) : (
            <div>
              {typeLabel && (
                <div className="py-2 px-4 text-sm font-medium text-gray-500 bg-gray-200">
                  {typeLabel}
                </div>
              )}
              <ul className="divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <li
                    key={index}
                    onClick={() => handleItemSelect(item)}
                    className={`py-2 px-4 cursor-pointer ${
                      highlightedIndex == index
                        ? "bg-gray-100"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {renderItem(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
