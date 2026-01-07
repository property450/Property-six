// components/TransitSelector.js
"use client";
import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

// 🚉 所有路线和站点数据
const transitData = {
  "KTM Seremban Line": [
    "Batu Caves","Taman Wahyu","Kampung Batu","Batu Kentonmen","Sentul",
    "Bank Negara","Kuala Lumpur","KL Sentral","Mid Valley","Seputeh","Salak Selatan",
    "Bandar Tasik Selatan","Serdang","Kajang","UKM","Bangi","Batang Benar","Nilai",
    "Labu","Tiroi","Seremban","Senawang","Sungai Gadut","Rembau","Pulau Sebang / Tampin"
  ],
  "KTM Port Klang Line": [
    "Tanjung Malim","Kuala Kubu Bharu","Rasa","Batang Kali","Serendah","Rawang","Kuang",
    "Sungai Buloh","Kepong Sentral","Kepong","Segambut","Kuala Lumpur","KL Sentral",
    "Abdullah Hukum","Angkasapuri","Pantai Dalam","Petaling","Jalan Templer","Kampung Dato Harun",
    "Seri Setia","Setia Jaya","Subang Jaya","Batu Tiga","Shah Alam","Padang Jawa","Bukit Badak",
    "Kampung Raja Uda","Teluk Gadong","Teluk Pulai","Klang","Bukit Kuda","Jalan Kastam","Pelabuhan Klang"
  ],
  "KTM Skypark Link": ["KL Sentral","Subang Jaya","Skypark Terminal"],
  "LRT Ampang Line": [
    "Sentul Timur","Sentul","Titiwangsa","PWTC / WTC KL","Sultan Ismail",
    "Bandaraya","Masjid Jamek","Plaza Rakyat","Pudu","Chan Sow Lin","Miharja","Maluri",
    "Pandan Jaya","Pandan Indah","Cempaka","Cahaya","Ampang"
  ],
  "LRT Sri Petaling Line": [
    "Sentul Timur","Sentul","Titiwangsa","PWTC / WTC KL","Sultan Ismail",
    "Bandaraya","Masjid Jamek","Plaza Rakyat","Pudu","Chan Sow Lin",
    "Cheras","Salak Selatan","Bandar Tasik Selatan","Sungai Besi",
    "Bukit Jalil","Sri Petaling","Awan Besar","Muhibbah","Alam Sutera",
    "Kinrara BK5","IOI Puchong Jaya","Pusat Bandar Puchong","Taman Perindustrian Puchong",
    "Bandar Puteri","Puchong Perdana","Puchong Prima","Putra Heights"
  ],
  "LRT Kelana Jaya Line": [
    "Putra Heights","Alam Megah","Subang Alam","SS18","SS15","Subang Jaya",
    "Lembah Subang","Ara Damansara","Glenmarie","Kelana Jaya","Taman Bahagia","Taman Paramount",
    "Asia Jaya","Taman Jaya","Universiti","Kerinchi","Abdullah Hukum","Bangsar","KL Sentral",
    "Pasar Seni","Masjid Jamek","Dang Wangi","Kampung Baru","KLCC","Ampang Park","Damai",
    "Dato Keramat","Jelatek","Setiawangsa","Sri Rampai","Wangsa Maju","Gombak"
  ],
  "MRT Kajang Line": [
    "Sungai Buloh","Kampung Selamat","Kwasa Damansara","Kwasa Sentral","Kota Damansara",
    "Surian","Mutiara Damansara","Bandar Utama","TTDI","Phileo Damansara","Pusat Bandar Damansara",
    "Semantan","Muzium Negara","Pasar Seni","Merdeka","Bukit Bintang","Tun Razak Exchange",
    "Cochrane","Maluri","Taman Pertama","Taman Midah","Taman Mutiara","Taman Connaught",
    "Taman Suntex","Sri Raya","Bandar Tun Hussein Onn","Batu 11 Cheras","Bukit Dukung",
    "Sungai Jernih","Stadium Kajang","Kajang"
  ],
  "MRT Putrajaya Line": [
    "Kwasa Damansara","Kampung Selamat","Sungai Buloh","Sri Damansara Barat","Sri Damansara Sentral",
    "Sri Damansara Timur","Metro Prima","Kepong Baru","Jinjang","Sri Delima","Kampung Batu","Batu Kentonmen",
    "Jalan Ipoh","Sentul Barat","Titiwangsa","Hospital Kuala Lumpur","Raja Uda","Ampang Park",
    "Persiaran KLCC","Conlay","Tun Razak Exchange","Chan Sow Lin","Bandar Malaysia Utara","Bandar Malaysia Selatan",
    "Kuchai","Taman Naga Emas","Sri Petaling","Sungai Besi","Serdang Raya Utara","Serdang Raya Selatan",
    "Serdang Jaya","UPM","Taman Universiti","Cyberjaya Utara","Cyberjaya City Centre","Putrajaya Sentral"
  ],
  "KL Monorail": [
    "KL Sentral","Tun Sambanthan","Maharajalela","Hang Tuah","Imbi","Bukit Bintang","Raja Chulan",
    "Bukit Nanas","Medan Tuanku","Chow Kit","Titiwangsa"
  ],
  "ERL KLIA Ekspres": ["KL Sentral","KLIA T1","KLIA T2"],
  "ERL KLIA Transit": [
    "KL Sentral","Bandar Tasik Selatan","Putrajaya & Cyberjaya","Salak Tinggi","KLIA T1","KLIA T2"
  ],
  "BRT Sunway": [
    "Setia Jaya","Mentari","Sunway Lagoon","SunMed","SunU-Monash","South Quay-USJ1","USJ7"
  ],
  "Custom": []
};

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const toOpt = (v) => (v ? { value: v, label: v } : null);
const toOptArr = (arr) => (Array.isArray(arr) ? arr.map((x) => ({ value: x, label: x })) : []);

