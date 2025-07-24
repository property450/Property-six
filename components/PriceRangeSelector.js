import RangeSelector from './RangeSelector';

export default function PriceRangeSelector({ value, onChange }) {
  return (
    <RangeSelector
      label="价格范围 (RM)"
      min={0}
      max={10000000}
      value={value}
      onChange={onChange}
    />
  );
}
