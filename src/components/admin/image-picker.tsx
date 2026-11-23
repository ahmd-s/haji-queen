"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { adminFetch, errorMessage, toFormData } from "@/components/admin/api";
import { SmallButton } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type UploadResponse = { ok: boolean; urls?: string[]; errors?: string[]; error?: string };

export function ImagePicker({
  value,
  onChange,
  max = 12,
}: {
  value: string[];
  onChange: (images: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");

  const upload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const result = await adminFetch<UploadResponse>("/api/admin/upload", {
        method: "POST",
        body: toFormData(files),
      });
      const remaining = Math.max(0, max - value.length);
      const urls = (result.urls ?? []).slice(0, remaining);
      if (urls.length > 0) onChange([...value, ...urls]);
      const notes = [...(result.errors ?? [])];
      if ((result.urls?.length ?? 0) > urls.length) notes.push("Photo limit reached for this product.");
      if (notes.length) setError(notes.join(" "));
    } catch (err) {
      setError(errorMessage(err, "Photos could not be uploaded."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url || value.length >= max) return;
    if (!/^(\/|https?:\/\/)/i.test(url)) {
      setError("Enter a path starting with / or a full https:// image URL.");
      return;
    }
    onChange([...value, url]);
    setUrlDraft("");
    setError(null);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((src, index) => (
            <div
              key={`${src}-${index}`}
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex.current !== null) move(dragIndex.current, index);
                dragIndex.current = null;
              }}
              className={cn(
                "group relative aspect-[3/4] overflow-hidden border border-border bg-cream",
                index === 0 && "ring-2 ring-gold"
              )}
            >
              {/* Product photos may be local paths or existing external URLs;
                  a raw img avoids remote-domain config for legacy catalogue data. */}
              <img src={src} alt={`Product photo ${index + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-espresso/80 px-2 py-1.5 text-ivory">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em]">
                  {index === 0 ? <Star className="h-3 w-3 fill-current" /> : null}
                  {index === 0 ? "Main" : `Photo ${index + 1}`}
                </span>
                <span className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 disabled:opacity-30"
                    aria-label={`Move photo ${index + 1} earlier`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === value.length - 1}
                    className="p-1 disabled:opacity-30"
                    aria-label={`Move photo ${index + 1} later`}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                    className="p-1 hover:text-destructive"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 border border-dashed border-border bg-cream/40 px-4 py-10 text-center hover:border-gold"
        >
          <ImagePlus className="h-6 w-6 text-gold" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-espresso">Add product photos</span>
          <span className="text-[11.5px] text-taupe">JPG, PNG or WEBP up to 8 MB each</span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SmallButton onClick={() => inputRef.current?.click()} disabled={uploading || value.length >= max}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          {value.length > 0 ? "Add more photos" : "Choose photos"}
        </SmallButton>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            void upload(Array.from(event.target.files ?? []));
          }}
        />
        {value.length > 0 ? (
          <span className="text-[11px] text-taupe">
            Drag photos to reorder. The first photo is the main product image.
          </span>
        ) : null}
      </div>

      {value.length < max ? (
        <div className="flex flex-wrap gap-2">
          <input
            className="field-hq h-9 flex-1 text-[12px]"
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            placeholder="Or paste an existing photo path / URL"
            aria-label="Existing photo path"
          />
          <SmallButton onClick={addUrl} disabled={!urlDraft.trim()}>Add</SmallButton>
        </div>
      ) : null}

      {error ? <p className="text-[11.5px] text-destructive">{error}</p> : null}
      <p className="text-[11px] text-taupe">{value.length} of {max} photos</p>
    </div>
  );
}
