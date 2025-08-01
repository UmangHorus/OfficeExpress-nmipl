import SearchDropdown from "./SearchDropdown";

const ProductSearch = ({
  products,
  onSelect,
  productSearch = true,
  isProductSelection,
}) => {
  const filterProducts = (products, searchValue) => {
    const searchLower = searchValue.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        (product.code && product.code.toLowerCase().includes(searchLower))
    );
  };

  const renderProduct = (product) => (
    <>
      <span className="font-medium">{product.name}</span>
      {product.code && (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {" "}
          ({product.code})
        </span>
      )}
    </>
  );

  const searchOptions = {
    placeholder: "Search products by name or code...",
    emptyMessage: "No products found.",
    typeLabel: "Products",
    inputClassName:
      "w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  };

  return (
    <SearchDropdown
      items={products}
      getDisplayValue={(product) => product.name}
      renderItem={renderProduct}
      filterFn={filterProducts}
      onSelect={onSelect}
      {...searchOptions}
      productSearch={productSearch}
    />
  );
};

export default ProductSearch;
