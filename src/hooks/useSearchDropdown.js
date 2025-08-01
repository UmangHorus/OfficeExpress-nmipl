import { useState, useEffect, useRef, useMemo, useCallback } from "react";

export const useSearchDropdown = (
  items,
  getDisplayValue,
  filterFn,
  onSelect,
  selectedItem // Optional selectedItem prop
) => {
  const [searchValue, setSearchValue] = useState("");
  const [internalSelectedItem, setSelectedItem] = useState(selectedItem || null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync with selectedItem prop only when it's defined and different
  useEffect(() => {
    if (selectedItem && selectedItem !== internalSelectedItem) {
      setSelectedItem(selectedItem);
      setSearchValue(getDisplayValue(selectedItem));
    } else if (!selectedItem && internalSelectedItem) {
      // If selectedItem becomes undefined, don't reset internal state
      // This allows CompanySearch to maintain its internal selection
    }
  }, [selectedItem, getDisplayValue, internalSelectedItem]);

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    if (!searchValue.trim()) return items;
    return filterFn
      ? filterFn(items, searchValue)
      : items.filter((item) =>
          getDisplayValue(item)
            .toLowerCase()
            .includes(searchValue.toLowerCase())
        );
  }, [searchValue, items, filterFn, getDisplayValue]);

  // Handle item selection
  const handleSelectItem = useCallback(
    (item) => {
      setSelectedItem(item);
      setSearchValue(getDisplayValue(item));
      setIsOpen(false);
      setHighlightedIndex(-1);
      if (onSelect) onSelect(item);
    },
    [getDisplayValue, onSelect]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    setSearchValue("");
    setIsOpen(true);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
    if (onSelect) onSelect(null);
  }, [onSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          Math.min(prev + 1, filteredItems.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const selected = filteredItems[highlightedIndex];
        handleSelectItem(selected);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, highlightedIndex, handleSelectItem]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll("li");
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [highlightedIndex]);

  // Reset highlight when filtered items change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredItems]);

  return {
    searchValue,
    setSearchValue,
    selectedItem: internalSelectedItem,
    setSelectedItem,
    isOpen,
    setIsOpen,
    highlightedIndex,
    setHighlightedIndex,
    inputRef,
    dropdownRef,
    filteredItems,
    handleSelectItem,
    clearSelection,
  };
};