import Link from 'next/link';

export default function PropertyCard({ property }) {
  const {
    id,
    title,
    price,
    location,
    bedrooms,
    bathrooms,
    carparks,
    type,
    image_urls = []
  } = property;

  const cover = image_urls.length > 0 ? image_urls[0] : '/no-image.jpg';

  return (
    <div className="flex flex-col md:flex-row border rounded-2xl shadow-md overflow-hidden bg-white">
      <img
        src={cover}
        alt={title}
        loading="lazy"
        className="w-full md:w-64 h-48 md:h-auto object-cover"
      />

      <div className="p-4 flex-1">
        <h2 className="text-xl font-semibold mb-1 text-gray-800">{title}</h2>
        <p className="text-gray-500 text-sm mb-2">📍 {location}</p>

        <p className="text-lg font-bold text-blue-700 mb-2">RM {Number(price).toLocaleString()}</p>

        <div className="flex gap-4 text-sm text-gray-700 mb-2">
          <span>🛏 {bedrooms || 0} 房</span>
          <span>🛁 {bathrooms || 0} 浴</span>
          <span>🚗 {carparks || 0} 车</span>
        </div>

        <p className="text-xs text-gray-500 mb-4">🏷 {type || '未分类'}</p>

        <div className="flex justify-between items-center">
          <Link
            href={`/property/${id}`}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
          >
            查看详情
          </Link>
          <button
            className="text-red-500 hover:text-red-700 text-xl"
            title="收藏功能请在父组件实现"
          >
            ❤️
          </button>
        </div>
      </div>
    </div>
  );
}
