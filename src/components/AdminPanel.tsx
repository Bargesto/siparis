import { useState, useRef } from 'react';
import { useStore } from '../contexts/StoreContext';
import { AddProductModal } from './AddProductModal';
import { EditProductModal } from './EditProductModal';
import * as XLSX from 'xlsx';
import { Download, Plus, Pencil, ShoppingBag, Upload, Camera, Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Product } from '../types';

export function AdminPanel() {
  const { products, orders, addProduct, editProduct, deleteProduct, siteName, setSiteName, logoUrl, setLogoUrl } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditingSiteName, setIsEditingSiteName] = useState(false);
  const [newSiteName, setNewSiteName] = useState(siteName);
  const [showCamera, setShowCamera] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const generateFileName = (prefix: string) => {
    const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    return `${prefix}-${date}.xlsx`;
  };

  const exportOrders = (productId?: string) => {
    let filteredOrders = orders;
    if (productId) {
      filteredOrders = orders.filter(order => order.productId === productId);
    }

    const data = filteredOrders.map(order => {
      const product = products.find(p => p.id === order.productId);
      return {
        'Tarih': new Date(order.timestamp).toLocaleString('tr-TR'),
        'Ürün': product?.name || 'Silinmiş ürün',
        'Bedeni': order.size,
        'Fiyat': product?.price.toFixed(2) || '0',
        'Instagram Kullanıcısı': order.instagramUsername,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siparişler');
    
    const fileName = generateFileName(productId ? `urun-${productId}-siparisler` : 'tum-siparisler');
    XLSX.writeFile(wb, fileName);
  };

  const exportCustomerOrders = () => {
    // Group orders by customer
    const customerOrders = orders.reduce((acc, order) => {
      if (!acc[order.instagramUsername]) {
        acc[order.instagramUsername] = [];
      }
      acc[order.instagramUsername].push(order);
      return acc;
    }, {} as Record<string, typeof orders>);

    const data = Object.entries(customerOrders).map(([customer, orders]) => {
      const totalSpent = orders.reduce((sum, order) => {
        const product = products.find(p => p.id === order.productId);
        return sum + (product?.price || 0);
      }, 0);

      return {
        'Instagram Kullanıcısı': customer,
        'Toplam Sipariş': orders.length,
        'Toplam Harcama': totalSpent.toFixed(2),
        'Son Sipariş': new Date(Math.max(...orders.map(o => o.timestamp))).toLocaleString('tr-TR'),
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Müşteri Raporu');
    
    XLSX.writeFile(wb, generateFileName('musteri-raporu'));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Kamera erişimi sağlanamadı. Lütfen kamera izinlerini kontrol edin.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64Image = canvas.toDataURL('image/jpeg');
        setLogoUrl(base64Image);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleSiteNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSiteName(newSiteName);
    setIsEditingSiteName(false);
  };

  const handleDelete = (productId: string) => {
    setDeletingProductId(productId);
  };

  const confirmDelete = () => {
    if (deletingProductId) {
      deleteProduct(deletingProductId);
      setDeletingProductId(null);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => {
    const product = products.find(p => p.id === order.productId);
    return sum + (product?.price || 0);
  }, 0);

  const uniqueCustomers = new Set(orders.map(order => order.instagramUsername)).size;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
        <button
          onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-xl font-semibold text-gray-900">Site Ayarları</h3>
          {isSettingsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        {isSettingsExpanded && (
          <div className="p-6 pt-2 border-t">
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <div className="text-sm font-medium text-gray-700 mb-2">Site Logosu</div>
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-300 flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <div className="mt-2 flex gap-2 justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-sm bg-white border rounded-md hover:bg-gray-50"
                      title="Resim Yükle"
                    >
                      <Upload size={16} />
                    </button>
                    <button
                      onClick={startCamera}
                      className="p-2 text-sm bg-white border rounded-md hover:bg-gray-50"
                      title="Fotoğraf Çek"
                    >
                      <Camera size={16} />
                    </button>
                    {logoUrl && (
                      <button
                        onClick={() => setLogoUrl('')}
                        className="p-2 text-sm bg-white border rounded-md hover:bg-gray-50 text-red-500"
                        title="Logoyu Kaldır"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-grow">
                <div className="text-sm font-medium text-gray-700 mb-2">Site Adı</div>
                {isEditingSiteName ? (
                  <form onSubmit={handleSiteNameSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={newSiteName}
                      onChange={(e) => setNewSiteName(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="Site adını girin"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSiteName(false);
                        setNewSiteName(siteName);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      İptal
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-xl text-black">
                      {siteName}
                    </span>
                    <button
                      onClick={() => setIsEditingSiteName(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Adı Düzenle
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Ürünler</h2>
        <div className="flex gap-3">
          <button
            onClick={() => exportOrders()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={20} />
            Tüm Siparişleri İndir
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus size={20} />
            Ürün Ekle
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {products.map(product => {
          const productOrders = orders.filter(order => order.productId === product.id);
          
          return (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-gray-600">{product.price.toFixed(2)} TL</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => exportOrders(product.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    disabled={productOrders.length === 0}
                  >
                    <Download size={16} />
                    Siparişleri İndir ({productOrders.length})
                  </button>
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Ürünü Düzenle"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Ürünü Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="mt-2 text-gray-600">
                Toplam Sipariş: {productOrders.length}
              </p>
            </div>
          );
        })}

        <div className="mt-8 bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">Özet Bilgiler</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600">Toplam Sipariş</p>
              <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600">Tekil Müşteri</p>
              <p className="text-2xl font-bold text-purple-600">{uniqueCustomers}</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={exportCustomerOrders}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Users size={20} />
              Müşteri Bazlı Rapor İndir
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdd={addProduct}
        />
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onEdit={editProduct}
        />
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="rounded-lg"
            />
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Fotoğraf Çek
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingProductId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Silmek istediğinizden emin misiniz?</h3>
            <p className="text-gray-600 mb-6">Bu işlem geri alınamaz.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}