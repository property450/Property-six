import { useState, useEffect } from 'react';

export default function TypeSelector({ value = '', onChange = () => {}, onFormChange }) {
  const [saleType, setSaleType] = useState('');
  const [usage, setUsage] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('');
  const [affordable, setAffordable] = useState('');
  const [affordableType, setAffordableType] = useState('');
  const [tenure, setTenure] = useState('');
  const [category, setCategory] = useState('');
  const [finalType, setFinalType] = useState('');
  const [subtype, setSubtype] = useState('');
  const [auctionDate, setAuctionDate] = useState('');
  const [showSubtype, setShowSubtype] = useState(false);

  // ✅ Homestay & Hotel 分类
  const homestayOptions = [
    'Entire Place',
    'Private Room',
    'Shared Room',
    'Serviced Apartment',
    'Villa Homestay',
    'Farmstay / Kampung Stay',
    'Guesthouse / Hostel',
    'Capsule / Pod Stay',
    'Cultural / Heritage Homestay',
    'Monthly Rental Stay',
  ];

  const hotelOptions = [
    'Budget Hotel',
    '2-Star Hotel',
    '3-Star Hotel',
    '4-Star Hotel',
    '5-Star / Luxury Hotel',
    'Business Hotel',
    'Boutique Hotel',
    'Resort',
    'Serviced Apartment Hotel',
    'Convention Hotel',
    'Spa / Hot Spring Hotel',
    'Casino Hotel',
    'Extended Stay Hotel',
    'Capsule Hotel',
    'Hostel / Backpacker Hotel',
    'Airport Hotel',
  ];

  const subtypeOptions = [
    'Penthouse',
    'Duplex',
    'Triplex',
    'Dual Key',
    'None / Not Applicable',
  ];

  // 初始化 finalType
  useEffect(() => {
    if (value) setFinalType(value);
  }, [value]);

  useEffect(() => {
    onChange(finalType);
  }, [finalType, onChange]);

  useEffect(() => {
    const formData = {
      saleType,
      usage,
      propertyStatus,
      affordable,
      affordableType,
      tenure,
      category,
      finalType,
      subtype,
      auctionDate,
    };
    if (typeof onFormChange === 'function') {
      onFormChange(formData);
    }
  }, [saleType, usage, propertyStatus, affordable, affordableType, tenure, category, finalType, subtype, auctionDate, onFormChange]);

  // 原本的 saleType 选项，加上 Homestay & Hotel
  const saleTypeOptions = [
    'Sale',
    'Rent',
    'New Project / Under Construction',
    'Completed Unit / Developer Unit',
    'Subsale / Secondary Market',
    'Auction Property',
    'Rent-to-Own Scheme',
    'Homestay',          // ✅ 新增
    'Hotel / Resort',    // ✅ 新增
  ];

  const usageOptions = ['Residential', 'Commercial', 'Commercial Under HDA', 'Industrial', 'Agricultural'];

  const showCategory = saleType === 'Rent' || usage;

  return (
    <div className="space-y-4">
      {/* Sale / Rent / Homestay / Hotel */}
      <div>
        <label className="block font-medium">Sale / Rent / Stay Type</label>
        <select
          className="w-full border rounded p-2"
          value={saleType}
          onChange={(e) => {
            setSaleType(e.target.value);
            setFinalType('');
          }}
        >
          <option value="">请选择</option>
          {saleTypeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Homestay 类型选择 */}
      {saleType === 'Homestay' && (
        <div>
          <label className="block font-medium">Homestay 类型</label>
          <select
            className="w-full border rounded p-2"
            value={finalType}
            onChange={(e) => setFinalType(e.target.value)}
          >
            <option value="">请选择 Homestay 类型</option>
            {homestayOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ✅ Hotel 类型选择 */}
      {saleType === 'Hotel / Resort' && (
        <div>
          <label className="block font-medium">Hotel / Resort 类型</label>
          <select
            className="w-full border rounded p-2"
            value={finalType}
            onChange={(e) => setFinalType(e.target.value)}
          >
            <option value="">请选择 Hotel 类型</option>
            {hotelOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ⚡ 原有 Sale 流程继续保留 */}
      {saleType === 'Sale' && (
        <>
          {/* Property Usage */}
          <div>
            <label className="block font-medium">Property Usage</label>
            <select className="w-full border rounded p-2" value={usage} onChange={(e) => setUsage(e.target.value)}>
              <option value="">请选择用途</option>
              {usageOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* 其他字段保持不变 ... */}
        </>
      )}
    </div>
  );
}
