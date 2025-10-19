import type { ReactElement } from "react";
import { File, FileText } from "lucide-react";
import { Badge } from "./ui/badge";

type FileMeta = {
  color: string;
  bg: string;
  label: string;
  useTextIcon: boolean;
};

const fileMetaFor = (fileName?: string): FileMeta => {
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase() ?? "";

  switch (ext) {
    case "pdf":
      return { color: "text-red-600", bg: "bg-red-100", label: "PDF", useTextIcon: true };
    case "doc":
    case "docx":
      return { color: "text-blue-600", bg: "bg-blue-100", label: "DOCX", useTextIcon: true };
    case "xls":
    case "xlsx":
      return { color: "text-green-600", bg: "bg-green-100", label: "XLSX", useTextIcon: true };
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
      return { color: "text-amber-600", bg: "bg-amber-100", label: "IMG", useTextIcon: false };
    case "zip":
    case "rar":
      return { color: "text-zinc-600", bg: "bg-zinc-100", label: "ZIP", useTextIcon: false };
    default:
      return { color: "text-zinc-500", bg: "bg-zinc-100", label: ext ? ext.toUpperCase() : "FILE", useTextIcon: false };
  }
};

/**
 * Returns a badge-style file icon with file extension label.
 */
export const FileIcon = (fileName?: string): ReactElement => {
  const { color, bg, label, useTextIcon } = fileMetaFor(fileName);
  const Icon = useTextIcon ? FileText : File;

  return (
    <Badge variant="outline" className={`w-9 h-9 p-0.5 flex flex-col ${bg}`}>
      <Icon className={`w-full h-full ${color}`} />
      <span className="text-[7px] font-bold text-black">{label}</span>
    </Badge>
  );
};


