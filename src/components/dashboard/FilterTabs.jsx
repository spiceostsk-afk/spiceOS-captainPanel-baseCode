import './FilterTabs.css';

/**
 * Section pills plus a live status legend. Both are driven by the same table
 * list, so the counts can never disagree with the grid below them.
 */
function FilterTabs({ sections, active, onSectionChange, legend }) {
  return (
    <div className="filter-tabs-row">
      <div className="filter-tabs" id="filter-tabs">
        {(sections || []).map((section) => (
          <button
            key={section}
            className={`filter-tabs__btn ${active === section ? 'filter-tabs__btn--active' : ''}`}
            onClick={() => onSectionChange(section)}
            id={`filter-${String(section).toLowerCase().replace(/\s/g, '-')}`}
          >
            {section}
          </button>
        ))}
      </div>

      {legend && (
        <div className="filter-legend">
          {legend.map((l) => (
            <span key={l.label} className="filter-legend__item">
              <span className="filter-legend__swatch" style={{ background: l.color }} />
              {l.label}
              <b>{l.count}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterTabs;
