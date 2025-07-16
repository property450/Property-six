
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import dynamic from 'next/dynamic';
import TypeSelector from '../../components/TypeSelector';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const MapPicker = dynamic(() => import('../../components/MapPicker'), { ssr: false });

export default function EditProperty() {
  const router = useRouter();
  const { id } = router.query;
  const user = useUser();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

  async function fetchProperty() {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
    if (data) {
      setProperty(data);
      setImages(data.image_urls || []);
    } else {
      alert('无法加载房源');
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setNewImages([...e.target.files]);
  };

  const getStoragePathFromUrl = (url) => {
    const parts = url.split('/');
    const index = parts.findIndex((p) => p === 'property-images');
    return parts.slice(index + 1).join('/');
  };

  const removeImage = async (index) => {
    const confirmDelete = confirm('确定要删除这张图片吗？此操作将永久移除');
    if (!confirmDelete) return;

    const imgUrl = images[index];
    const path = getStoragePathFromUrl(imgUrl);

    const { error: deleteError } = await supabase.storage.from('property-images').remove([path]);
    if (deleteError) {
      alert('删除失败：' + deleteError.message);
      return;
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...images];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setImages(reordered);
  };

  const setCoverImage = (index) => {
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const updatedImageUrls = [...images];

    for (const file of newImages) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('property-images').upload(fileName, file);

      if (uploadError) {
        alert('上传失败：' + uploadError.message);
        setUpdating(false);
        return;
      }

      const url = supabase.storage.from('property-images').getPublicUrl(fileName).data.publicUrl;
      updatedImageUrls.push(url);
    }

    const { error: updateError } = await supabase.from('properties').update({
      ...property,
      price: Number(property.price),
      bedrooms: Number(property.bedrooms),
      bathrooms: Number(property.bathrooms),
      carparks: Number(property.carparks),
      storerooms: Number(property.storerooms),
      image_urls: updatedImageUrls,
    }).eq('id', id);

    if (updateError) {
      alert('更新失败：' + updateError.message);
    } else {
      alert('房源已更新');
      router.push('/');
    }
    setUpdating(false);
  };

  if (!user || !property) return <div className="p-4">加载中...</div>;
  if (user.id !== property.user_id) return <div className="p-4 text-red-600">你没有权限编辑此房源</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">编辑房源</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <input name="title" value={property.title || ''} onChange={handleChange} className="border p-2 w-full" placeholder="房产标题" />
        <textarea name="description" value={property.description || ''} onChange={handleChange} className="border p-2 w-full" placeholder="描述" />
        <input name="price" value={property.price || ''} onChange={handleChange} type="number" className="border p-2 w-full" placeholder="价格" />
        <input name="location" value={property.location || ''} onChange={handleChange} className="border p-2 w-full" placeholder="地点" />
        <TypeSelector value={property.type} onChange={(val) => setProperty((p) => ({ ...p, type: val }))} />

        <div className="grid grid-cols-2 gap-4">
          <input name="bedrooms" value={property.bedrooms || ''} onChange={handleChange} type="number" className="border p-2" placeholder="房间数" />
          <input name="bathrooms" value={property.bathrooms || ''} onChange={handleChange} type="number" className="border p-2" placeholder="浴室数" />
          <input name="carparks" value={property.carparks || ''} onChange={handleChange} type="number" className="border p-2" placeholder="车位数" />
          <input name="storerooms" value={property.storerooms || ''} onChange={handleChange} type="number" className="border p-2" placeholder="储藏室数" />
        </div>

        <MapPicker lat={property.lat} lng={property.lng} onPick={(lat, lng) => setProperty((p) => ({ ...p, lat, lng }))} />

        <input type="file" accept="image/*" multiple onChange={handleImageChange} />

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="images">
            {(provided) => (
              <div className="grid grid-cols-2 gap-2" ref={provided.innerRef} {...provided.droppableProps}>
                {images.map((url, i) => (
                  <Draggable key={url} draggableId={url} index={i}>
                    {(provided) => (
                      <div
                        className="relative"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <img loading="lazy" src={url} className="w-full h-32 object-cover rounded" />
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

        <button type="submit" disabled={updating} className="bg-blue-600 text-white px-4 py-2 w-full rounded">
          {updating ? '更新中...' : '保存更改'}
        </button>
      </form>
    </div>
  );
}

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import dynamic from 'next/dynamic';
import TypeSelector from '../../components/TypeSelector';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const MapPicker = dynamic(() => import('../../components/MapPicker'), { ssr: false });

export default function EditProperty() {
  const router = useRouter();
  const { id } = router.query;
  const user = useUser();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

  async function fetchProperty() {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
    if (data) {
      setProperty(data);
      setImages(data.image_urls || []);
    } else {
      alert('无法加载房源');
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setNewImages([...e.target.files]);
  };

  const getStoragePathFromUrl = (url) => {
    const parts = url.split('/');
    const index = parts.findIndex((p) => p === 'property-images');
    return parts.slice(index + 1).join('/');
  };

  const removeImage = async (index) => {
    const confirmDelete = confirm('确定要删除这张图片吗？此操作将永久移除');
    if (!confirmDelete) return;

    const imgUrl = images[index];
    const path = getStoragePathFromUrl(imgUrl);

    const { error: deleteError } = await supabase.storage.from('property-images').remove([path]);
    if (deleteError) {
      alert('删除失败：' + deleteError.message);
      return;
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...images];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setImages(reordered);
  };

  const setCoverImage = (index) => {
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const updatedImageUrls = [...images];

    for (const file of newImages) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('property-images').upload(fileName, file);

      if (uploadError) {
        alert('上传失败：' + uploadError.message);
        setUpdating(false);
        return;
      }

      const url = supabase.storage.from('property-images').getPublicUrl(fileName).data.publicUrl;
      updatedImageUrls.push(url);
    }

    const { error: updateError } = await supabase.from('properties').update({
      ...property,
      price: Number(property.price),
      bedrooms: Number(property.bedrooms),
      bathrooms: Number(property.bathrooms),
      carparks: Number(property.carparks),
      storerooms: Number(property.storerooms),
      image_urls: updatedImageUrls,
    }).eq('id', id);

    if (updateError) {
      alert('更新失败：' + updateError.message);
    } else {
      alert('房源已更新');
      router.push('/');
    }
    setUpdating(false);
  };

  if (!user || !property) return <div className="p-4">加载中...</div>;
  if (user.id !== property.user_id) return <div className="p-4 text-red-600">你没有权限编辑此房源</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">编辑房源</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <input name="title" value={property.title || ''} onChange={handleChange} className="border p-2 w-full" placeholder="房产标题" />
        <textarea name="description" value={property.description || ''} onChange={handleChange} className="border p-2 w-full" placeholder="描述" />
        <input name="price" value={property.price || ''} onChange={handleChange} type="number" className="border p-2 w-full" placeholder="价格" />
        <input name="location" value={property.location || ''} onChange={handleChange} className="border p-2 w-full" placeholder="地点" />
        <TypeSelector value={property.type} onChange={(val) => setProperty((p) => ({ ...p, type: val }))} />

        <div className="grid grid-cols-2 gap-4">
          <input name="bedrooms" value={property.bedrooms || ''} onChange={handleChange} type="number" className="border p-2" placeholder="房间数" />
          <input name="bathrooms" value={property.bathrooms || ''} onChange={handleChange} type="number" className="border p-2" placeholder="浴室数" />
          <input name="carparks" value={property.carparks || ''} onChange={handleChange} type="number" className="border p-2" placeholder="车位数" />
          <input name="storerooms" value={property.storerooms || ''} onChange={handleChange} type="number" className="border p-2" placeholder="储藏室数" />
        </div>

        <MapPicker lat={property.lat} lng={property.lng} onPick={(lat, lng) => setProperty((p) => ({ ...p, lat, lng }))} />

        <input type="file" accept="image/*" multiple onChange={handleImageChange} />

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="images">
            {(provided) => (
              <div className="grid grid-cols-2 gap-2" ref={provided.innerRef} {...provided.droppableProps}>
                {images.map((url, i) => (
                  <Draggable key={url} draggableId={url} index={i}>
                    {(provided) => (
                      <div
                        className="relative"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <img loading="lazy" src={url} className="w-full h-32 object-cover rounded" />
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

        <button type="submit" disabled={updating} className="bg-blue-600 text-white px-4 py-2 w-full rounded">
          {updating ? '更新中...' : '保存更改'}
        </button>
      </form>
    </div>
  );
}

