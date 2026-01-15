import React from "react";
import SchoolSettings from "./SchoolSettings";
import ProgramSettings from "./ProgramSettings";
import AcademicYearSettings from "./AcademicYearSettings";

const OrganizationSettings = ({
  schools,
  programs,
  years,
  onUpdateSchools,
  onUpdatePrograms,
  onUpdateYears,
}) => {
  return (
    <div className="space-y-6">
      <section>
        <SchoolSettings schools={schools} onUpdate={onUpdateSchools} />
      </section>

      <section>
        <ProgramSettings
          schools={schools}
          programs={programs}
          onUpdate={onUpdatePrograms}
        />
      </section>

      <section>
        <AcademicYearSettings years={years} onUpdate={onUpdateYears} />
      </section>
    </div>
  );
};

export default OrganizationSettings;
