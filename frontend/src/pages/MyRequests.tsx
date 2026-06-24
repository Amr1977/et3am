import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchWithFailover } from '../services/api';
import RequestCard from '../components/RequestCard';

interface Request {
  id: string;
  title: string;
  description?: string;
  member_count: number;
  meals_fulfilled: number;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  requester_id: string;
  created_at: string;
}

export default function MyRequests() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', member_count: 1, address: '' });

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetchWithFailover('/api/requests/my-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch my requests error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleEdit = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    setEditForm({
      title: req.title,
      description: req.description || '',
      member_count: req.member_count,
      address: req.address || '',
    });
    setEditingId(id);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetchWithFailover(`/api/requests/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Edit request error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('requests.confirm_delete'))) return;
    try {
      const res = await fetchWithFailover(`/api/requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error('Delete request error:', err);
    }
  };

  return (
    <div className="donations-page">
      <div className="donations-header">
        <div>
          <h1>{t('requests.my_requests')}</h1>
        </div>
        <button onClick={() => navigate('/requests?create=true')} className="btn btn-primary">
          + {t('requests.create')}
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🙏</span>
          <p>{t('requests.empty')}</p>
          <button onClick={() => navigate('/requests?create=true')} className="btn btn-primary">
            {t('requests.create')}
          </button>
        </div>
      ) : (
        <div className="donations-grid">
          {requests.map(r => (
            <div key={r.id}>
              {editingId === r.id ? (
                <div className="edit-modal-content" style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div className="form-group">
                    <label>{t('requests.fields.title')}</label>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>{t('requests.fields.description')}</label>
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>{t('requests.fields.member_count')}</label>
                    <input type="number" min="1" value={editForm.member_count} onChange={e => setEditForm({ ...editForm, member_count: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="form-group">
                    <label>{t('requests.fields.address')}</label>
                    <input type="text" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
                  </div>
                  <div className="form-actions">
                    <button onClick={handleSaveEdit} className="btn btn-primary">{t('common.save')}</button>
                    <button onClick={() => setEditingId(null)} className="btn btn-ghost">{t('common.cancel')}</button>
                  </div>
                </div>
              ) : (
                <RequestCard
                  request={r}
                  t={t}
                  onClick={() => navigate(`/requests/${r.id}`)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isOwner={true}
                  isFulfiller={false}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
