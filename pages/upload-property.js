import { useEffect, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import dynamic from 'next/dynamic';
import TypeSelector from '../components/TypeSelector';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const MapPicker = dynamic(() => import('../components/MapPicker'), { ssr: false });

export default function UploadProperty() {
  const user = useUser();
  const router = useRouter();

  const [form, setForm] = useState({
    title: '', description: '', price: '', location: '', type: '',
    bedrooms: '', bathrooms: '', carparks: '', storerooms: '', lat: null, lng: null
  });
  const [images, setImages] = useState([]); // local file objects
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user === null) router.push('/login');
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setCoverImage = (index) => {
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...images];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setImages(reordered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const image_urls = [];
    for (const file of images) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('property-images').upload(fileName, file);
      if (uploadError) {
        alert('上传失败：' + uploadError.message);
        setUploading(false);
        return;
      }
      const url = supabase.storage.from('property-images').getPublicUrl(fileName).data.publicUrl;
      image_urls.push(url);
    }

    const { error } = await supabase.from('properties').insert([
      {
        ...form,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        carparks: Number(form.carparks),
        storerooms: Number(form.storerooms),
        user_id: user.id,
        image_urls,
      }
    ]);

    if (error) {
      alert('房源上传失败：' + error.message);
    } else {
      alert('房源已上传');
      router.push('/');
    }

    setUploading(false);
  };

  if (!user) return <div className="p-4">请先登录...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" value={form.title} onChange={handleChange} className="border p-2 w-full" placeholder="房产标题" />
        <textarea name="description" value={form.description} onChange={handleChange} className="border p-2 w-full" placeholder="描述" />
        <input name="price" value={form.price} onChange={handleChange} type="number" className="border p-2 w-full" placeholder="价格" />
        <input name="location" value={form.location} onChange={handleChange} className="border p-2 w-full" placeholder="地点" />
        <TypeSelector value={form.type} onChange={(val) => setForm((p) => ({ ...p, type: val }))} />

        <div className="grid grid-cols-2 gap-4">
          <input name="bedrooms" value={form.bedrooms} onChange={handleChange} type="number" className="border p-2" placeholder="房间数" />
          <input name="bathrooms" value={form.bathrooms} onChange={handleChange} type="number" className="border p-2" placeholder="浴室数" />
          <input name="carparks" value={form.carparks} onChange={handleChange} type="number" className="border p-2" placeholder="车位数" />
          <input name="storerooms" value={form.storerooms} onChange={handleChange} type="number" className="border p-2" placeholder="储藏室数" />
        </div>

        <MapPicker lat={form.lat} lng={form.lng} onPick={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))} />

        <input type="file" accept="image/*" multiple onChange={handleImageChange} />

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="images">
            {(provided) => (
              <div className="grid grid-cols-2 gap-2" ref={provided.innerRef} {...provided.droppableProps}>
                {images.map((file, i) => (
                  <Draggable key={i.toString()} draggableId={i.toString()} index={i}>
                    {(provided) => (
                      <div
                        className="relative"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <img loading="lazy" src={URL.createObjectURL(file)} className="w-full h-32 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm hover:bg-red-700"
                          title="删除图片"
                        >×</button>
                        <button
                          type="button"
                          onClick={() => setCoverImage(i)}
                          className="absolute bottom-1 left-1 bg-yellow-500 text-white px-1 rounded text-xs hover:bg-yellow-600"
                          title="设为封面"
                        >封面</button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 w-full rounded">
          {uploading ? '上传中...' : '提交房源'}
        </button>
      </form>
    </div>
  );
}
