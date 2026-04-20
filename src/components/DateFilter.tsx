import { Select } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface DateFilterProps {
  value: "all" | "week" | "month" | "3months";
  onChange: (filter: "all" | "week" | "month" | "3months") => void;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  const { t } = useTranslation();
  return (
    <Select
      size="md"
      value={value}
      onChange={(newValue) =>
        onChange(newValue as "all" | "week" | "month" | "3months")
      }
      data={[
        { value: "all", label: t("dateFilter.allEvents") },
        { value: "week", label: t("dateFilter.thisWeek") },
        { value: "month", label: t("dateFilter.thisMonth") },
        { value: "3months", label: t("dateFilter.next3Months") },
      ]}
      style={{ width: "180px" }}
    />
  );
}
