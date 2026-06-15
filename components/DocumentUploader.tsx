"use client";

import React, { useRef, useState } from "react";

interface UploadedFile {
  url: string;
  name: string;
}

interface FileUploadState {
  file: File;
  progress: number;
  done: boolean;
}

interface Props {
  onUploaded: (files: UploadedFile[]) => void;
  type: "images" | "videos" | "documents";
}

export default function DocumentUploader({ onUploaded, type }: Props) {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const triggerSelectFile = () => inputRef.current?.click();

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const newUploads: FileUploadState[] = [...files].map((file) => ({
      file,
      progress: 0,
      done: false,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    const uploadedResults: UploadedFile[] = [];

   for (let file of files) {
      // 1️⃣ Get signed Cloudinary upload signature from backend (UPDATED to POST)
      const sigResponse = await fetch('/api/upload/cloudinary-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder: type }), // 'type' is 'images', 'videos', or 'documents'
      });

      if (!sigResponse.ok) {
        console.error("Failed to get signature");
        continue;
      }

      const { timestamp, signature, apiKey, cloudName } = await sigResponse.json();

      // 2️⃣ Build multipart body
      const formData = new FormData();
      formData.append("file", file);
      formData.append("timestamp", timestamp.toString()); // Ensure string
      formData.append("signature", signature);
      formData.append("api_key", apiKey);
      formData.append("folder", type); // Cloudinary needs the folder name in the upload too

      // 3️⃣ Determine Resource Type (Critical for Images/Videos to render correctly)
      // If type is 'documents', use 'raw'. Otherwise use 'image' or 'video'.
      const resourceType = type === 'documents' ? 'raw' : (type === 'videos' ? 'video' : 'image');

      // 4️⃣ Use XMLHttpRequest for REAL upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);

            setUploads((prev) =>
              prev.map((u) =>
                u.file === file ? { ...u, progress } : u
              )
            );
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            uploadedResults.push({ url: res.secure_url, name: file.name });

            setUploads((prev) =>
              prev.map((u) =>
                u.file === file ? { ...u, progress: 100, done: true } : u
              )
            );
            resolve();
          } else {
             reject(new Error("Cloudinary upload failed"));
          }
        });

        xhr.addEventListener("error", reject);

        // UPDATED URL: Uses dynamic resourceType instead of hardcoded 'raw'
        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
        );
        xhr.send(formData);
      });
    }

    onUploaded(uploadedResults);
  };

  // return based on type
  

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-900 transition hover:border-black/50 cursor-pointer"
      onClick={triggerSelectFile}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
  <div className="text-3xl">📄</div>

  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
    Upload your documents
  </h3>

  <p className="text-sm text-gray-500 dark:text-gray-400">
    Drag & drop files here
  </p>

  <span className="relative text-sm font-medium text-primary dark:text-primary mt-1 after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:w-full after:h-[2px] after:bg-primary dark:after:bg-primary">
    or browse
  </span>

  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
    PDF, PPT, DOCX, ZIP — up to 50MB
  </p>
</div>


      {uploads.length > 0 && (
        <div className="mt-5 space-y-3">
          {uploads.map((upload) => (
            <div
              key={upload.file.name}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{upload.file.name}</span>
                {upload.done ? (
                  <span className="text-primary font-semibold">✅ Done</span>
                ) : (
                  <span className="text-gray-500">{upload.progress}%</span>
                )}
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    upload.done ? "bg-primary/100" : "bg-primary/100"
                  }`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
