import { useState } from 'react'
import { ChevronDownIcon } from '../common/Icons'
import './FilterBar.css'

export default function FilterBar({
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  selectedSizes,
  setSelectedSizes,
  onClearAll,
}) {
  const [expanded, setExpanded] = useState(false)

  // Toggle size selection
  const handleSizeToggle = (size) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev)
      if (next.has(size)) next.delete(size)
      else next.add(size)
      return next
    })
  }

  // Count active filters
  const activeFiltersCount =
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0) +
    selectedSizes.size

  const handleClearFilters = () => {
    onClearAll()
  }

  const handleMinPriceChange = (val) => {
    const min = Math.max(0, Number(val) || 0)
    setPriceRange([min, priceRange[1]])
  }

  const handleMaxPriceChange = (val) => {
    const max = Math.max(priceRange[0], Number(val) || 500)
    setPriceRange([priceRange[0], max])
  }

  return (
    <div className="filter-bar-container">
      <div className="filter-bar-header">
        {/* Toggle Expand (Filters) */}
        <button
          className={`filter-toggle-btn ${expanded ? 'active' : ''}`}
          onClick={() => setExpanded(!expanded)}
          id="filter-toggle-btn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
          {activeFiltersCount > 0 && (
            <span className="filter-active-badge">{activeFiltersCount}</span>
          )}
        </button>

        {/* Sorting Dropdown */}
        <div className="sort-dropdown-wrapper">
          <label className="sort-label" htmlFor="sort-select">Sort by:</label>
          <div className="sort-select-wrapper">
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest Arrivals</option>
            </select>
            <ChevronDownIcon />
          </div>
        </div>

        {/* Clear All Quick Button */}
        {activeFiltersCount > 0 && (
          <button className="clear-filters-quick" onClick={handleClearFilters} id="clear-filters-btn">
            Clear All
          </button>
        )}
      </div>

      {/* Expandable Filter Panel */}
      <div className={`filter-expandable-panel ${expanded ? 'expanded' : ''}`}>
        <div className="filter-grid">
          
          {/* Price Range Filter */}
          <div className="filter-group">
            <h4 className="filter-group-title">Price Range ($)</h4>
            <div className="price-range-inputs">
              <div className="price-input-field">
                <span className="currency-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={priceRange[0] === 0 ? '' : priceRange[0]}
                  placeholder="Min"
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  className="price-input"
                  aria-label="Minimum price"
                />
              </div>
              <span className="price-range-separator">to</span>
              <div className="price-input-field">
                <span className="currency-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={priceRange[1] === 500 ? '' : priceRange[1]}
                  placeholder="Max"
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  className="price-input"
                  aria-label="Maximum price"
                />
              </div>
            </div>
            <div className="price-slider-info">
              Showing items from ${priceRange[0]} to ${priceRange[1]}
            </div>
          </div>

          {/* Size Filter */}
          <div className="filter-group">
            <h4 className="filter-group-title">Select Size (US)</h4>
            <div className="filter-sizes-grid">
              {[6, 7, 8, 9, 10].map((size) => {
                const isSelected = selectedSizes.has(size)
                return (
                  <button
                    key={size}
                    className={`size-filter-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSizeToggle(size)}
                    aria-pressed={isSelected}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
