import { useState, useEffect } from 'react';

export default function TypeSelector({ value, onChange }) {
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

  const subtypeOptions = [
    'Penthouse',
    'Duplex',
    'Triplex',
    'Dual Key',
    'None / Not Applicable',
  ];

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
    onChange(formData);
  }, [
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
  ]);

  const categoryOptions = {
    'Bungalow / Villa': ['Bungalow', 'Link Bungalow', 'Twin Villa', 'Zero-Lot Bungalow', 'Bungalow land'],
    'Apartment / Condo / Service Residence': ['Apartment', 'Condominium', 'Flat', 'Service Residence'],
    'Semi-Detached House': ['Cluster House', 'Semi-Detached House'],
    'Terrace / Link House': [
      '1-storey Terraced House',
      '1.5-storey Terraced House',
      '2-storey Terraced House',
      '2.5-storey Terraced House',
      '3-storey Terraced House',
      '3.5-storey Terraced House',
      '4-storey Terraced House',
      '4.5-storey Terraced House',
      'Terraced House',
      'Townhouse',
    ],
    'Business Property': [
      'Hotel / Resort',
      'Hostel / Dormitory',
      'Boutique Hotel',
      'Office',
      'Office Suite',
      'Business Suite',
      'Retail Shop',
      'Retail Space',
      'Retail Office',
      'Shop',
      'Shop / Office',
      'Sofo',
      'Soho',
      'Sovo',
      'Commercial Bungalow',
      'Commercial Semi-Detached House',
      'Mall / Commercial Complex',
      'School / University',
      'Hospital / Medical Centre',
      'Mosque / Temple / Church',
      'Government Office',
      'Community Hall / Public Utilities',
    ],
    'Industrial Property': [
      'Factory',
      'Cluster Factory',
      'Semi-D Factory',
      'Detached Factory',
      'Terrace Factory',
      'Warehouse',
      'Showroom cum Warehouse',
      'Light Industrial',
      'Heavy Industrial',
    ],
    Land: [
      'Agricultural Land',
      'Industrial Land',
      'Commercial Land',
      'Residential Land',
      'Oil Palm Estate',
      'Rubber Plantation',
      'Fruit Orchard',
      'Paddy Field',
      'Vacant Agricultural Land',
    ],
  };

  const affordableOptions = [
    'Rumah Mampu Milik',
    'PPR',
    'PR1MA',
    'Rumah Selangorku',
    'Rumah WIP (Wilayah Persekutuan)',
    'Rumah Mampu Milik Johor (RMMJ)',
    'Rumah Mesra Rakyat',
    'Rumah Idaman (Selangor)',
  ];

  const tenureOptions = [
    'Freehold',
    'Leasehold',
    'Bumi Lot',
    'Malay Reserved Land',
    'Private Lease Scheme',
    'State Lease Land',
    'Strata Leasehold',
    'Perpetual Lease',
  ];

  const saleTypeOptions = [
    'New Project / Under Construction',
    'Completed Unit / Developer Unit',
    'Subsale / Secondary Market',
    'Auction Property',
    'Rent-to-Own Scheme',
  ];

  const usageOptions = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];

  const showCategory = saleType === 'Rent' || usage;

  return (
    <div className="space-y-4">
      {/* Sale / Rent */}
      <div>
        <label className="block font-medium">Sale / Rent</label>
        <select className="w-full border rounded p-2" value={saleType} onChange={(e) => setSaleType(e.target.value)}>
          <option value="">请选择</option>
          <option value="Sale">Sale</option>
          <option value="Rent">Rent</option>
        </select>
      </div>

      {/* Sale 相关字段 */}
      {saleType === 'Sale' && (
        <>
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

          <div>
            <label className="block font-medium">Property Status / Sale Type</label>
            <select className="w-full border rounded p-2" value={propertyStatus} onChange={(e) => setPropertyStatus(e.target.value)}>
              <option value="">请选择</option>
              {saleTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {propertyStatus === 'Auction Property' && (
            <div>
              <label className="block font-medium">Auction Date</label>
              <input type="date" className="w-full border rounded p-2" value={auctionDate} onChange={(e) => setAuctionDate(e.target.value)} />
            </div>
          )}

          <div>
            <label className="block font-medium">Affordable Housing</label>
            <select className="w-full border rounded p-2" value={affordable} onChange={(e) => setAffordable(e.target.value)}>
              <option value="">是否属于政府可负担房屋计划？</option>
              <option value="Yes">是</option>
              <option value="No">否</option>
            </select>
          </div>

          {affordable === 'Yes' && (
            <div>
              <label className="block font-medium">Affordable Housing Type</label>
              <select className="w-full border rounded p-2" value={affordableType} onChange={(e) => setAffordableType(e.target.value)}>
                <option value="">请选择</option>
                {affordableOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-medium">Tenure Type</label>
            <select className="w-full border rounded p-2" value={tenure} onChange={(e) => setTenure(e.target.value)}>
              <option value="">请选择</option>
              {tenureOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Property Category */}
      {showCategory && (
        <>
          <div>
            <label className="block font-medium">Property Category</label>
            <select
              className="w-full border rounded p-2"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setFinalType('');
                setSubtype('');
                setShowSubtype(false);
              }}
            >
              <option value="">请选择类别</option>
              {Object.keys(categoryOptions)
  .filter((cat) => {
    if (affordable === 'Yes') {
      return !['Business Property', 'Industrial Property', 'Land'].includes(cat);
    }
    return true;
  })
  .map((cat) => (
    <option key={cat} value={cat}>
      {cat}
    </option>
))}
            </select>
          </div>

          {category && categoryOptions[category] && (
            <>
              <div>
                <label className="block font-medium">Sub Type</label>
                <select
                  className="w-full border rounded p-2"
                  value={finalType}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setFinalType(selected);

                    const shouldShow =
                      category === 'Apartment / Condo / Service Residence' ||
                      category === 'Business Property';
                    setShowSubtype(shouldShow);
                  }}
                >
                  <option value="">请选择具体类型</option>
                  {categoryOptions[category].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {showSubtype && (
                <div>
                  <label className="block font-medium">Property Subtype</label>
                  <select
                    className="w-full border rounded p-2"
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value)}
                  >
                    <option value="">请选择 subtype（如有）</option>
                    {subtypeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
