import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { fetchWithFailover } from '../services/api';

interface Project {
  id: string;
  title: string;
  description?: string;
  category: string;
  target_amount: number;
  raised_amount: number;
  image_url?: string;
  location_city?: string;
  location_area?: string;
  status: string;
  progress: number;
  created_at: string;
}

const categoryIcons: Record<string, string> = {
  'education': '📚',
  'health': '🏥',
  'infrastructure': '🏗️',
  'environment': '🌱',
  'social': '👥',
  'technology': '💻',
  'other': '🌟',
};

function getCategoryIcon(category: string): string {
  return categoryIcons[category.toLowerCase()] || categoryIcons['other'];
}

export default function Projects() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true');
  const [filter, setFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'social',
    target_amount: '',
    image_url: '',
    location_city: '',
    location_area: '',
  });
  const [createError, setCreateError] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetchWithFailover(`/api/projects?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      const res = await fetchWithFailover('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setFormData({ title: '', description: '', category: 'social', target_amount: '', image_url: '', location_city: '', location_area: '' });
        fetchProjects();
      } else {
        const errorData = await res.json();
        setCreateError(errorData.error || errorData.messageKey || `Failed to create project (${res.status})`);
      }
    } catch (err) {
      console.error('Create project error:', err);
      setCreateError('Failed to create project');
    }
  };

  const handleDonate = async (projectId: string, amount: number) => {
    try {
      const res = await fetchWithFailover(`/api/projects/${projectId}/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to donate:', err);
    }
  };

  if (loading) {
    return <div className="donations-loading">{t('general.loading')}</div>;
  }

  return (
    <div className="donations-page">
      <div className="donations-header">
        <div className="donations-title-section">
          <h1>{t('projects.title')}</h1>
          <p className="donations-count">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} found
          </p>
        </div>
        <div className="donations-actions">
          {isAuthenticated && user?.can_donate && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary-modern"
            >
              {showCreateForm ? '✕' : '+'} {showCreateForm ? t('projects.cancel') : t('projects.create_title')}
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="donation-form-container">
          <h2>{t('projects.create_title')}</h2>
          <form onSubmit={handleCreate} className="donation-form">
            <div className="form-group">
              <label>{t('projects.title')} *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('projects.description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>{t('projects.category')} *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="education">{t('projects.categories.education')}</option>
                <option value="health">{t('projects.categories.health')}</option>
                <option value="infrastructure">{t('projects.categories.infrastructure')}</option>
                <option value="environment">{t('projects.categories.environment')}</option>
                <option value="social">{t('projects.categories.social')}</option>
                <option value="technology">{t('projects.categories.technology')}</option>
                <option value="other">{t('projects.categories.other')}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('projects.target_amount')} *</label>
              <input
                type="number"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>{t('projects.image_url')}</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('projects.location_city')}</label>
              <input
                type="text"
                value={formData.location_city}
                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('projects.location_area')}</label>
              <input
                type="text"
                value={formData.location_area}
                onChange={(e) => setFormData({ ...formData, location_area: e.target.value })}
              />
            </div>
            {createError && <div className="form-error">{createError}</div>}
            <div className="form-actions">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-outline">
                {t('projects.cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('projects.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="donations-filters">
        {['all', 'active', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
          >
            {status === 'all' ? t('projects.filter_all') : t(`projects.${status}`)}
            <span className="filter-count">{projects.filter((p) => status === 'all' || p.status === status).length}</span>
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="donations-empty">
          <h3>{t('projects.no_projects')}</h3>
          {isAuthenticated && user?.can_donate && (
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary-modern">
              {t('projects.create_title')}
            </button>
          )}
        </div>
      ) : (
        <div className="donations-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`donation-card-new ${project.status}`}
              id={project.id}
              onClick={() => setSelectedProject(project)}
            >
              <div className="donation-card-header">
                <span className="donation-food-icon">{getCategoryIcon(project.category)}</span>
                <span
                  className="donation-status-badge"
                  style={{ backgroundColor: project.status === 'active' ? '#22c55e' : project.status === 'completed' ? '#3b82f6' : '#6b7280' }}
                >
                  {t(`projects.${project.status}`)}
                </span>
              </div>
              <h3 className="donation-title">{project.title}</h3>
              {project.description && (
                <p className="donation-desc">{project.description.slice(0, 80)}{project.description.length > 80 ? '...' : ''}</p>
              )}
              <div className="donation-meta">
                <div className="donation-meta-item">
                  <span className="meta-label">{t('projects.target_amount')}</span>
                  <span className="meta-value">{project.target_amount} {t('projects.currency')}</span>
                </div>
                <div className="donation-meta-item">
                  <span className="meta-label">{t('projects.raised')}</span>
                  <span className="meta-value">{project.raised_amount} {t('projects.currency')}</span>
                </div>
              </div>
              <div className="donation-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
                <span className="progress-text">{project.progress}%</span>
              </div>
              {project.location_city && (
                <div className="donation-address">
                  📍 {project.location_city}{project.location_area ? `, ${project.location_area}` : ''}
                </div>
              )}
              <div className="donation-card-footer">
                {project.status === 'active' && isAuthenticated && user?.can_donate && (
                  <button
                    className="btn btn-primary-modern btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDonate(project.id, 50);
                    }}
                  >
                    {t('projects.donate')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProject(null)}>✕</button>
            <div className="modal-header">
              <span className="donation-food-icon" style={{ fontSize: '2rem' }}>{getCategoryIcon(selectedProject.category)}</span>
              <span
                className="donation-status-badge"
                style={{ backgroundColor: selectedProject.status === 'active' ? '#22c55e' : '#3b82f6' }}
              >
                {t(`projects.${selectedProject.status}`)}
              </span>
            </div>
            <h2>{selectedProject.title}</h2>
            <p className="modal-description">{selectedProject.description}</p>
            <div className="modal-details">
              <div className="detail-row">
                <span className="info-label">{t('projects.category')}</span>
                <span className="info-value">{t(`projects.categories.${selectedProject.category}`)}</span>
              </div>
              <div className="detail-row">
                <span className="info-label">{t('projects.target_amount')}</span>
                <span className="info-value">{selectedProject.target_amount} {t('projects.currency')}</span>
              </div>
              <div className="detail-row">
                <span className="info-label">{t('projects.raised')}</span>
                <span className="info-value">{selectedProject.raised_amount} {t('projects.currency')}</span>
              </div>
              <div className="detail-row">
                <span className="info-label">{t('projects.progress')}</span>
                <span className="info-value">{selectedProject.progress}%</span>
              </div>
              {selectedProject.location_city && (
                <div className="detail-row">
                  <span className="info-label">{t('projects.location')}</span>
                  <span className="info-value">{selectedProject.location_city}{selectedProject.location_area ? `, ${selectedProject.location_area}` : ''}</span>
                </div>
              )}
            </div>
            <div className="modal-progress">
              <div className="progress-bar" style={{ height: '12px' }}>
                <div className="progress-fill" style={{ width: `${selectedProject.progress}%` }} />
              </div>
            </div>
            {selectedProject.status === 'active' && isAuthenticated && user?.can_donate && (
              <div className="modal-actions">
                <button
                  className="btn btn-primary-modern"
                  onClick={() => handleDonate(selectedProject.id, 100)}
                >
                  {t('projects.donate')} 100 {t('projects.currency')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
