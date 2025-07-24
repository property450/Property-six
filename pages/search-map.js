import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const MapWithSearch = dynamic(() => import("../components/MapWithSearch"), {
  ssr: false,
});

export default function SearchMapPage() {
  const [properties, setProperties] = useState([]);

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
      <MapWithSearch properties={properties} />
    </div>
  );
}
