"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, AField, AInput, ATextarea, Card, ConfirmDialog, EmptyBlock, PageHeader, Table, TableSkeleton, Thumb } from "@/components/admin/ui";
import { SingleImage, type Img } from "@/components/admin/image-uploader";
import { Modal, Switch } from "@/components/ui/radix";
import { Badge } from "@/components/ui/badge";
import { adminApi, run } from "@/lib/admin/actions";
import { slugify } from "@/lib/utils";
import type { Category } from "@/lib/types";

type Form = { name: string; slug: string; description: string; image: Img | null; order: number; active: boolean };

export default function CategoriesPage() {
  const { categories, products } = useAdminData();
  const [edit, setEdit] = useState<Category | "new" | null>(null);
  const [del, setDel] = useState<Category | null>(null);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products ?? []) m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1);
    return m;
  }, [products]);
  const list = useMemo(() => [...(categories ?? [])].sort((a, b) => a.order - b.order), [categories]);

  const swap = async (i: number, j: number) => {
    const a = list[i], b = list[j];
    if (!a || !b) return;
    const body = (c: Category, order: number) => ({ name: c.name, slug: c.slug, description: c.description ?? "", image: c.image, order, active: c.active });
    // when two categories share the same order value, use the index
    const oa = a.order === b.order ? i : a.order, ob = a.order === b.order ? j : b.order;
    await run(Promise.all([adminApi.updateCategory(a.id, body(a, ob)), adminApi.updateCategory(b.id, body(b, oa))]), "Order updated");
  };

  return (
    <>
      <PageHeader title="Categories" description="Organise products. Display order controls how they appear in the menu and on the homepage." actions={<AButton onClick={() => setEdit("new")}><Plus /> Add category</AButton>} />
      <Card className="overflow-hidden">
        {!categories ? (
          <TableSkeleton rows={5} />
        ) : list.length === 0 ? (
          <EmptyBlock icon={FolderTree} title="No categories yet" description="Create categories like Women Eastern, Men, Kids…" action={<AButton onClick={() => setEdit("new")}><Plus /> Add category</AButton>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <th className="w-20">Order</th>
                <th>Category</th>
                <th>Slug</th>
                <th className="text-right">Products</th>
                <th>Status</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => (
                <tr key={c.id} className="transition hover:bg-muted/50">
                  <td>
                    <div className="flex gap-0.5">
                      <AButton size="icon-sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => swap(i, i - 1)}><ArrowUp /></AButton>
                      <AButton size="icon-sm" variant="ghost" aria-label="Move down" disabled={i === list.length - 1} onClick={() => swap(i, i + 1)}><ArrowDown /></AButton>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Thumb src={c.image?.url} alt={c.name} className="size-12" />
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        {c.description && <p className="max-w-xs truncate text-xs text-muted-foreground">{c.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground">/{c.slug}</td>
                  <td className="text-right tabular-nums">{counts.get(c.id) ?? 0}</td>
                  <td>{c.active ? <Badge variant="success" shape="pill">Visible</Badge> : <Badge variant="neutral" shape="pill">Hidden</Badge>}</td>
                  <td>
                    <div className="flex justify-end gap-0.5">
                      <AButton size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEdit(c)}><Pencil /></AButton>
                      <AButton size="icon-sm" variant="ghost" aria-label="Delete" className="text-sale" onClick={() => setDel(c)}><Trash2 /></AButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={!!edit} onOpenChange={(v) => !v && setEdit(null)} title={edit === "new" ? "Add category" : "Edit category"} className="max-w-xl">
        {edit && <CategoryForm key={edit === "new" ? "new" : edit.id} cat={edit === "new" ? null : edit} nextOrder={list.length + 1} onDone={() => setEdit(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!del}
        onOpenChange={(v) => !v && setDel(null)}
        title={`Delete “${del?.name}”?`}
        description={del && counts.get(del.id) ? `This category still has ${counts.get(del.id)} product(s). Move them to another category first.` : "This can't be undone."}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => { if (del) await run(adminApi.deleteCategory(del.id), "Category deleted"); }}
      />
    </>
  );
}

function CategoryForm({ cat, nextOrder, onDone }: { cat: Category | null; nextOrder: number; onDone: () => void }) {
  const [f, setF] = useState<Form>(() => (cat ? { name: cat.name, slug: cat.slug, description: cat.description ?? "", image: cat.image?.url ? cat.image : null, order: cat.order, active: cat.active } : { name: "", slug: "", description: "", image: null, order: nextOrder, active: true }));
  const [touched, setTouched] = useState(!!cat);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (f.name.trim().length < 2) return toast.error("Enter a category name");
    if (!f.image) return toast.error("Please add a category image");
    setBusy(true);
    const body = { ...f, name: f.name.trim(), slug: f.slug || slugify(f.name), image: { url: f.image.url, publicId: f.image.publicId } };
    const ok = await run(cat ? adminApi.updateCategory(cat.id, body) : adminApi.createCategory(body), cat ? "Category saved" : "Category created");
    setBusy(false);
    if (ok) onDone();
  };
  return (
    <div className="space-y-4">
      <SingleImage value={f.image} onChange={(image) => setF({ ...f, image })} folder="categories" aspect="aspect-[16/9]" label="Upload category image" />
      <div className="grid gap-3 sm:grid-cols-2">
        <AField label="Name" htmlFor="c-name"><AInput id="c-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, slug: touched ? f.slug : slugify(e.target.value) })} placeholder="Women Eastern" /></AField>
        <AField label="URL slug" htmlFor="c-slug" hint={`/category/${f.slug || "…"}`}><AInput id="c-slug" value={f.slug} onChange={(e) => { setTouched(true); setF({ ...f, slug: slugify(e.target.value) }); }} /></AField>
      </div>
      <AField label="Short description" htmlFor="c-desc"><ATextarea id="c-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="min-h-16" maxLength={300} placeholder="Lawn, chiffon & festive formals" /></AField>
      <div className="flex items-center justify-between gap-4">
        <AField label="Display order" htmlFor="c-order" className="w-32"><AInput id="c-order" inputMode="numeric" value={f.order} onChange={(e) => setF({ ...f, order: Math.round(Number(e.target.value) || 0) })} /></AField>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">Visible in store <Switch checked={f.active} onCheckedChange={(active) => setF({ ...f, active })} /></label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AButton variant="subtle" onClick={onDone}>Cancel</AButton>
        <AButton onClick={save} loading={busy}>{cat ? "Save changes" : "Create category"}</AButton>
      </div>
    </div>
  );
}
