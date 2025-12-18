// components/TransitSelector.js
"use client";

import { useMemo } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

// 🚉 所有路线和站点数据（保持你原本的）
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
    "Kuchai","Taman Naga Emas","Sri Petaling","Sungai Buli","Serdang Raya Utara","Serdang Raya Selatan",
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

const YESNO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function safeValue(v) {
  if (!v || typeof v !== "object") {
    return { nearTransit: null, selectedLines: [], selectedStations: {} };
  }
  return {
    nearTransit: v.nearTransit ?? null,
    selectedLines: Array.isArray(v.selectedLines) ? v.selectedLines : [],
    selectedStations: v.selectedStations && typeof v.selectedStations === "object" ? v.selectedStations : {},
  };
}

export default function TransitSelector({ value, onChange }) {
  const v = safeValue(value);

  const lineOptions = useMemo(
    () => Object.keys(transitData).map((line) => ({ value: line, label: line })),
    []
  );

  const selectedLineOptions = useMemo(
    () => v.selectedLines.map((line) => ({ value: line, label: line })),
    [v.selectedLines]
  );

  const setNearTransit = (next) => {
    const nextObj = {
      ...v,
      nearTransit: next,
      // 选 No 时，把后面全部清空（避免残留）
      selectedLines: next === "yes" ? v.selectedLines : [],
      selectedStations: next === "yes" ? v.selectedStations : {},
    };
    onChange?.(nextObj);
  };

  const setSelectedLines = (opts) => {
    const nextLines = (opts || []).map((o) => o.value);
    // 只保留还存在的 stations
    const nextStations = {};
    nextLines.forEach((line) => {
      if (v.selectedStations?.[line]) nextStations[line] = v.selectedStations[line];
    });

    onChange?.({
      ...v,
      selectedLines: nextLines,
      selectedStations: nextStations,
    });
  };

  const setStationsForLine = (line, vals) => {
    onChange?.({
      ...v,
      selectedStations: {
        ...(v.selectedStations || {}),
        [line]: vals || [],
      },
    });
  };

  return (
    <div className="space-y-4">
      <label className="font-medium">你的产业步行能到达公共交通吗？</label>
      <Select
        options={YESNO_OPTIONS}
        value={YESNO_OPTIONS.find((x) => x.value === v.nearTransit) || null}
        onChange={(opt) => setNearTransit(opt?.value || null)}
        placeholder="请选择..."
      />

      {v.nearTransit === "yes" && (
        <div>
          <label className="font-medium">请选择路线 (可多选)</label>
          <Select
            isMulti
            options={lineOptions}
            value={selectedLineOptions}
            onChange={setSelectedLines}
            placeholder="选择路线..."
          />
        </div>
      )}

      {v.nearTransit === "yes" &&
        v.selectedLines.map((line) =>
          line === "Custom" ? (
            <div key={line}>
              <label className="font-medium">请输入自定义站点</label>
              <CreatableSelect
                isMulti
                value={v.selectedStations?.[line] || []}
                onChange={(vals) => setStationsForLine(line, vals)}
                placeholder="输入站点名称..."
              />
            </div>
          ) : (
            <div key={line}>
              <label className="font-medium">{line} - 请选择站点</label>
              <Select
                isMulti
                options={(transitData[line] || []).map((s) => ({ value: s, label: s }))}
                value={v.selectedStations?.[line] || []}
                onChange={(vals) => setStationsForLine(line, vals)}
                placeholder="选择站点..."
              />
            </div>
          )
        )}
    </div>
  );
}
