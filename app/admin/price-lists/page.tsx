"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type PriceList = {
  id: string;
  title: string;
  tagline: string | null;
  image_url: string;
  active: boolean;
  sort_order: number;
};

type ItemRow = {
  id: string | null;
  groupLabel: string;
  label: string;
  price: string;
  contents: string;
};

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink";

function fetchPriceLists() {
  return supabase
    .from("price_lists")
    .select("id, title, tagline, image_url, active, sort_order")
    .order("sort_order")
    .returns<PriceList[]>();
}

// Same add/edit/remove-row-in-memory pattern already used for product
// size variants -- one card's price lines, kept as local state until
// the whole form is saved.
function ItemsEditor({ items, onChange }: { items: ItemRow[]; onChange: (items: ItemRow[]) => void }) {
  function updateRow(index: number, patch: Partial<ItemRow>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function removeRow(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...items, { id: null, groupLabel: "", label: "", price: "", contents: "" }]);
  }

  return (
    <div>
      <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
        Price lines
      </label>
      <p className="mt-1 font-body text-xs text-ink/50">
        &ldquo;Group&rdquo; is optional -- use it to cluster related lines under a small heading
        (e.g. &ldquo;Mini Banana Bread&rdquo; vs &ldquo;Medium Banana Bread&rdquo;).
        &ldquo;What&apos;s included&rdquo; is optional too -- fill it in for pack-style items
        (like Small Chops) and customers will see a small &ldquo;+&rdquo; to reveal it; leave it
        blank for a plain size/price line.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-panel bg-plaster/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={item.groupLabel}
                onChange={(e) => updateRow(index, { groupLabel: e.target.value })}
                placeholder="Group (optional)"
                className={`${inputClasses} max-w-[160px]`}
              />
              <input
                value={item.label}
                onChange={(e) => updateRow(index, { label: e.target.value })}
                placeholder="e.g. Odogwu Pack"
                className={`${inputClasses} max-w-[180px]`}
              />
              <input
                value={item.price}
                onChange={(e) => updateRow(index, { price: e.target.value })}
                inputMode="numeric"
                placeholder="Price (₦)"
                className={`${inputClasses} max-w-[140px]`}
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="shrink-0 font-body text-small font-medium text-berry"
              >
                Remove
              </button>
            </div>
            <textarea
              value={item.contents}
              onChange={(e) => updateRow(index, { contents: e.target.value })}
              rows={2}
              placeholder="What's included (optional) -- e.g. 10 Spring Rolls, 10 Samosa, 25 Puff Puff"
              className={`${inputClasses} mt-2 resize-none`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="self-start font-body text-small font-medium text-cocoa"
        >
          + Add price line
        </button>
      </div>
    </div>
  );
}

async function saveItems(priceListId: string, items: ItemRow[], originalIds: Set<string>) {
  const usable = items.filter((i) => i.label.trim() && Number(i.price) > 0);
  const keptIds = new Set(usable.filter((i) => i.id).map((i) => i.id as string));
  const removedIds = Array.from(originalIds).filter((id) => !keptIds.has(id));

  if (removedIds.length > 0) {
    await supabase.from("price_list_items").delete().in("id", removedIds);
  }

  for (let i = 0; i < usable.length; i++) {
    const item = usable[i];
    const payload = {
      price_list_id: priceListId,
      group_label: item.groupLabel.trim() || null,
      label: item.label.trim(),
      price_naira: Number(item.price),
      contents: item.contents.trim() || null,
      sort_order: i,
    };
    if (item.id) {
      await supabase.from("price_list_items").update(payload).eq("id", item.id);
    } else {
      await supabase.from("price_list_items").insert(payload);
    }
  }
}

