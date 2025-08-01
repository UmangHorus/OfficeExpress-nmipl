"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FileUploadCard = ({
  title,
  description,
  multiple = false,
  onFilesSelected,
  allowedTypes = [],
}) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const inputId = `file-upload-${title.replace(/\s+/g, "-").toLowerCase()}`;

  const acceptTypes = allowedTypes
    .map((type) => {
      if (["jpg", "jpeg", "png"].includes(type))
        return `image/${type === "jpg" ? "jpeg" : type}`;
      if (type === "pdf") return "application/pdf";
      if (type === "xls") return "application/vnd.ms-excel";
      if (type === "xlsx")
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      return "";
    })
    .filter(Boolean)
    .join(",");

  const validateFiles = (selectedFiles) => {
    if (!allowedTypes.length) return true;

    const allowedExtensions = allowedTypes.map((type) => type.toLowerCase());
    for (const file of selectedFiles) {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        return false;
      }
    }
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (!validateFiles(selectedFiles)) {
      setError(
        `Invalid file type. Only ${allowedTypes
          .join(", ")
          .toUpperCase()} files are allowed.`
      );
      setFiles([]);
      onFilesSelected?.([]);
      return;
    }

    setError("");
    setFiles(selectedFiles);
    onFilesSelected?.(selectedFiles);
  };

  return (
    <div className="border rounded-lg p-4">
      <div>
        <h3 className="font-medium">{title}</h3>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Input
          type="file"
          id={inputId}
          multiple={multiple}
          accept={acceptTypes}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button asChild variant="outline">
          <Label htmlFor={inputId} className="cursor-pointer">
            {files.length > 0 ? "Change Files" : "Select Files"}
          </Label>
        </Button>
        {files.length > 0 && !error && (
          <span className="text-sm">
            {files.length} {multiple ? "files" : "file"} selected
          </span>
        )}
      </div>

      {files.length > 0 && !error && (
        <div className="text-sm text-gray-700 space-y-1 mt-2">
          <ul className="list-disc list-inside">
            {files.map((file, index) => (
              <li key={index} className="break-words break-all text-wrap">
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-1">
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUploadCard;
