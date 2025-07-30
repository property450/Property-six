"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
// 暂时不引入任何组件

export default function HomePage() {
  return (
    <div className="p-4">
      <div className="text-2xl font-bold mb-4">✅ Hello World</div>
    </div>
  );
}
