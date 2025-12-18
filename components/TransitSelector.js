//components/TransitSelector.js
"use client";
import { useState, useEffect } from "react";
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
  "Custom": [] // 自定义
};

export default function TransitSelector({ onChange }) {
  const [nearTransit, setNearTransit] = useState(null);
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedStations, setSelectedStations] = useState({});

  useEffect(() => {
    if (onChange) {
      onChange({ nearTransit, selectedLines, selectedStations });
    }
  }, [nearTransit, selectedLines, selectedStations, onChange]);

  return (
    <div className="space-y-4">
      {/* Step 1 */}
      <label className="font-medium">你的产业步行能到达公共交通吗？</label>
      <Select
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ]}
        onChange={(opt) => setNearTransit(opt.value)}
        placeholder="请选择..."
      />

      {/* Step 2: 路线多选 */}
      {nearTransit === "yes" && (
        <div>
          <label className="font-medium">请选择路线 (可多选)</label>
          <Select
            isMulti
            options={Object.keys(transitData).map((line) => ({
              value: line,
              label: line
            }))}
            value={selectedLines.map((line) => ({ value: line, label: line }))}
            onChange={(opts) => {
              setSelectedLines(opts.map((o) => o.value));
              setSelectedStations({}); // 重置站点
            }}
            placeholder="选择路线..."
          />
        </div>
      )}

      {/* Step 3: 每条路线显示站点选择 */}
      {nearTransit === "yes" &&
        selectedLines.map((line) =>
          line === "Custom" ? (
            <div key={line}>
              <label className="font-medium">请输入自定义站点</label>
              <CreatableSelect
                isMulti
                onChange={(vals) =>
                  setSelectedStations((prev) => ({
                    ...prev,
                    [line]: vals
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
                options={transitData[line].map((s) => ({
                  value: s,
                  label: s
                }))}
                value={selectedStations[line] || []}
                onChange={(vals) =>
                  setSelectedStations((prev) => ({
                    ...prev,
                    [line]: vals
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
