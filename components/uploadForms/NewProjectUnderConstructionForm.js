// components/uploadForms/NewProjectUnderConstructionForm.js
"use client";

import ProjectLayoutsBlock from "@/components/uploadForms/ProjectLayoutsBlock";

export default function NewProjectUnderConstructionForm({
  // flags
  isBulkRentProject,
  enableProjectAutoCopy,

  // status
  computedStatus,

  // state
  projectCategory,
  setProjectCategory,
  projectSubType,
  setProjectSubType,
  unitLayouts,
  setUnitLayouts,
}) {
  return (
    <ProjectLayoutsBlock
      isBulkRentProject={isBulkRentProject}
      enableProjectAutoCopy={enableProjectAutoCopy}
      computedStatus={computedStatus}
      projectCategory={projectCategory}
      setProjectCategory={setProjectCategory}
      projectSubType={projectSubType}
      setProjectSubType={setProjectSubType}
      unitLayouts={unitLayouts}
      setUnitLayouts={setUnitLayouts}
    />
  );
}