export default function TransitSelector({ value = null, onChange }) {
  const [nearTransit, setNearTransit] = useState(null);
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedStations, setSelectedStations] = useState({});

  // ✅ 关键：回填 value 时，禁止触发 emit（避免死循环）
  const isHydratingRef = useRef(false);

  // ✅ 外部 value 回填（复制到其它 layout / 重新打开页面时显示已填数据）
  useEffect(() => {
    isHydratingRef.current = true;

    if (!value) {
      setNearTransit(null);
      setSelectedLines([]);
      setSelectedStations({});
      // 下一拍再允许 emit
      setTimeout(() => (isHydratingRef.current = false), 0);
      return;
    }

    const nextNear = value.nearTransit ?? null;
    const nextLines = Array.isArray(value.selectedLines) ? value.selectedLines : [];
    const nextStations =
      value.selectedStations && typeof value.selectedStations === "object" ? value.selectedStations : {};

    setNearTransit(nextNear);
    setSelectedLines(nextLines);
    setSelectedStations(nextStations);

    setTimeout(() => (isHydratingRef.current = false), 0);
  }, [value]);

  // ✅ 向外 emit（但回填时不 emit）
  useEffect(() => {
    if (isHydratingRef.current) return;

    // 如果全空，就传 null（避免父层一直写空对象）
    const isEmpty =
      !nearTransit && selectedLines.length === 0 && Object.keys(selectedStations || {}).length === 0;

    onChange?.(
      isEmpty ? null : { nearTransit, selectedLines, selectedStations }
    );
  }, [nearTransit, selectedLines, selectedStations, onChange]);

  return (
    <div className="space-y-4">
      <label className="font-medium">你的产业步行能到达公共交通吗？</label>
      <Select
        options={yesNoOptions}
        value={yesNoOptions.find((x) => x.value === nearTransit) || null}
        onChange={(opt) => {
          const v = opt?.value ?? null;
          setNearTransit(v);

          // 选 no 就清空路线/站点（更符合逻辑）
          if (v !== "yes") {
            setSelectedLines([]);
            setSelectedStations({});
          }
        }}
        placeholder="请选择..."
      />

      {nearTransit === "yes" && (
        <div>
          <label className="font-medium">请选择路线 (可多选)</label>
          <Select
            isMulti
            options={Object.keys(transitData).map((line) => ({ value: line, label: line }))}
            value={toOptArr(selectedLines)}
            onChange={(opts) => {
              const lines = (opts || []).map((o) => o.value);
              setSelectedLines(lines);

              // 如果路线减少了，把已不存在路线的站点移除
              setSelectedStations((prev) => {
                const next = {};
                lines.forEach((l) => {
                  if (prev[l]) next[l] = prev[l];
                });
                return next;
              });
            }}
            placeholder="选择路线..."
          />
        </div>
      )}

      {nearTransit === "yes" &&
        selectedLines.map((line) =>
          line === "Custom" ? (
            <div key={line}>
              <label className="font-medium">请输入自定义站点</label>
              <CreatableSelect
                isMulti
                value={selectedStations[line] || []}
                onChange={(vals) =>
                  setSelectedStations((prev) => ({
                    ...prev,
                    [line]: vals || [],
                  }))
                }
                placeholder="输入站点名称..."
              />
            </div>
          ) : (
            <div key={line}>
              <label className="font-medium">{line} - 请选择站点</label>
              <Select
                isMulti
                options={transitData[line].map((s) => toOpt(s))}
                value={selectedStations[line] || []}
                onChange={(vals) =>
                  setSelectedStations((prev) => ({
                    ...prev,
                    [line]: vals || [],
                  }))
                }
                placeholder="选择站点..."
              />
            </div>
          )
        )}
    </div>
  );
}
