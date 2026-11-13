"use client";
import { useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, GripVertical, ImagePlus, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

export type Img = { url: string; publicId: string; alt?: string };
type Pending = { id: string; preview: string; progress: number; error?: string };
type Folder = "products" | "categories" | "banners" | "branding";

/**
 * Multi-image uploader: drag & drop / multi-select / phone camera, client compression,
 * signed Cloudinary upload with progress, drag-to-reorder, set cover, delete.
 */
export function ImageUploader({ value, onChange, max = 8, folder = "products", className }: { value: Img[]; onChange: (fn: (prev: Img[]) => Img[]) => void; max?: number; folder?: Folder; className?: string }) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [over, setOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const room = max - value.length - pending.length;

  const add = (files: FileList | File[] | null) => {
    if (!files) return;
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    if (list.length > room) toast.error(`You can add ${Math.max(room, 0)} more photo${room === 1 ? "" : "s"} (max ${max}).`);
    for (const f of list.slice(0, Math.max(room, 0))) {
      if (f.size > 15 * 1024 * 1024) {
        toast.error(`${f.name} is larger than 15 MB`);
        continue;
      }
      const id = Math.random().toString(36).slice(2);
      const preview = URL.createObjectURL(f);
      setPending((p) => [...p, { id, preview, progress: 0 }]);
      uploadImage(f, folder, (pct) => setPending((p) => p.map((x) => (x.id === id ? { ...x, progress: pct } : x))))
        .then((r) => {
          onChange((prev) => [...prev, { url: r.url, publicId: r.publicId }]);
          setPending((p) => p.filter((x) => x.id !== id));
          URL.revokeObjectURL(preview);
        })
        .catch((e: Error) => {
          setPending((p) => p.map((x) => (x.id === id ? { ...x, error: e.message || "Upload failed" } : x)));
          toast.error(`Upload failed: ${e.message}`);
        });
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    onChange((prev) => {
      const n = [...prev];
      const [it] = n.splice(from, 1);
      n.splice(to, 0, it);
      return n;
    });
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
        className={cn("rounded-xl border-2 border-dashed border-border p-4 transition", over && "border-accent bg-accent/5")}
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {value.map((img, i) => (
            <div
              key={img.url + i}
              draggable
              onDragStart={(e) => {
                setDragIdx(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (dragIdx !== null) e.preventDefault();
              }}
              onDrop={(e) => {
                if (dragIdx === null) return;
                e.preventDefault();
                move(dragIdx, i);
                setDragIdx(null);
              }}
              onDragEnd={() => setDragIdx(null)}
              className={cn("group relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted", dragIdx === i && "opacity-40", i === 0 && "ring-2 ring-accent")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? `Photo ${i + 1}`} className="size-full object-cover" draggable={false} />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Cover</span>}
              <span className="absolute right-1.5 top-1.5 hidden cursor-grab rounded-md bg-black/50 p-1 text-white sm:group-hover:block" aria-hidden>
                <GripVertical className="size-3.5" />
              </span>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-6 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <div className="flex gap-1">
                  <IconBtn label="Move left" onClick={() => move(i, i - 1)} disabled={i === 0}><ChevronLeft /></IconBtn>
                  <IconBtn label="Move right" onClick={() => move(i, i + 1)} disabled={i === value.length - 1}><ChevronRight /></IconBtn>
                </div>
                <div className="flex gap-1">
                  {i !== 0 && <IconBtn label="Set as cover" onClick={() => move(i, 0)}><Star /></IconBtn>}
                  <IconBtn label="Delete photo" onClick={() => onChange((prev) => prev.filter((_, k) => k !== i))} danger><Trash2 /></IconBtn>
                </div>
              </div>
            </div>
          ))}
          {pending.map((p) => (
            <div key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="Uploading" className="size-full object-cover opacity-50" />
              <div className="absolute inset-0 grid place-items-center p-3">
                {p.error ? (
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-sale">{p.error}</p>
                    <button type="button" className="mt-1 text-[11px] font-semibold underline" onClick={() => setPending((x) => x.filter((y) => y.id !== p.id))}>Remove</button>
                  </div>
                ) : (
                  <div className="w-full">
                    <Loader2 className="mx-auto size-5 animate-spin text-accent" />
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="mt-1 text-center text-[11px] font-semibold tabular-nums">{p.progress}%</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {room > 0 && (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface text-muted-foreground transition hover:border-accent hover:text-accent">
              <ImagePlus className="size-6" strokeWidth={1.6} />
              <span className="text-[11.5px] font-semibold">Add photos</span>
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <UploadCloud className="size-4 shrink-0" /> Drag & drop photos here · {value.length}/{max} · first photo is the cover · drag to reorder
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={room <= 0} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold transition hover:border-foreground/40 disabled:opacity-50">
              <ImagePlus className="size-3.5" /> Upload
            </button>
            <button type="button" onClick={() => camRef.current?.click()} disabled={room <= 0} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold transition hover:border-foreground/40 disabled:opacity-50">
              <Camera className="size-3.5" /> Camera
            </button>
          </div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={cn("grid size-7 place-items-center rounded-md bg-white/90 text-[#141414] transition hover:bg-white disabled:opacity-40 [&_svg]:size-3.5", danger && "hover:bg-sale hover:text-white")}>
      {children}
    </button>
  );
}

/** Single image picker (category image, logo, banner). */
export function SingleImage({ value, onChange, folder, aspect = "aspect-[4/3]", label = "Upload image" }: { value: Img | null; onChange: (v: Img | null) => void; folder: Folder; aspect?: string; label?: string }) {
  const [progress, setProgress] = useState<number | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (f?: File) => {
    if (!f) return;
    setProgress(0);
    try {
      const r = await uploadImage(f, folder, setProgress);
      onChange({ url: r.url, publicId: r.publicId });
    } catch (e) {
      toast.error(`Upload failed: ${(e as Error).message}`);
    } finally {
      setProgress(null);
    }
  };
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
        className={cn("group relative grid w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-accent", aspect)}
      >
        {value?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs font-semibold">
            <ImagePlus className="size-6" strokeWidth={1.6} /> {label}
          </span>
        )}
        {value?.url && <span className="absolute inset-0 grid place-items-center bg-black/0 text-xs font-semibold text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">Replace image</span>}
        {progress !== null && (
          <span className="absolute inset-x-4 bottom-4 h-1.5 overflow-hidden rounded-full bg-white/70">
            <span className="block h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </span>
        )}
      </button>
      {value?.url && (
        <button type="button" onClick={() => onChange(null)} className="mt-1.5 text-xs font-semibold text-sale hover:underline">
          Remove
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}
