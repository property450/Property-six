import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const MapWithSearch = dynamic(() => import("../components/MapWithSearch"), {
  ssr: false,
});

export default function SearchMapPage() {
  const [properties, setProperties] = useState([]);

  // ✅ 新增 filters 状态（用来支持关键词、距离等搜索功能）
  const [filters, setFilters] = useState({
    keyword: "",
    distance: 5,
    location: null, // { lat, lng }
  });

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from("properties").select("*");
      setProperties(data || []);
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold p-4">地图搜索</h1>

      {/* ✅ 传 filters 和 setFilters 给 MapWithSearch */}
      <MapWithSearch
        properties={properties}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}
