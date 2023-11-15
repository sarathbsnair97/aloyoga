import React, {useState, useEffect} from 'react';
import {useLocation, Link, useSearchParams} from '@remix-run/react';

interface Option {
  label: string;
  value: string;
  booleanValue: boolean;
  id: string;
}

const CollectionFilter: React.FC = () => {
  const initialOptions: Option[] = [
    {
      label: 'Price: High to Low',
      value: 'PRICE',
      booleanValue: true,
      id: 'price_high',
    },
    {
      label: 'Price: Low to High',
      value: 'PRICE',
      booleanValue: false,
      id: 'price_low',
    },
    {
      label: 'Best selling',
      value: 'BEST_SELLING',
      booleanValue: false,
      id: 'best_selling',
    },
    // { label: 'Featured', value: 'MANUAL', booleanValue: true, id: 'featured' },
    // { label: 'Alphabetically: A-Z', value: 'TITLE', booleanValue: false, id: 'alpha_az' },
    // { label: 'Alphabetically: Z-A', value: 'TITLE', booleanValue: true, id: 'alpha_za' },
    { label: 'Newest', value: 'CREATED', booleanValue: true, id: 'newest'},
  ];

  const placeholderOption: Option = {
    label: 'SORT',
    value: '',
    booleanValue: false,
    id: 'sort',
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] =
    useState<Option>(placeholderOption);
  const [params] = useSearchParams();
  const location = useLocation();

  const updateURL = (option: Option) => {
    params.set('sortkey', option.value);
    params.set('reverse', option.booleanValue.toString());
    return `${location.pathname}?${params.toString()}`;
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const selectOption = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  useEffect(() => {
    const url = updateURL(selectedOption);
  }, [selectedOption, location.pathname, params]);

  return (
    <div className="custom-select-box">
      <div
        className={`select-header ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
      >
        {selectedOption.label}
      </div>
      {isOpen && (
        <ul className="options">
          {initialOptions.map((option) => (
            <Link
              to={updateURL(option)}
              key={option.id}
              style={{textDecoration: 'none'}}
            >
              <li
                onClick={() => selectOption(option)}
                className={option === selectedOption ? 'selected' : ''}
              >
                {option.label}
              </li>
            </Link>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CollectionFilter;
