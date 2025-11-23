import { supabase } from "./client";

export const handleFileUpload = async (bucket: string, folderName: string, file: any) => {
  const ext = file.type.split("/")[1];

  const { data, error } = await supabase.storage.from(bucket).upload(`${folderName}/file_${Date.now()}.${ext}`, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Error uploading file:", error.message);
    return null;
  } else {
    console.log("File uploaded successfully:", data);
    return data;
  }
};

export const handleFileExtUpload = async (bucket: string, folderName: string, file: any, ext: string) => {
  const { data, error } = await supabase.storage.from(bucket).upload(`${folderName}/file_${Date.now()}.${ext}`, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Error uploading file:", error.message);
    return null;
  } else {
    console.log("File uploaded successfully:", data);
    return data;
  }
};

export const downloadFile = async (bucket: string, folderName: string, fileName: string) => {
  const { data, error } = await supabase.storage.from(bucket).download(`${folderName}/${fileName}`);

  if (error) {
    console.error("Error download files:", error.message);
    return { data, status: false };
  } else {
    return { data, status: true };
  }
};

export const getPublicUrl = async (bucket: string, folderName: string, fileName: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(`${folderName}/${fileName}`);

  return data.publicUrl;
};