export default function AdminPriceListsPage() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function refetch() {
    fetchPriceLists().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setPriceLists(data ?? []);
    });
  }

  useEffect(() => {
    refetch();
  }, []);

  async function toggleActive(priceList: PriceList) {
    setPriceLists((current) =>
      current.map((p) => (p.id === priceList.id ? { ...p, active: !p.active } : p))
    );
    await supabase.from("price_lists").update({ active: !priceList.active }).eq("id", priceList.id);
  }

  async function deletePriceList(priceList: PriceList) {
    if (!window.confirm(`Delete "${priceList.title}"? This removes all its price lines too.`)) return;
    setPriceLists((current) => current.filter((p) => p.id !== priceList.id));
    await supabase.from("price_lists").delete().eq("id", priceList.id);
  }

  async function moveCard(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const reordered = [...priceLists];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setPriceLists(reordered);
    await Promise.all(
      reordered.map((p, i) =>
        p.sort_order === i ? null : supabase.from("price_lists").update({ sort_order: i }).eq("id", p.id)
      )
    );
  }

  function onSaved(updated: PriceList) {
    setPriceLists((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    setEditingId(null);
  }

  function onAdded(created: PriceList) {
    setPriceLists((current) => [...current, created]);
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-heading text-berry">Price Lists</p>
          <p className="mt-2 font-body text-body text-ink/60">
            The swipeable catalog on the landing page. Independent of Products/Categories -- add
            a price list for anything, even if it isn&apos;t a real ordering category.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((current) => !current)}
          className="shrink-0 rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream"
        >
          {adding ? "Close" : "New Price List"}
        </button>
      </div>

      {adding && (
        <div className="mt-6 rounded-panel bg-plaster/25 p-5">
          <AddPriceListForm nextSortOrder={priceLists.length} onAdded={onAdded} />
        </div>
      )}

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 flex flex-col gap-3">
        {priceLists.length === 0 && (
          <p className="rounded-panel bg-cream p-6 text-center font-body text-body text-ink/50 shadow-warm">
            No price lists yet.
          </p>
        )}
        {priceLists.map((priceList, index) =>
          editingId === priceList.id ? (
            <div key={priceList.id} className="rounded-panel bg-cream p-5 shadow-warm">
              <EditPriceListForm
                priceList={priceList}
                onSaved={onSaved}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={priceList.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) moveCard(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className="flex flex-col gap-4 rounded-panel bg-cream p-5 shadow-warm sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Drag-and-drop (above) is mouse-only and does nothing on a
                    touch screen, so these arrows are the reordering control
                    that actually works on mobile; desktop can still drag. */}
                <div className="hidden shrink-0 flex-col text-ink/40 sm:flex">
                  <button
                    type="button"
                    onClick={() => moveCard(index, index - 1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="disabled:opacity-25"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard(index, index + 1)}
                    disabled={index === priceLists.length - 1}
                    aria-label="Move down"
                    className="disabled:opacity-25"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>
                <GripVertical className="hidden size-4 shrink-0 cursor-grab text-ink/30 sm:block" />
                <div className="relative size-14 shrink-0 overflow-hidden rounded-panel">
                  <Image src={priceList.image_url} alt={priceList.title} fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-body text-ink">{priceList.title}</p>
                  {priceList.tagline && (
                    <p className="mt-1 truncate font-body text-small text-ink/60">{priceList.tagline}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {/* Mobile-only reorder buttons -- same as the desktop pair
                    above, since that column is hidden below sm. */}
                <div className="flex items-center gap-1 text-ink/40 sm:hidden">
                  <button
                    type="button"
                    onClick={() => moveCard(index, index - 1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="flex size-8 items-center justify-center disabled:opacity-25"
                  >
                    <ChevronUp className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard(index, index + 1)}
                    disabled={index === priceLists.length - 1}
                    aria-label="Move down"
                    className="flex size-8 items-center justify-center disabled:opacity-25"
                  >
                    <ChevronDown className="size-5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(priceList)}
                  title="Click to switch this price list on or off"
                  className={`shrink-0 rounded-pill px-4 py-1.5 text-xs font-semibold ${
                    priceList.active ? "bg-berry/15 text-berry" : "bg-clay/15 text-ink/50"
                  }`}
                >
                  {priceList.active ? "Active" : "Inactive"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(priceList.id)}
                  className="shrink-0 font-body text-small font-medium text-ink/60 hover:text-berry"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deletePriceList(priceList)}
                  className="shrink-0 font-body text-small font-medium text-ink/50 hover:text-berry"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function AddPriceListForm({
  nextSortOrder,
  onAdded,
}: {
  nextSortOrder: number;
  onAdded: (priceList: PriceList) => void;
}) {
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
    if (!imageFile) {
      setError("Please add a photo.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const compressed = await compressImage(imageFile);
      const ext = compressed.name.split(".").pop();
      const path = `price-lists/${title.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, compressed);
      if (uploadError) throw uploadError;
      const imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;

      const { data: created, error: insertError } = await supabase
        .from("price_lists")
        .insert({
          title: title.trim(),
          tagline: tagline.trim() || null,
          image_url: imageUrl,
          sort_order: nextSortOrder,
        })
        .select("id, title, tagline, image_url, active, sort_order")
        .single<PriceList>();
      if (insertError) throw insertError;

      await saveItems(created.id, items, new Set());
      onAdded(created);
      setTitle("");
      setTagline("");
      setImageFile(null);
      setItems([]);
    } catch {
      setError("Could not create this price list. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Exotic Parfaits)" className={inputClasses} />
      <input
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        placeholder="Tagline (optional, e.g. Layers of happiness in every cup)"
        className={inputClasses}
      />
      <div>
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="mt-1 font-body text-small text-ink"
        />
      </div>
      <ItemsEditor items={items} onChange={setItems} />
      {error && <p className="font-body text-small text-berry">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
      >
        {saving ? "Creating..." : "Create price list"}
      </button>
    </form>
  );
}

function EditPriceListForm({
  priceList,
  onSaved,
  onCancel,
}: {
  priceList: PriceList;
  onSaved: (priceList: PriceList) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(priceList.title);
  const [tagline, setTagline] = useState(priceList.tagline ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [originalItemIds, setOriginalItemIds] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("price_list_items")
      .select("id, group_label, label, price_naira, contents")
      .eq("price_list_id", priceList.id)
      .order("sort_order")
      .then(({ data }) => {
        const rows: ItemRow[] = (data ?? []).map((i) => ({
          id: i.id,
          groupLabel: i.group_label ?? "",
          label: i.label,
          price: String(i.price_naira),
          contents: i.contents ?? "",
        }));
        setItems(rows);
        setOriginalItemIds(new Set(rows.map((r) => r.id as string)));
        setLoadingItems(false);
      });
  }, [priceList.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let imageUrl = priceList.image_url;
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const ext = compressed.name.split(".").pop();
        const path = `price-lists/${title.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, compressed);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("price_lists")
        .update({ title: title.trim(), tagline: tagline.trim() || null, image_url: imageUrl })
        .eq("id", priceList.id);
      if (updateError) throw updateError;

      await saveItems(priceList.id, items, originalItemIds);
      onSaved({ ...priceList, title: title.trim(), tagline: tagline.trim() || null, image_url: imageUrl });
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClasses} />
      <input
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        placeholder="Tagline (optional)"
        className={inputClasses}
      />
      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-panel">
          <Image src={priceList.image_url} alt={priceList.title} fill sizes="56px" className="object-cover" />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="font-body text-small text-ink"
        />
      </div>
      {loadingItems ? (
        <p className="font-body text-small text-ink/50">Loading price lines...</p>
      ) : (
        <ItemsEditor items={items} onChange={setItems} />
      )}
      {error && <p className="font-body text-small text-berry">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="font-body text-small font-medium text-ink/60">
          Cancel
        </button>
      </div>
    </form>
  );
}
