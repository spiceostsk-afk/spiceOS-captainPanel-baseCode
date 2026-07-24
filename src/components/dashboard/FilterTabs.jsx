import { useState } from 'react';
import { sections } from '../../data/mockData';
import './FilterTabs.css';

function FilterTabs({ onSectionChange }) {
  const [active, setActive] = useState(sections[0]);

  const handleClick = (section) => {
    setActive(section);
    if (onSectionChange) onSectionChange(section);
  };

  return (
    <div className="filter-tabs" id="filter-tabs">
      {sections.map((section) => (
        <button
          key={section}
          className={`filter-tabs__btn ${active === section ? 'filter-tabs__btn--active' : ''}`}
          onClick={() => handleClick(section)}
          id={`filter-${section.toLowerCase().replace(/\s/g, '-')}`}
        >
          {section}
        </button>
      ))}
    </div>
  );
}

export default FilterTabs;
