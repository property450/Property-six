import RangeSelector from './RangeSelector';

export default function DistanceSelector({ value, onChange }) {
  return (
    <RangeSelector
      label="距离范围 (KM)"
      min={0}
      max={100}
      value={value}
      onChange={onChange}
    />
  );
}
