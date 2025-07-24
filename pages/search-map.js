import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// 关闭 SSR，动态引入地图组件
const MapWithSearch = dynamic(() => import("../components/MapWithSearch"), {
  ssr: false,
});

export default function SearchMapPage() {
  const [properties, setProperties] = useState([]);

  // ✅ filters 作为独立状态，确保可以正常传递和更新
  const [filters, setFilters] = useState({
    keyword: "",
    distance: 5,
    location: null,
  });

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from("properties").select("*");
      if (error) {
        console.error("获取房源失败", error);
      } else {
        setProperties(data || []);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold p-4">🗺️ 地图搜索</h1>

      {/* ✅ 传 filters 和 setFilters */}
      <MapWithSearch
        properties={properties}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}
