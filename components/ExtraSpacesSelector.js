// components/ExtraSpacesSelector.js
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function ExtraSpacesSelector({ value = [], onChange }) {
  // 预设额外空间选项
  const presetSpaces = [
    "Balcony",
    "Study Room",
    "Maid Room",
    "Storage Room",
    "Utility Room",
    "Patio",
    "Garden",
    "Loft"
  ];

  const [selectedSpaces, setSelectedSpaces] = useState(value);
  const [customInput, setCustomInput] = useState("");

  // 添加新的空间
  const addSpace = (spaceType) => {
    if (!spaceType.trim()) return;
    // 如果已存在，不重复添加
    if (selectedSpaces.find((s) => s.type.toLowerCase() === spaceType.toLowerCase())) return;

    const updated = [...selectedSpaces, { type: spaceType, count: 1 }];
    setSelectedSpaces(updated);
    onChange?.(updated);
    setCustomInput("");
  };

  // 删除空间
  const removeSpace = (spaceType) => {
    const updated = selectedSpaces.filter((s) => s.type !== spaceType);
    setSelectedSpaces(updated);
    onChange?.(updated);
  };

  // 修改数量
  const updateCount = (spaceType, count) => {
    const updated = selectedSpaces.map((s) =>
      s.type === spaceType ? { ...s, count: Number(count) } : s
    );
    setSelectedSpaces(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-3">
      {/* 预设多选标签 */}
      <div className="flex flex-wrap gap-2">
        {presetSpaces.map((space) => {
          const isSelected = selectedSpaces.some(
            (s) => s.type.toLowerCase() === space.toLowerCase()
          );
          return (
            <Button
              key={space}
              variant={isSelected ? "secondary" : "outline"}
              size="sm"
              onClick={() => addSpace(space)}
            >
              {space}
            </Button>
          );
        })}
      </div>

      {/* 自定义输入 */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter custom extra space"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSpace(customInput);
            }
          }}
        />
        <Button onClick={() => addSpace(customInput)}>Add</Button>
      </div>

      {/* 已选空间框架 */}
      <div className="space-y-2">
        {selectedSpaces.map((space) => (
          <div
            key={space.type}
            className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50"
          >
            <span className="font-medium">{space.type}</span>
            <Input
              type="number"
              min="0"
              value={space.count}
              onChange={(e) => updateCount(space.type, e.target.value)}
              className="w-20"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSpace(space.type)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
