import { useEffect, useState } from 'react';

const initialContactForm = {
  name: '',
  email: '',
  message: ''
};

const initialProjectForm = {
  title: '',
  slug: '',
  description: '',
  longDescription: '',
  problem: '',
  solution: '',
  architecture: '',
  impact: '',
  stack: '',
  repoUrl: '',
  liveUrl: '',
  coverImageUrl: '',
  videoUrl: '',
  highlight: false
};

const initialProjectMediaForm = {
  projectId: '',
  type: 'image',
  url: '',
  caption: '',
  sortOrder: 0
};

const initialExperienceForm = {
  company: '',
  role: '',
  startDate: '',
  endDate: '',
  summary: ''
};

const initialProfileForm = {
  fullName: '',
  role: '',
  bio: '',
  location: '',
  email: '',
  website: '',
  linkedin: '',
  github: ''
};

const initialContentItemForm = {
  title: '',
  description: '',
  sortOrder: 0
};

const initialProcessStepContentForm = {
  stepNo: '',
  title: '',
  description: '',
  sortOrder: 0
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
}

function formatBytes(bytes) {
  if (!bytes || Number(bytes) <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = Number(bytes);
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function resizeImageFile(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    targetRatio = null
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const srcW = img.width;
      const srcH = img.height;

      let cropW = srcW;
      let cropH = srcH;
      let cropX = 0;
      let cropY = 0;

      if (targetRatio && Number.isFinite(targetRatio) && targetRatio > 0) {
        const srcRatio = srcW / srcH;
        if (srcRatio > targetRatio) {
          cropW = Math.round(srcH * targetRatio);
          cropX = Math.round((srcW - cropW) / 2);
        } else if (srcRatio < targetRatio) {
          cropH = Math.round(srcW / targetRatio);
          cropY = Math.round((srcH - cropH) / 2);
        }
      }

      const scale = Math.min(maxWidth / cropW, maxHeight / cropH, 1);
      const outW = Math.max(1, Math.round(cropW * scale));
      const outH = Math.max(1, Math.round(cropH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas tidak tersedia untuk resize image'));
        return;
      }

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error('Gagal memproses image sebelum upload'));
            return;
          }
          const optimized = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(optimized);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca image untuk resize'));
    };

    img.src = objectUrl;
  });
}

async function trackEvent(event, path = window.location.pathname, metadata = null) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, path, metadata: metadata ? JSON.stringify(metadata) : null })
    });
  } catch (_error) {
    // noop
  }
}

function AdminPage() {
  const [jwtToken, setJwtToken] = useState(localStorage.getItem('adminJwtToken') || '');
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('messages');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const [messages, setMessages] = useState([]);
  const [profileForm, setProfileForm] = useState(initialProfileForm);

  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectMediaForm, setProjectMediaForm] = useState(initialProjectMediaForm);
  const [projectMediaItems, setProjectMediaItems] = useState([]);

  const [experiences, setExperiences] = useState([]);
  const [experienceForm, setExperienceForm] = useState(initialExperienceForm);
  const [editingExperienceId, setEditingExperienceId] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [highlightForm, setHighlightForm] = useState(initialContentItemForm);
  const [editingHighlightId, setEditingHighlightId] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(initialContentItemForm);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [processSteps, setProcessSteps] = useState([]);
  const [processStepForm, setProcessStepForm] = useState(initialProcessStepContentForm);
  const [editingProcessStepId, setEditingProcessStepId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analyticsSummary, setAnalyticsSummary] = useState({
    pageviews: 0,
    contactSends: 0,
    detailClicks: 0,
    liveClicks: 0,
    sourceClicks: 0
  });
  const [analyticsSeries, setAnalyticsSeries] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyticsRange, setAnalyticsRange] = useState(14);
  const [analyticsMetric, setAnalyticsMetric] = useState('pageviews');
  const [draggedMediaId, setDraggedMediaId] = useState(null);

  const adminFetch = async (path, options = {}, token = jwtToken) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(path, {
      ...options,
      headers
    });

    const result = await parseJson(response);
    if (!response.ok) {
      throw new Error(result?.message || 'Permintaan admin gagal');
    }
    return result;
  };

  const loadProjectMedia = async (projectId, token = jwtToken) => {
    if (!projectId) {
      setProjectMediaItems([]);
      return;
    }

    try {
      const project = projects.find((item) => item.id === Number(projectId));
      if (!project?.slug) {
        setProjectMediaItems([]);
        return;
      }

      const mediaData = await adminFetch(`/api/projects/${project.slug}`, {}, token);
      setProjectMediaItems(mediaData?.media || []);
    } catch (error) {
      setStatus(error.message || 'Gagal memuat media project.');
    }
  };

  const uploadAdminFile = async (file) => new Promise((resolve, reject) => {
    if (!jwtToken) {
      reject(new Error('Session admin tidak valid'));
      return;
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', '/api/admin/uploads');
    xhr.setRequestHeader('Authorization', `Bearer ${jwtToken}`);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      setUploadProgress(progress);
    };
    xhr.onload = () => {
      setUploadProgress(0);
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data.url);
        } else {
          reject(new Error(data?.message || 'Upload gagal'));
        }
      } catch (_error) {
        reject(new Error('Respons upload tidak valid'));
      }
    };
    xhr.onerror = () => {
      setUploadProgress(0);
      reject(new Error('Gagal mengupload file'));
    };
    xhr.send(formData);
  });

  const prepareUploadFile = async (file, mode = 'media') => {
    if (!file?.type?.startsWith('image/')) {
      return { file, optimized: false };
    }

    const optimized = await resizeImageFile(
      file,
      mode === 'cover'
        ? { maxWidth: 1920, maxHeight: 1080, quality: 0.86, targetRatio: 16 / 9 }
        : { maxWidth: 1920, maxHeight: 1920, quality: 0.84 }
    );

    if (optimized.size >= file.size) {
      return { file, optimized: false };
    }

    return { file: optimized, optimized: true };
  };

  const loadAnalyticsTimeseries = async (days = analyticsRange, token = jwtToken) => {
    const analyticsSeriesData = await adminFetch(`/api/admin/analytics/timeseries?days=${days}`, {}, token);
    setAnalyticsSeries(analyticsSeriesData?.rows || []);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminJwtToken');
    setJwtToken('');
    setIsSessionValid(false);
    setPassword('');
    setMessages([]);
    setProjects([]);
    setProjectMediaItems([]);
    setProjectMediaForm(initialProjectMediaForm);
    setExperiences([]);
    setHighlights([]);
    setServices([]);
    setProcessSteps([]);
    setProfileForm(initialProfileForm);
    setStatus('Session admin berakhir.');
  };

  const loadAllData = async (token = jwtToken) => {
    if (!token) {
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      await adminFetch('/api/admin/session', {}, token);
      setIsSessionValid(true);

      const [profileRes, projectsRes, experiencesRes, highlightsRes, servicesRes, processRes, messagesData, analyticsData, analyticsSeriesData] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/projects'),
        fetch('/api/experiences'),
        fetch('/api/about-highlights'),
        fetch('/api/services'),
        fetch('/api/process-steps'),
        adminFetch('/api/admin/messages', {}, token),
        adminFetch('/api/admin/analytics/summary', {}, token),
        adminFetch(`/api/admin/analytics/timeseries?days=${analyticsRange}`, {}, token)
      ]);

      const [profileData, projectData, experienceData, highlightsData, servicesData, processData] = await Promise.all([
        profileRes.json(),
        projectsRes.json(),
        experiencesRes.json(),
        highlightsRes.json(),
        servicesRes.json(),
        processRes.json()
      ]);

      setProfileForm({
        fullName: profileData?.fullName || '',
        role: profileData?.role || '',
        bio: profileData?.bio || '',
        location: profileData?.location || '',
        email: profileData?.email || '',
        website: profileData?.website || '',
        linkedin: profileData?.linkedin || '',
        github: profileData?.github || ''
      });

      setProjects(projectData || []);
      setExperiences(experienceData || []);
      setHighlights(highlightsData || []);
      setServices(servicesData || []);
      setProcessSteps(processData || []);
      setMessages(messagesData || []);
      setAnalyticsSummary(analyticsData || analyticsSummary);
      setAnalyticsSeries(analyticsSeriesData?.rows || []);
      const firstProjectId = projectData?.[0]?.id ? String(projectData[0].id) : '';
      setProjectMediaForm((prev) => ({
        ...prev,
        projectId: firstProjectId
      }));
      if (firstProjectId) {
        const firstProject = projectData[0];
        const detail = await adminFetch(`/api/projects/${firstProject.slug}`, {}, token);
        setProjectMediaItems(detail?.media || []);
      } else {
        setProjectMediaItems([]);
      }
      setStatus('Data admin berhasil dimuat.');
    } catch (error) {
      setIsSessionValid(false);
      if (String(error.message).toLowerCase().includes('token')) {
        handleLogout();
      }
      setStatus(error.message || 'Gagal memuat data admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jwtToken) {
      loadAllData(jwtToken);
    }
  }, []);

  useEffect(() => {
    if (!isSessionValid || activeTab !== 'analytics') return;
    loadAnalyticsTimeseries(analyticsRange).catch((error) => {
      setStatus(error.message || 'Gagal memuat analytics timeseries.');
    });
  }, [analyticsRange, isSessionValid, activeTab]);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setStatus('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await parseJson(response);
      if (!response.ok) {
        throw new Error(result?.message || 'Login admin gagal');
      }

      localStorage.setItem('adminJwtToken', result.token);
      setJwtToken(result.token);
      setPassword('');
      await loadAllData(result.token);
    } catch (error) {
      setStatus(error.message || 'Login admin gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    try {
      const updated = await adminFetch('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm)
      });

      setProfileForm({
        fullName: updated.fullName || '',
        role: updated.role || '',
        bio: updated.bio || '',
        location: updated.location || '',
        email: updated.email || '',
        website: updated.website || '',
        linkedin: updated.linkedin || '',
        github: updated.github || ''
      });
      setStatus('Profil berhasil diperbarui.');
    } catch (error) {
      setStatus(error.message || 'Gagal menyimpan profil.');
    }
  };

  const resetProjectEditor = () => {
    setEditingProjectId(null);
    setProjectForm(initialProjectForm);
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingProjectId) {
        await adminFetch(`/api/admin/projects/${editingProjectId}`, {
          method: 'PUT',
          body: JSON.stringify(projectForm)
        });
        setStatus('Project berhasil diperbarui.');
      } else {
        await adminFetch('/api/admin/projects', {
          method: 'POST',
          body: JSON.stringify(projectForm)
        });
        setStatus('Project berhasil ditambahkan.');
      }

      await loadAllData();
      resetProjectEditor();
    } catch (error) {
      setStatus(error.message || 'Gagal menyimpan project.');
    }
  };

  const handleEditProject = (project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title || '',
      slug: project.slug || '',
      description: project.description || '',
      longDescription: project.longDescription || '',
      problem: project.problem || '',
      solution: project.solution || '',
      architecture: project.architecture || '',
      impact: project.impact || '',
      stack: project.stack || '',
      repoUrl: project.repoUrl || '',
      liveUrl: project.liveUrl || '',
      coverImageUrl: project.coverImageUrl || '',
      videoUrl: project.videoUrl || '',
      highlight: Boolean(project.highlight)
    });
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Hapus project ini?')) {
      return;
    }

    try {
      await adminFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
      setStatus('Project dihapus.');
      await loadAllData();
      if (editingProjectId === id) {
        resetProjectEditor();
      }
    } catch (error) {
      setStatus(error.message || 'Gagal menghapus project.');
    }
  };

  const handleProjectMediaSubmit = async (event) => {
    event.preventDefault();
    if (!projectMediaForm.projectId) {
      setStatus('Pilih project untuk media.');
      return;
    }

    try {
      await adminFetch('/api/admin/project-media', {
        method: 'POST',
        body: JSON.stringify({
          projectId: Number(projectMediaForm.projectId),
          type: projectMediaForm.type,
          url: projectMediaForm.url,
          caption: projectMediaForm.caption,
          sortOrder: Number(projectMediaForm.sortOrder || 0)
        })
      });
      setStatus('Media project berhasil ditambahkan.');
      setProjectMediaForm((prev) => ({
        ...prev,
        type: 'image',
        url: '',
        caption: '',
        sortOrder: 0
      }));
      await loadProjectMedia(projectMediaForm.projectId);
    } catch (error) {
      setStatus(error.message || 'Gagal menyimpan media project.');
    }
  };

  const handleDeleteProjectMedia = async (id) => {
    if (!window.confirm('Hapus media ini?')) {
      return;
    }
    try {
      await adminFetch(`/api/admin/project-media/${id}`, { method: 'DELETE' });
      setStatus('Media project dihapus.');
      await loadProjectMedia(projectMediaForm.projectId);
    } catch (error) {
      setStatus(error.message || 'Gagal menghapus media project.');
    }
  };

  const handleMoveProjectMedia = async (id, direction) => {
    const sorted = [...projectMediaItems].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((item) => item.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];

    try {
      await adminFetch(`/api/admin/project-media/${current.id}`, {
        method: 'PUT',
        body: JSON.stringify({ sortOrder: target.sortOrder })
      });
      await adminFetch(`/api/admin/project-media/${target.id}`, {
        method: 'PUT',
        body: JSON.stringify({ sortOrder: current.sortOrder })
      });
      await loadProjectMedia(projectMediaForm.projectId);
      setStatus('Urutan media diperbarui.');
    } catch (error) {
      setStatus(error.message || 'Gagal mengubah urutan media.');
    }
  };

  const handleReorderProjectMedia = async (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    const sorted = [...projectMediaItems].sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIndex = sorted.findIndex((item) => item.id === fromId);
    const toIndex = sorted.findIndex((item) => item.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);

    try {
      await Promise.all(
        sorted.map((item, idx) =>
          adminFetch(`/api/admin/project-media/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ sortOrder: idx * 10 })
          })
        )
      );
      await loadProjectMedia(projectMediaForm.projectId);
      setStatus('Urutan media berhasil diperbarui lewat drag & drop.');
    } catch (error) {
      setStatus(error.message || 'Gagal reorder media project.');
    }
  };

  const resetExperienceEditor = () => {
    setEditingExperienceId(null);
    setExperienceForm(initialExperienceForm);
  };

  const handleExperienceSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingExperienceId) {
        await adminFetch(`/api/admin/experiences/${editingExperienceId}`, {
          method: 'PUT',
          body: JSON.stringify(experienceForm)
        });
        setStatus('Pengalaman berhasil diperbarui.');
      } else {
        await adminFetch('/api/admin/experiences', {
          method: 'POST',
          body: JSON.stringify(experienceForm)
        });
        setStatus('Pengalaman berhasil ditambahkan.');
      }

      await loadAllData();
      resetExperienceEditor();
    } catch (error) {
      setStatus(error.message || 'Gagal menyimpan pengalaman.');
    }
  };

  const handleEditExperience = (item) => {
    setEditingExperienceId(item.id);
    setExperienceForm({
      company: item.company || '',
      role: item.role || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      summary: item.summary || ''
    });
  };

  const handleDeleteExperience = async (id) => {
    if (!window.confirm('Hapus pengalaman ini?')) {
      return;
    }

    try {
      await adminFetch(`/api/admin/experiences/${id}`, { method: 'DELETE' });
      setStatus('Pengalaman dihapus.');
      await loadAllData();
      if (editingExperienceId === id) {
        resetExperienceEditor();
      }
    } catch (error) {
      setStatus(error.message || 'Gagal menghapus pengalaman.');
    }
  };

  const handleHighlightSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingHighlightId) {
        await adminFetch(`/api/admin/about-highlights/${editingHighlightId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...highlightForm, sortOrder: Number(highlightForm.sortOrder || 0) })
        });
      } else {
        await adminFetch('/api/admin/about-highlights', {
          method: 'POST',
          body: JSON.stringify({ ...highlightForm, sortOrder: Number(highlightForm.sortOrder || 0) })
        });
      }
      setHighlightForm(initialContentItemForm);
      setEditingHighlightId(null);
      setStatus('Highlight tersimpan.');
      await loadAllData();
    } catch (error) {
      setStatus(error.message || 'Gagal menyimpan highlight.');
    }
  };

  const handleDeleteHighlight = async (id) => {
    if (!window.confirm('Hapus highlight ini?')) return;
    try {
      await adminFetch(`/api/admin/about-highlights/${id}`, { method: 'DELETE' });
      setStatus('Highlight dihapus.');
      await loadAllData();
    } catch (error) {
      setStatus(error.message || 'Gagal menghapus highlight.');
    }
  };

  const handleServiceSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingServiceId) {
        await adminFetch(`/api/admin/services/${editingServiceId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...serviceForm, sortOrder: Number(serviceForm.sortOrder || 0) })
        });
      } else {
        await adminFetch('/api/admin/services', {
          method: 'POST',
          body: JSON.stringify({ ...serviceForm, sortOrder: Number(serviceForm.sortOrder || 0) })
        });
      }
      setServiceForm(initialContentItemForm);
      setEditingServiceId(null);
      setStatus('Service tersimpan.');
      await loadAllData();
    } catch (error) {
      setStatus(error.message || 'Gagal menyimpan service.');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Hapus service ini?')) return;
    try {
      await adminFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      setStatus('Service dihapus.');
      await loadAllData();
    } catch (error) {
      setStatus(error.message || 'Gagal menghapus service.');
    }
  };

  const handleProcessStepSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingProcessStepId) {
        await adminFetch(`/api/admin/process-steps/${editingProcessStepId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...processStepForm, sortOrder: Number(processStepForm.sortOrder || 0) })
        });
      } else {
        await adminFetch('/api/admin/process-steps', {
          method: 'POST',
          body: JSON.stringify({ ...processStepForm, sortOrder: Number(processStepForm.sortOrder || 0) })
        });
      }
      setProcessStepForm(initialProcessStepContentForm);
      setEditingProcessStepId(null);
      setStatus('Process step tersimpan.');
      await loadAllData();
    } catch (error) {
      setStatus(error.message || 'Gagal menyimpan process step.');
    }
  };

  const handleDeleteProcessStep = async (id) => {
    if (!window.confirm('Hapus step ini?')) return;
    try {
      await adminFetch(`/api/admin/process-steps/${id}`, { method: 'DELETE' });
      setStatus('Process step dihapus.');
      await loadAllData();
    } catch (error) {
      setStatus(error.message || 'Gagal menghapus process step.');
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Hapus pesan ini?')) {
      return;
    }

    try {
      await adminFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((item) => item.id !== id));
      setStatus('Pesan dihapus.');
    } catch (error) {
      setStatus(error.message || 'Gagal menghapus pesan.');
    }
  };

  const tabs = [
    { id: 'messages', label: 'Inbox' },
    { id: 'profile', label: 'Profile' },
    { id: 'projects', label: 'Projects' },
    { id: 'experiences', label: 'Experience' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'services', label: 'Services' },
    { id: 'process', label: 'Process Steps' },
    { id: 'analytics', label: 'Analytics' }
  ];

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Admin Panel</p>
          <h1 className="font-display text-3xl font-bold text-ink">Kelola Konten Portofolio</h1>
        </div>
        <a href="/" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Kembali ke Portfolio
        </a>
      </div>

      <form onSubmit={handleLogin} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 block text-sm font-semibold text-slate-700">Login Admin (JWT)</p>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none ring-brand/30 focus:ring"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none ring-brand/30 focus:ring"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {loading ? 'Memuat...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
        {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
      </form>

      {isSessionValid ? (
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === tab.id ? 'bg-brand text-white' : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      ) : null}

      {isSessionValid && activeTab === 'messages' ? (
        <section className="space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Belum ada pesan.
            </div>
          ) : (
            messages.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-ink">{item.name}</h2>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatDate(item.createdAt)}</span>
                </div>
                <p className="mb-3 text-sm font-medium text-brand">{item.email}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.message}</p>
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(item.id)}
                  className="mt-4 rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700"
                >
                  Hapus Pesan
                </button>
              </article>
            ))
          )}
        </section>
      ) : null}

      {isSessionValid && activeTab === 'profile' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form onSubmit={handleSaveProfile} className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl border border-slate-200 px-4 py-3" value={profileForm.fullName} onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Nama lengkap" />
            <input className="rounded-xl border border-slate-200 px-4 py-3" value={profileForm.role} onChange={(e) => setProfileForm((p) => ({ ...p, role: e.target.value }))} placeholder="Role" />
            <input className="rounded-xl border border-slate-200 px-4 py-3" value={profileForm.location} onChange={(e) => setProfileForm((p) => ({ ...p, location: e.target.value }))} placeholder="Lokasi" />
            <input className="rounded-xl border border-slate-200 px-4 py-3" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
            <input className="rounded-xl border border-slate-200 px-4 py-3" value={profileForm.website} onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))} placeholder="Website URL" />
            <input className="rounded-xl border border-slate-200 px-4 py-3" value={profileForm.linkedin} onChange={(e) => setProfileForm((p) => ({ ...p, linkedin: e.target.value }))} placeholder="LinkedIn URL" />
            <input className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" value={profileForm.github} onChange={(e) => setProfileForm((p) => ({ ...p, github: e.target.value }))} placeholder="GitHub URL" />
            <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="4" value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Bio" />
            <button className="w-fit rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white" type="submit">Simpan Profile</button>
          </form>
        </section>
      ) : null}

      {isSessionValid && activeTab === 'projects' ? (
        <section className="space-y-4">
          <form onSubmit={handleProjectSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">{editingProjectId ? 'Edit Project' : 'Tambah Project'}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={projectForm.title} onChange={(e) => setProjectForm((p) => ({ ...p, title: e.target.value }))} placeholder="Judul" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={projectForm.slug} onChange={(e) => setProjectForm((p) => ({ ...p, slug: e.target.value }))} placeholder="Slug (opsional)" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={projectForm.stack} onChange={(e) => setProjectForm((p) => ({ ...p, stack: e.target.value }))} placeholder="Tech stack" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={projectForm.repoUrl} onChange={(e) => setProjectForm((p) => ({ ...p, repoUrl: e.target.value }))} placeholder="Repo URL" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={projectForm.liveUrl} onChange={(e) => setProjectForm((p) => ({ ...p, liveUrl: e.target.value }))} placeholder="Live URL" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={projectForm.coverImageUrl} onChange={(e) => setProjectForm((p) => ({ ...p, coverImageUrl: e.target.value }))} placeholder="Cover Image URL" />
              <input
                type="file"
                accept="image/*,video/*"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploadStatus('Uploading cover...');
                    const prepared = await prepareUploadFile(file, 'cover');
                    const url = await uploadAdminFile(prepared.file);
                    setProjectForm((p) => ({ ...p, coverImageUrl: url }));
                    setUploadStatus(
                      prepared.optimized
                        ? `Cover upload berhasil (${formatBytes(file.size)} -> ${formatBytes(prepared.file.size)}).`
                        : 'Cover upload berhasil.'
                    );
                  } catch (error) {
                    setUploadStatus(error.message || 'Upload cover gagal.');
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
              <input className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" value={projectForm.videoUrl} onChange={(e) => setProjectForm((p) => ({ ...p, videoUrl: e.target.value }))} placeholder="Video URL (opsional)" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="4" value={projectForm.description} onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="5" value={projectForm.longDescription} onChange={(e) => setProjectForm((p) => ({ ...p, longDescription: e.target.value }))} placeholder="Detail deskripsi project" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="3" value={projectForm.problem} onChange={(e) => setProjectForm((p) => ({ ...p, problem: e.target.value }))} placeholder="Problem / Tantangan" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="3" value={projectForm.solution} onChange={(e) => setProjectForm((p) => ({ ...p, solution: e.target.value }))} placeholder="Solusi" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="3" value={projectForm.architecture} onChange={(e) => setProjectForm((p) => ({ ...p, architecture: e.target.value }))} placeholder="Arsitektur" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="3" value={projectForm.impact} onChange={(e) => setProjectForm((p) => ({ ...p, impact: e.target.value }))} placeholder="Impact / Hasil" />
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={projectForm.highlight} onChange={(e) => setProjectForm((p) => ({ ...p, highlight: e.target.checked }))} />
                Jadikan highlight
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white" type="submit">{editingProjectId ? 'Update' : 'Tambah'}</button>
              {editingProjectId ? (
                <button type="button" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold" onClick={resetProjectEditor}>Batal</button>
              ) : null}
            </div>
            {uploadStatus ? <p className="mt-2 text-xs text-slate-500">{uploadStatus}</p> : null}
          </form>

          {projects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-xl font-bold text-ink">{project.title}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{project.stack}</p>
              <p className="mt-2 text-sm text-slate-700">{project.description}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold" onClick={() => handleEditProject(project)}>Edit</button>
                <button type="button" className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => handleDeleteProject(project.id)}>Hapus</button>
              </div>
            </article>
          ))}

          <form onSubmit={handleProjectMediaSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">Media Project (Slide Gambar/Video)</p>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-xl border border-slate-200 px-4 py-3"
                value={projectMediaForm.projectId}
                onChange={async (e) => {
                  const projectId = e.target.value;
                  setProjectMediaForm((prev) => ({ ...prev, projectId }));
                  await loadProjectMedia(projectId);
                }}
              >
                <option value="">Pilih project</option>
                {projects.map((project) => (
                  <option key={`media-project-${project.id}`} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-slate-200 px-4 py-3"
                value={projectMediaForm.type}
                onChange={(e) => setProjectMediaForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              <input className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" value={projectMediaForm.url} onChange={(e) => setProjectMediaForm((prev) => ({ ...prev, url: e.target.value }))} placeholder="URL media" />
              <input
                className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                type="file"
                accept="image/*,video/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploadStatus('Uploading media...');
                    const prepared = await prepareUploadFile(file, 'media');
                    const url = await uploadAdminFile(prepared.file);
                    setProjectMediaForm((prev) => ({
                      ...prev,
                      url,
                      type: file.type.startsWith('video/') ? 'video' : 'image'
                    }));
                    setUploadStatus(
                      prepared.optimized
                        ? `Media upload berhasil (${formatBytes(file.size)} -> ${formatBytes(prepared.file.size)}).`
                        : 'Media upload berhasil.'
                    );
                  } catch (error) {
                    setUploadStatus(error.message || 'Upload media gagal.');
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={projectMediaForm.caption} onChange={(e) => setProjectMediaForm((prev) => ({ ...prev, caption: e.target.value }))} placeholder="Caption (opsional)" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" type="number" value={projectMediaForm.sortOrder} onChange={(e) => setProjectMediaForm((prev) => ({ ...prev, sortOrder: e.target.value }))} placeholder="Urutan" />
            </div>
            <button className="mt-4 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white" type="submit">Tambah Media</button>
            <div
              className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                try {
                  setUploadStatus('Uploading media (drag-drop)...');
                  const prepared = await prepareUploadFile(file, 'media');
                  const url = await uploadAdminFile(prepared.file);
                  setProjectMediaForm((prev) => ({
                    ...prev,
                    url,
                    type: file.type.startsWith('video/') ? 'video' : 'image'
                  }));
                  setUploadStatus(
                    prepared.optimized
                      ? `Media drag-drop berhasil (${formatBytes(file.size)} -> ${formatBytes(prepared.file.size)}).`
                      : 'Media drag-drop berhasil.'
                  );
                } catch (error) {
                  setUploadStatus(error.message || 'Upload drag-drop gagal.');
                }
              }}
            >
              Drag & drop file di sini untuk upload cepat
            </div>
            {uploadProgress > 0 ? (
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">Upload {uploadProgress}%</p>
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              {projectMediaItems.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada media.</p>
              ) : (
                projectMediaItems.map((media) => (
                  <div
                    key={media.id}
                    draggable
                    onDragStart={() => setDraggedMediaId(media.id)}
                    onDragEnd={() => setDraggedMediaId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async () => {
                      await handleReorderProjectMedia(draggedMediaId, media.id);
                      setDraggedMediaId(null);
                    }}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                      draggedMediaId === media.id ? 'border-brand bg-brand/5' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{media.type} • order {media.sortOrder} • drag to reorder</p>
                      <p className="text-sm font-semibold text-slate-800">{media.caption || '(tanpa caption)'}</p>
                      <a href={media.url} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">{media.url}</a>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700" onClick={() => handleMoveProjectMedia(media.id, 'up')}>Up</button>
                      <button type="button" className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700" onClick={() => handleMoveProjectMedia(media.id, 'down')}>Down</button>
                      <button type="button" className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => handleDeleteProjectMedia(media.id)}>Hapus</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </form>
        </section>
      ) : null}

      {isSessionValid && activeTab === 'experiences' ? (
        <section className="space-y-4">
          <form onSubmit={handleExperienceSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">{editingExperienceId ? 'Edit Experience' : 'Tambah Experience'}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={experienceForm.company} onChange={(e) => setExperienceForm((p) => ({ ...p, company: e.target.value }))} placeholder="Perusahaan" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={experienceForm.role} onChange={(e) => setExperienceForm((p) => ({ ...p, role: e.target.value }))} placeholder="Role" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={experienceForm.startDate} onChange={(e) => setExperienceForm((p) => ({ ...p, startDate: e.target.value }))} placeholder="Mulai (contoh: 2023)" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={experienceForm.endDate} onChange={(e) => setExperienceForm((p) => ({ ...p, endDate: e.target.value }))} placeholder="Selesai (contoh: Sekarang)" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="4" value={experienceForm.summary} onChange={(e) => setExperienceForm((p) => ({ ...p, summary: e.target.value }))} placeholder="Ringkasan" />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white" type="submit">{editingExperienceId ? 'Update' : 'Tambah'}</button>
              {editingExperienceId ? (
                <button type="button" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold" onClick={resetExperienceEditor}>Batal</button>
              ) : null}
            </div>
          </form>

          {experiences.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-xl font-bold text-ink">{item.role}</h3>
              <p className="mt-1 text-sm font-semibold text-brand">{item.company}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.startDate} - {item.endDate}</p>
              <p className="mt-2 text-sm text-slate-700">{item.summary}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold" onClick={() => handleEditExperience(item)}>Edit</button>
                <button type="button" className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => handleDeleteExperience(item.id)}>Hapus</button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {isSessionValid && activeTab === 'highlights' ? (
        <section className="space-y-4">
          <form onSubmit={handleHighlightSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">{editingHighlightId ? 'Edit Highlight' : 'Tambah Highlight'}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={highlightForm.title} onChange={(e) => setHighlightForm((p) => ({ ...p, title: e.target.value }))} placeholder="Judul" />
              <input type="number" className="rounded-xl border border-slate-200 px-4 py-3" value={highlightForm.sortOrder} onChange={(e) => setHighlightForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Urutan" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="3" value={highlightForm.description} onChange={(e) => setHighlightForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi" />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white" type="submit">{editingHighlightId ? 'Update' : 'Tambah'}</button>
              {editingHighlightId ? <button type="button" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold" onClick={() => { setEditingHighlightId(null); setHighlightForm(initialContentItemForm); }}>Batal</button> : null}
            </div>
          </form>
          {highlights.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-xl font-bold text-ink">{item.title}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Order {item.sortOrder}</p>
              <p className="mt-2 text-sm text-slate-700">{item.description}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold" onClick={() => { setEditingHighlightId(item.id); setHighlightForm({ title: item.title, description: item.description, sortOrder: item.sortOrder }); }}>Edit</button>
                <button type="button" className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => handleDeleteHighlight(item.id)}>Hapus</button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {isSessionValid && activeTab === 'services' ? (
        <section className="space-y-4">
          <form onSubmit={handleServiceSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">{editingServiceId ? 'Edit Service' : 'Tambah Service'}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={serviceForm.title} onChange={(e) => setServiceForm((p) => ({ ...p, title: e.target.value }))} placeholder="Judul" />
              <input type="number" className="rounded-xl border border-slate-200 px-4 py-3" value={serviceForm.sortOrder} onChange={(e) => setServiceForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Urutan" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="3" value={serviceForm.description} onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi" />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white" type="submit">{editingServiceId ? 'Update' : 'Tambah'}</button>
              {editingServiceId ? <button type="button" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold" onClick={() => { setEditingServiceId(null); setServiceForm(initialContentItemForm); }}>Batal</button> : null}
            </div>
          </form>
          {services.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-xl font-bold text-ink">{item.title}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Order {item.sortOrder}</p>
              <p className="mt-2 text-sm text-slate-700">{item.description}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold" onClick={() => { setEditingServiceId(item.id); setServiceForm({ title: item.title, description: item.description, sortOrder: item.sortOrder }); }}>Edit</button>
                <button type="button" className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => handleDeleteService(item.id)}>Hapus</button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {isSessionValid && activeTab === 'process' ? (
        <section className="space-y-4">
          <form onSubmit={handleProcessStepSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700">{editingProcessStepId ? 'Edit Process Step' : 'Tambah Process Step'}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={processStepForm.stepNo} onChange={(e) => setProcessStepForm((p) => ({ ...p, stepNo: e.target.value }))} placeholder="No Step (01)" />
              <input className="rounded-xl border border-slate-200 px-4 py-3" value={processStepForm.title} onChange={(e) => setProcessStepForm((p) => ({ ...p, title: e.target.value }))} placeholder="Judul step" />
              <input type="number" className="rounded-xl border border-slate-200 px-4 py-3" value={processStepForm.sortOrder} onChange={(e) => setProcessStepForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Urutan" />
              <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" rows="3" value={processStepForm.description} onChange={(e) => setProcessStepForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi" />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white" type="submit">{editingProcessStepId ? 'Update' : 'Tambah'}</button>
              {editingProcessStepId ? <button type="button" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold" onClick={() => { setEditingProcessStepId(null); setProcessStepForm(initialProcessStepContentForm); }}>Batal</button> : null}
            </div>
          </form>
          {processSteps.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-xl font-bold text-ink">{item.stepNo} - {item.title}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Order {item.sortOrder}</p>
              <p className="mt-2 text-sm text-slate-700">{item.description}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold" onClick={() => { setEditingProcessStepId(item.id); setProcessStepForm({ stepNo: item.stepNo, title: item.title, description: item.description, sortOrder: item.sortOrder }); }}>Edit</button>
                <button type="button" className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => handleDeleteProcessStep(item.id)}>Hapus</button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {isSessionValid && activeTab === 'analytics' ? (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Pageviews', analyticsSummary.pageviews],
            ['Contact Submit', analyticsSummary.contactSends],
            ['Detail Clicks', analyticsSummary.detailClicks],
            ['Live Clicks', analyticsSummary.liveClicks],
            ['Source Clicks', analyticsSummary.sourceClicks]
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 font-display text-3xl text-ink">{value}</p>
            </article>
          ))}
          </div>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Traffic Timeseries</p>
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
                  value={analyticsMetric}
                  onChange={(e) => setAnalyticsMetric(e.target.value)}
                >
                  <option value="pageviews">Pageviews</option>
                  <option value="contacts">Contact</option>
                  <option value="detailClicks">Detail</option>
                  <option value="liveClicks">Live</option>
                  <option value="sourceClicks">Source</option>
                </select>
                <select
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
                  value={analyticsRange}
                  onChange={(e) => setAnalyticsRange(Number(e.target.value))}
                >
                  <option value={7}>7 hari</option>
                  <option value={14}>14 hari</option>
                  <option value={30}>30 hari</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              {analyticsSeries.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data timeseries.</p>
              ) : (
                analyticsSeries.map((row) => {
                  const metricLabelMap = {
                    pageviews: 'pv',
                    contacts: 'contact',
                    detailClicks: 'detail',
                    liveClicks: 'live',
                    sourceClicks: 'source'
                  };
                  const max = Math.max(...analyticsSeries.map((item) => Number(item[analyticsMetric] || 0)), 1);
                  const value = Number(row[analyticsMetric] || 0);
                  const width = Math.max(6, Math.round((value / max) * 100));
                  return (
                    <div key={row.day} className="grid grid-cols-[120px_1fr_auto] items-center gap-3">
                      <p className="text-xs text-slate-600">{row.day}</p>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-brand" style={{ width: `${width}%` }} />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{value} {metricLabelMap[analyticsMetric]}</p>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}

function PortfolioPage() {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [services, setServices] = useState([]);
  const [processSteps, setProcessSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialContactForm);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const [statsVisible, setStatsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    projects: 0,
    experiences: 0,
    stacks: 0
  });
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [ctaMagnet, setCtaMagnet] = useState({ x: 0, y: 0 });
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('portfolioLang') || 'id');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('portfolioTheme') === 'dark');
  const stacks = [...new Set(projects.flatMap((p) => (p.stack || '').split(',').map((s) => s.trim())).filter(Boolean))];
  const content = {
    id: {
      nav: { home: 'Beranda', about: 'Tentang', projects: 'Project', journey: 'Pengalaman', services: 'Layanan', contact: 'Kontak' },
      brandTag: 'Developer Studio',
      heroTag: 'Programmer Portfolio',
      heroTitleA: 'Code.',
      heroTitleB: 'Build.',
      heroTitleC: 'Ship Product.',
      heroBio: 'Saya membangun website dan sistem digital dari UI, backend, sampai deployment Docker yang stabil.',
      viewProjects: 'Lihat Project',
      discussProject: 'Diskusi Project',
      admin: 'Admin',
      onlineNow: 'Online',
      currentFocus: 'Fokus Saat Ini',
      heroPanelA: 'Fullstack',
      heroPanelB: 'Engineering Workflow',
      stats: ['Project Selesai', 'Catatan Pengalaman', 'Stack Dikuasai', 'Status'],
      statusOpen: 'Tersedia',
      aboutTitle: 'Merancang Produk Digital yang Bersih, Cepat, dan Stabil.',
      aboutBody: 'berfokus pada pengembangan website modern dengan fondasi backend yang aman, scalable, dan mudah dideploy.',
      location: 'Lokasi',
      role: 'Role',
      selectedProjects: 'Project Pilihan',
      showcase: 'Work Showcase',
      loadingProjects: 'Memuat project...',
      featuredProject: 'Project Unggulan',
      liveSite: 'Live Site',
      sourceCode: 'Source Code',
      experienceTimeline: 'Timeline Pengalaman',
      services: 'Layanan',
      process: 'Proses Kerja',
      processSteps: ['Riset kebutuhan dan target bisnis.', 'Menyusun UI flow dan arsitektur teknis.', 'Implementasi frontend, backend, dan database.', 'Deploy, monitor, dan optimasi berkelanjutan.'],
      contactTitle: 'Bangun Project Bersama',
      contactBody: 'Kirim kebutuhan project kamu, saya balas dengan rencana eksekusi yang jelas.',
      name: 'Nama',
      email: 'Email',
      message: 'Ceritakan project kamu...',
      send: 'Kirim Pesan',
      sending: 'Mengirim...',
      footerBody: 'Tersedia untuk freelance project, web app internal, dan website company profile modern.',
      available: 'Available for Work',
      dark: 'Dark',
      light: 'Light',
      lang: 'EN',
      loadingScreen: 'Menyiapkan portfolio...'
    },
    en: {
      nav: { home: 'Home', about: 'About', projects: 'Projects', journey: 'Journey', services: 'Services', contact: 'Contact' },
      brandTag: 'Developer Studio',
      heroTag: 'Programmer Portfolio',
      heroTitleA: 'Code.',
      heroTitleB: 'Build.',
      heroTitleC: 'Ship Product.',
      heroBio: 'I build digital products from UI, backend architecture, to stable Docker deployments.',
      viewProjects: 'View Projects',
      discussProject: 'Discuss Project',
      admin: 'Admin',
      onlineNow: 'Online',
      currentFocus: 'Current Focus',
      heroPanelA: 'Fullstack',
      heroPanelB: 'Engineering Workflow',
      stats: ['Projects Completed', 'Experience Entries', 'Stack Mastered', 'Status'],
      statusOpen: 'Available',
      aboutTitle: 'Designing Digital Products that are Clean, Fast, and Reliable.',
      aboutBody: 'focuses on modern web development with secure, scalable, and deployment-friendly architecture.',
      location: 'Location',
      role: 'Role',
      selectedProjects: 'Selected Projects',
      showcase: 'Work Showcase',
      loadingProjects: 'Loading projects...',
      featuredProject: 'Featured Project',
      liveSite: 'Live Site',
      sourceCode: 'Source Code',
      experienceTimeline: 'Experience Timeline',
      services: 'Services',
      process: 'Work Process',
      processSteps: ['Understand requirements and business goals.', 'Design UI flow and technical architecture.', 'Implement frontend, backend, and database.', 'Deploy, monitor, and iterate continuously.'],
      contactTitle: "Let's Build Together",
      contactBody: 'Send your project brief and I will reply with a clear execution plan.',
      name: 'Name',
      email: 'Email',
      message: 'Tell me about your project...',
      send: 'Send Message',
      sending: 'Sending...',
      footerBody: 'Available for freelance work, internal web apps, and modern company profile websites.',
      available: 'Available for Work',
      dark: 'Dark',
      light: 'Light',
      lang: 'ID',
      loadingScreen: 'Preparing portfolio...'
    }
  };
  const t = content[language];

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, projectsRes, experiencesRes, highlightsRes, servicesRes, processRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/projects'),
          fetch('/api/experiences'),
          fetch('/api/about-highlights'),
          fetch('/api/services'),
          fetch('/api/process-steps')
        ]);

        const [profileData, projectData, experienceData, highlightData, serviceData, processData] = await Promise.all([
          profileRes.json(),
          projectsRes.json(),
          experiencesRes.json(),
          highlightsRes.json(),
          servicesRes.json(),
          processRes.json()
        ]);

        setProfile(profileData);
        setProjects(projectData || []);
        setExperiences(experienceData || []);
        setHighlights(highlightData || []);
        setServices(serviceData || []);
        setProcessSteps(processData || []);
      } catch (_error) {
        setStatus('Gagal memuat data portofolio.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    document.title = 'Minham Portfolio - Fullstack Developer';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute('content', 'Portfolio modern fullstack developer dengan project, case study, dan layanan pengembangan web end-to-end.');
    }
    trackEvent('pageview', '/');
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('portfolioLang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('portfolioTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (loading) {
      return () => {};
    }

    const sectionIds = ['home', 'about', 'projects', 'journey', 'services', 'contact'];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sectionElements.length === 0) {
      return () => {};
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-35% 0px -50% 0px',
        threshold: 0.1
      }
    );

    sectionElements.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    const journeyEl = document.getElementById('journey');
    if (!journeyEl) {
      return () => {};
    }

    const handleTimelineProgress = () => {
      const rect = journeyEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = viewportHeight * 0.85;
      const end = viewportHeight * 0.2;
      const progress = ((start - rect.top) / (start - end)) * 100;
      setTimelineProgress(Math.max(0, Math.min(100, progress)));
    };

    handleTimelineProgress();
    window.addEventListener('scroll', handleTimelineProgress, { passive: true });
    return () => window.removeEventListener('scroll', handleTimelineProgress);
  }, [experiences.length]);

  useEffect(() => {
    if (loading) {
      return () => {};
    }

    const statEl = document.getElementById('stats');
    if (!statEl) {
      return () => {};
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(statEl);
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    if (loading) {
      return () => {};
    }

    const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!revealItems.length) {
      return () => {};
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    if (!statsVisible) {
      return () => {};
    }

    const duration = 1200;
    const start = performance.now();
    const target = {
      projects: projects.length,
      experiences: experiences.length,
      stacks: stacks.length
    };

    let frameId = 0;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        projects: Math.round(target.projects * eased),
        experiences: Math.round(target.experiences * eased),
        stacks: Math.round(target.stacks * eased)
      });
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [statsVisible, projects.length, experiences.length, stacks.length]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setStatus('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await parseJson(response);
      if (!response.ok) {
        throw new Error(result?.message || 'Pengiriman gagal');
      }

      setStatus(result.message);
      setForm(initialContactForm);
      trackEvent('contact_submit', window.location.pathname);
    } catch (error) {
      setStatus(error.message || 'Terjadi kesalahan saat mengirim pesan.');
    } finally {
      setSending(false);
    }
  };

  const featuredProject = projects[0];
  const otherProjects = projects.slice(1);
  const highlightItems = highlights.length > 0
    ? highlights.map((item) => [item.title, item.description])
    : (language === 'id'
      ? [
        ['Clean Architecture', 'Struktur kode maintainable untuk jangka panjang.'],
        ['UI Detail', 'Tampilan modern dengan ritme visual yang konsisten.'],
        ['Reliable Delivery', 'Deploy containerized app yang mudah direplikasi.']
      ]
      : [
        ['Clean Architecture', 'Maintainable code structure for long-term product growth.'],
        ['UI Detail', 'Modern visuals with consistent hierarchy and interaction rhythm.'],
        ['Reliable Delivery', 'Containerized deployment that is easy to replicate and maintain.']
      ]);
  const serviceItems = services.length > 0
    ? services.map((item) => [item.title, item.description])
    : (language === 'id'
      ? [
        ['Frontend Engineering', 'Desain UI modern responsive dengan interaksi halus dan aksesibilitas terjaga.'],
        ['Backend API', 'Pembuatan API Node.js yang bersih, aman, dan siap integrasi dengan frontend.'],
        ['Docker Deployment', 'Setup container, compose, dan pipeline deploy agar maintenance lebih mudah.']
      ]
      : [
        ['Frontend Engineering', 'Modern responsive UI with smooth interactions and strong accessibility.'],
        ['Backend API', 'Clean and secure Node.js API implementation ready for frontend integration.'],
        ['Docker Deployment', 'Container setup and deployment flow for easier maintenance and scaling.']
      ]);
  const processItems = processSteps.length > 0
    ? processSteps.map((item) => [item.stepNo, item.title, item.description])
    : [
      ['01', 'Discover', t.processSteps[0]],
      ['02', 'Design', t.processSteps[1]],
      ['03', 'Develop', t.processSteps[2]],
      ['04', 'Deploy', t.processSteps[3]]
    ];
  const navItems = [
    { id: 'home', label: t.nav.home },
    { id: 'about', label: t.nav.about },
    { id: 'projects', label: t.nav.projects },
    { id: 'journey', label: t.nav.journey },
    { id: 'services', label: t.nav.services },
    { id: 'contact', label: t.nav.contact }
  ];
  const statsItems = [
    { label: t.stats[0], value: `${animatedStats.projects || 0}+` },
    { label: t.stats[1], value: `${animatedStats.experiences || 0}+` },
    { label: t.stats[2], value: `${animatedStats.stacks || 0}+` },
    { label: t.stats[3], value: t.statusOpen }
  ];

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? 'theme-dark bg-[#0b0d10] text-zinc-100' : 'bg-[#f2f2ef] text-zinc-900'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`h-14 w-14 animate-spin rounded-full border-4 ${darkMode ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'}`} />
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">{t.loadingScreen}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen overflow-hidden ${darkMode ? 'theme-dark bg-[#0b0d10] text-zinc-100' : 'bg-[#f2f2ef] text-zinc-900'}`}>
      <div className="noise-layer" />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: 'linear-gradient(140deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.06) 100%)',
          transform: `translateY(${scrollY * -0.03}px)`
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 15% 18%, rgba(255,255,255,0.95), transparent 44%), radial-gradient(circle at 88% 12%, rgba(16,16,16,0.08), transparent 35%), radial-gradient(circle at 50% 88%, rgba(16,16,16,0.08), transparent 38%)',
          transform: `translateY(${scrollY * -0.08}px)`
        }}
      />

      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f8f8f6]/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <a href="#home" className="flex items-center gap-3 md:hidden">
            <span className="grid h-10 w-10 place-content-center rounded-xl border border-black/20 bg-white text-xs font-bold tracking-[0.18em]">MM</span>
            <p className="font-display text-base leading-none tracking-[0.14em]">MINHAM</p>
          </a>
          <a href="#home" className="hidden items-center gap-3 md:flex">
            <span className="grid h-10 w-10 place-content-center rounded-xl border border-black/20 bg-white text-xs font-bold tracking-[0.18em]">MM</span>
            <div>
              <p className="font-display text-lg leading-none tracking-[0.16em]">MINHAM</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">{t.brandTag}</p>
            </div>
          </a>
          <div className="hidden items-center justify-center gap-2 md:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  activeSection === item.id
                    ? 'border-black bg-black text-white'
                    : 'border-black/15 text-zinc-700 hover:bg-black hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="hidden items-center justify-end gap-2 md:flex">
            <button type="button" onClick={() => setDarkMode((prev) => !prev)} className="top-control-btn rounded-full border border-black/20 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700">{darkMode ? t.light : t.dark}</button>
            <button type="button" onClick={() => setLanguage((prev) => (prev === 'id' ? 'en' : 'id'))} className="top-control-btn rounded-full border border-black/20 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700">{t.lang}</button>
            <a href="/admin" className="rounded-full border border-black bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">{t.admin}</a>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="top-control-btn rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? 'Close' : 'Menu'}
          </button>
        </nav>
        {mobileMenuOpen ? (
          <div className="mx-auto max-w-6xl px-5 pb-4 md:hidden">
            <div className="rounded-2xl border border-black/10 bg-white/90 p-3 shadow-lg">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDarkMode((prev) => !prev)} className="top-control-btn rounded-full border border-black/15 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">{darkMode ? t.light : t.dark}</button>
                <button type="button" onClick={() => setLanguage((prev) => (prev === 'id' ? 'en' : 'id'))} className="top-control-btn rounded-full border border-black/15 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">{t.lang}</button>
              </div>
              <div className="grid gap-2">
                {navItems.map((item) => (
                  <a
                    key={`mobile-${item.id}`}
                    href={`#${item.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl border px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] ${
                      activeSection === item.id ? 'border-black bg-black text-white' : 'border-black/15 bg-white text-zinc-700'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
                <a href="/admin" className="rounded-xl border border-black bg-black px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-white">{t.admin}</a>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-7 px-5 pb-24 pt-8">
        <section id="home" data-reveal className="reveal-block grid gap-6 rounded-[34px] border border-black/10 bg-white/80 p-7 shadow-[0_20px_70px_-48px_rgba(0,0,0,0.35)] backdrop-blur lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-black/20 bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">{t.heroTag}</p>
            <h1 className="font-display text-5xl leading-[0.88] md:text-6xl lg:text-7xl">
              {t.heroTitleA}
              <span className="block text-zinc-500">{t.heroTitleB}</span>
              <span className="block">{t.heroTitleC}</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
              {profile?.bio || t.heroBio}
            </p>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'Express', 'Prisma', 'Docker', 'Tailwind'].map((chip) => (
                <span key={chip} className="hero-stack-chip rounded-full border border-black/15 bg-[#f4f4f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-700">{chip}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <div
                onMouseMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
                  const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
                  setCtaMagnet({ x, y });
                }}
                onMouseLeave={() => setCtaMagnet({ x: 0, y: 0 })}
              >
                <a
                  href="#projects"
                  style={{ transform: `translate(${ctaMagnet.x}px, ${ctaMagnet.y}px)` }}
                  className="inline-block rounded-full border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition duration-200 hover:opacity-90"
                >
                  {t.viewProjects}
                </a>
              </div>
              <a href="#contact" className="rounded-full border border-black/20 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition hover:bg-zinc-100">{t.discussProject}</a>
            </div>
          </div>

          <div className="hero-3d-scene relative">
            <div
              className="hero-3d-card relative overflow-hidden rounded-3xl border border-black/15 bg-[linear-gradient(145deg,#ffffff,#ececea)] p-6"
              style={{ transform: `perspective(1200px) rotateX(${heroTilt.y}deg) rotateY(${heroTilt.x}deg)` }}
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const px = (event.clientX - rect.left) / rect.width;
                const py = (event.clientY - rect.top) / rect.height;
                setHeroTilt({
                  x: (px - 0.5) * 12,
                  y: (0.5 - py) * 10
                });
              }}
              onMouseLeave={() => setHeroTilt({ x: 0, y: 0 })}
            >
            <div className="hero-online-badge absolute right-4 top-4 rounded-full border border-black/15 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">{t.onlineNow}</div>
            <div className="hero-grid absolute inset-0 opacity-40" />
            <div className="parallax-orb soft-float absolute -right-10 -top-10 h-44 w-44 rounded-full border border-black/10 bg-white/80 shadow-inner" style={{ transform: `translateY(${scrollY * 0.04}px) translateZ(25px)` }} />
            <div className="parallax-orb hero-orbit absolute -bottom-8 -left-8 h-32 w-32 rounded-full border border-black/10 bg-[#efefec]" style={{ transform: `translateY(${scrollY * -0.05}px) translateZ(18px)` }} />
            <div className="hero-ring absolute -right-6 bottom-6 h-24 w-24 rounded-full border border-black/20" />
            <div className="hero-star absolute left-7 top-7 h-2 w-2 rounded-full bg-black/30" />
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.currentFocus}</p>
              <h2 className="font-display text-4xl leading-[0.9]">{t.heroPanelA}
                <span className="block text-zinc-500">{t.heroPanelB}</span>
              </h2>
              <div className="space-y-2">
                {projects.slice(0, 3).map((project, idx) => (
                  <div key={project.id} className="hero-project-pill flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2">
                    <span className="grid h-7 w-7 place-content-center rounded-full bg-black text-[10px] font-semibold text-white">{idx + 1}</span>
                    <span className="truncate text-xs font-semibold text-zinc-700">{project.title}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </section>

        <section id="stats" data-reveal className="reveal-block grid gap-3 md:grid-cols-4">
          {statsItems.map((item) => (
            <article key={item.label} className="rounded-2xl border border-black/10 bg-white/75 p-4 shadow-[0_18px_40px_-34px_rgba(0,0,0,0.45)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
              <p className="mt-2 font-display text-3xl">{item.value}</p>
            </article>
          ))}
        </section>

        <section id="about" data-reveal className="reveal-block rounded-3xl border border-black/10 bg-white/80 p-7">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl border border-black/10 bg-[#f3f3f1] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.nav.about}</p>
                <h2 className="mt-2 font-display text-4xl leading-tight">{t.aboutTitle}</h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  {profile?.fullName || 'Minham'} {t.aboutBody}
                </p>
              </div>
            </div>
            <div className="order-1 grid gap-3 lg:order-2">
              {highlightItems.map(([title, desc]) => (
                <article key={title} className="rounded-2xl border border-black/10 bg-[#f7f7f5] p-4">
                  <h3 className="font-display text-2xl leading-none">{title}</h3>
                  <p className="mt-2 text-sm text-zinc-600">{desc}</p>
                </article>
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="about-meta-card rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.location}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-800">{profile?.location || 'Indonesia'}</p>
                </div>
                <div className="about-meta-card rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.role}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-800">{profile?.role || 'Fullstack Developer'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" data-reveal className="reveal-block rounded-3xl border border-black/10 bg-white/85 p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-4xl">{t.selectedProjects}</h2>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.showcase}</p>
          </div>
          {loading ? (
            <p className="text-sm text-zinc-600">{t.loadingProjects}</p>
          ) : (
            <>
              {featuredProject ? (
                <article className="scale-in mb-4 rounded-3xl border border-black/15 bg-gradient-to-br from-[#111] to-[#1c1c1c] p-6 text-zinc-100">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">{t.featuredProject}</p>
                  <a href={`/project/${featuredProject.slug}`} onClick={() => trackEvent('project_detail_open', `/project/${featuredProject.slug}`, { slug: featuredProject.slug })} className="mt-2 block font-display text-4xl leading-tight hover:underline">{featuredProject.title}</a>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300">{featuredProject.description}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{featuredProject.stack}</p>
                  <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide">
                    <a href={`/project/${featuredProject.slug}`} onClick={() => trackEvent('project_detail_open', `/project/${featuredProject.slug}`, { slug: featuredProject.slug })} className="rounded-full border border-white/25 px-4 py-2 text-white hover:bg-white hover:text-black">Detail</a>
                    <a href={featuredProject.liveUrl || '#'} onClick={() => trackEvent('project_live_click', window.location.pathname, { slug: featuredProject.slug })} target="_blank" rel="noreferrer" className="rounded-full border border-white/25 bg-white px-4 py-2 text-black">{t.liveSite}</a>
                    <a href={featuredProject.repoUrl || '#'} onClick={() => trackEvent('project_source_click', window.location.pathname, { slug: featuredProject.slug })} target="_blank" rel="noreferrer" className="rounded-full border border-white/25 px-4 py-2 text-white hover:bg-white hover:text-black">{t.sourceCode}</a>
                  </div>
                </article>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                {otherProjects.map((project) => (
                  <article key={project.id} className="project-cinematic group rounded-2xl border border-black/10 bg-[#f8f8f6] p-5 transition hover:-translate-y-1 hover:shadow-[0_24px_48px_-36px_rgba(0,0,0,0.8)]">
                    <div className="mb-4 h-36 overflow-hidden rounded-xl border border-black/10 bg-gradient-to-br from-white via-[#ededea] to-[#dcdcd9]">
                      <div className="h-full w-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.9),transparent_38%),radial-gradient(circle_at_75%_70%,rgba(0,0,0,0.15),transparent_34%)] transition duration-300 group-hover:scale-105" />
                    </div>
                    <a href={`/project/${project.slug}`} onClick={() => trackEvent('project_detail_open', `/project/${project.slug}`, { slug: project.slug })} className="font-display text-2xl leading-tight hover:underline">{project.title}</a>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">{project.description}</p>
                    <p className="project-meta mt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{project.stack}</p>
                    <div className="project-meta mt-4 flex gap-3 text-xs font-semibold uppercase tracking-wide">
                      <a href={project.liveUrl || '#'} onClick={() => trackEvent('project_live_click', window.location.pathname, { slug: project.slug })} target="_blank" rel="noreferrer" className="rounded-full border border-black/20 px-3 py-1.5 hover:bg-black hover:text-white">Live</a>
                      <a href={project.repoUrl || '#'} onClick={() => trackEvent('project_source_click', window.location.pathname, { slug: project.slug })} target="_blank" rel="noreferrer" className="rounded-full border border-black/20 px-3 py-1.5 hover:bg-black hover:text-white">Source</a>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section id="journey" data-reveal className="reveal-block rounded-3xl border border-black/10 bg-white/80 p-7">
          <h2 className="font-display text-4xl">{t.experienceTimeline}</h2>
          <div className="relative mt-6 space-y-4 pl-6">
            <div className="absolute bottom-0 left-2 top-0 w-px bg-black/15" />
            <div className="absolute left-2 top-0 w-px bg-black transition-all duration-300" style={{ height: `${timelineProgress}%` }} />
            {experiences.map((item) => (
              <article key={item.id} className="relative rounded-2xl border border-black/10 bg-[#f7f7f5] p-5">
                <span className="absolute -left-[26px] top-6 h-3 w-3 rounded-full border border-black bg-white" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-2xl leading-tight">{item.role}</h3>
                  <span className="rounded-full border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{item.startDate} - {item.endDate}</span>
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.company}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="services" data-reveal className="reveal-block rounded-3xl border border-black/10 bg-white/85 p-7">
          <h2 className="font-display text-4xl">{t.services}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {serviceItems.map(([title, desc]) => (
              <article key={title} className="rounded-2xl border border-black/10 bg-[#f5f5f3] p-5">
                <h3 className="font-display text-2xl leading-tight">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="process" data-reveal className="reveal-block rounded-3xl border border-black/10 bg-white/80 p-7">
          <h2 className="font-display text-4xl">{t.process}</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {processItems.map(([step, title, desc]) => (
              <article key={step} className="rounded-2xl border border-black/10 bg-[#f6f6f4] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Step {step}</p>
                <h3 className="mt-2 font-display text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section data-reveal className="reveal-block overflow-hidden rounded-2xl border border-black/10 bg-white/80 py-3">
          <div className="marquee-track flex gap-3 px-4">
            {[...stacks, ...stacks, ...stacks].map((item, idx) => (
              <span key={`${item}-${idx}`} className="rounded-full border border-black/20 bg-[#f5f5f3] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">{item}</span>
            ))}
          </div>
        </section>

        <section id="contact" data-reveal className="reveal-block relative overflow-hidden rounded-3xl border border-black/10 bg-[#0f0f0f] p-7 text-zinc-100">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.16),transparent_36%),radial-gradient(circle_at_84%_80%,rgba(255,255,255,0.11),transparent_30%)]" />
          <span className="pulse-ring absolute right-8 top-8 h-24 w-24 rounded-full border border-white/20" />
          <h2 className="font-display text-4xl">{t.contactTitle}</h2>
          <p className="mt-2 text-sm text-zinc-300">{t.contactBody}</p>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-3 md:grid-cols-2">
            <input name="name" value={form.name} onChange={handleChange} placeholder={t.name} required className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-white/50" />
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder={t.email} required className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-white/50" />
            <textarea name="message" value={form.message} onChange={handleChange} placeholder={t.message} rows="5" required className="md:col-span-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-white/50" />
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={sending} className="rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black disabled:opacity-70">{sending ? t.sending : t.send}</button>
              {status ? <p className="text-xs font-semibold text-zinc-300">{status}</p> : null}
            </div>
          </form>
        </section>

        <footer data-reveal className="reveal-block rounded-3xl border border-black/10 bg-white/80 p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Minham Studio</p>
              <h3 className="mt-2 font-display text-3xl leading-tight">Build. Launch. Iterate.</h3>
              <p className="mt-2 text-sm text-zinc-600">{t.footerBody}</p>
            </div>
            <div className="flex flex-col items-start justify-between gap-3 md:items-end">
              <span className="rounded-full border border-black/15 bg-[#f6f6f4] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">{t.available}</span>
              <div className="flex gap-2">
                <a href={profile?.github || '#'} target="_blank" rel="noreferrer" className="rounded-full border border-black/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-black hover:text-white">Github</a>
                <a href={profile?.linkedin || '#'} target="_blank" rel="noreferrer" className="rounded-full border border-black/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-black hover:text-white">LinkedIn</a>
              </div>
              <p className="text-xs text-zinc-500">© {new Date().getFullYear()} Minham. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ProjectDetailPage() {
  const slug = window.location.pathname.split('/project/')[1] || '';
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function loadProject() {
      try {
        const response = await fetch(`/api/projects/${slug}`);
        const data = await parseJson(response);
        if (!response.ok) {
          throw new Error(data?.message || 'Project tidak ditemukan');
        }
        setProject(data);
      } catch (err) {
        setError(err.message || 'Gagal memuat detail project');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProject();
    } else {
      setLoading(false);
      setError('Slug project tidak valid');
    }
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    document.title = `${project.title} - Project Detail`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute('content', project.description || project.longDescription || 'Detail project portfolio');
    }
    trackEvent('pageview', `/project/${project.slug}`, { slug: project.slug });
  }, [project]);

  const media = project?.media || [];
  const activeMedia = media[activeIndex];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d10] text-zinc-100">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
        <div className="rounded-2xl border border-slate-300 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">{error || 'Project tidak ditemukan'}</p>
          <a href="/" className="mt-4 inline-block rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Kembali</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-zinc-100">
      <main className="mx-auto max-w-6xl px-5 py-10">
        <a href="/" className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200">Kembali ke Portfolio</a>
        <section className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-white/15 bg-[#141821] p-5">
            <h1 className="font-display text-4xl leading-tight">{project.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{project.longDescription || project.description}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">{project.stack}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.liveUrl ? <a href={project.liveUrl} onClick={() => trackEvent('project_live_click', `/project/${project.slug}`, { slug: project.slug })} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black">Live</a> : null}
              {project.repoUrl ? <a href={project.repoUrl} onClick={() => trackEvent('project_source_click', `/project/${project.slug}`, { slug: project.slug })} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide">Source</a> : null}
            </div>
            <div className="mt-5 grid gap-3">
              {project.problem ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Problem</p>
                  <p className="mt-1 text-sm text-zinc-200">{project.problem}</p>
                </div>
              ) : null}
              {project.solution ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Solution</p>
                  <p className="mt-1 text-sm text-zinc-200">{project.solution}</p>
                </div>
              ) : null}
              {project.architecture ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Architecture</p>
                  <p className="mt-1 text-sm text-zinc-200">{project.architecture}</p>
                </div>
              ) : null}
              {project.impact ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Impact</p>
                  <p className="mt-1 text-sm text-zinc-200">{project.impact}</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-3xl border border-white/15 bg-[#141821] p-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              {activeMedia ? (
                activeMedia.type === 'video' ? (
                  <video src={activeMedia.url} controls className="h-[320px] w-full object-cover" />
                ) : (
                  <img src={activeMedia.url} alt={activeMedia.caption || project.title} className="h-[320px] w-full object-cover" />
                )
              ) : project.coverImageUrl ? (
                <img src={project.coverImageUrl} alt={project.title} className="h-[320px] w-full object-cover" />
              ) : (
                <div className="grid h-[320px] place-content-center text-sm text-zinc-400">Belum ada media</div>
              )}
            </div>
            {activeMedia?.caption ? <p className="mt-2 text-xs text-zinc-300">{activeMedia.caption}</p> : null}
            {media.length > 0 ? (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {media.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`overflow-hidden rounded-lg border ${activeIndex === idx ? 'border-white' : 'border-white/15'}`}
                  >
                    {item.type === 'video' ? (
                      <div className="grid h-16 place-content-center bg-[#1a2028] text-[11px] font-semibold uppercase tracking-wide">Video</div>
                    ) : (
                      <img src={item.url} alt={item.caption || `media-${idx}`} className="h-16 w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            ) : null}
            {project.videoUrl ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Video Demo (Opsional)</p>
                <video src={project.videoUrl} controls className="w-full rounded-lg" />
              </div>
            ) : null}
          </article>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const isProjectDetailRoute = window.location.pathname.startsWith('/project/');
  if (isAdminRoute) return <AdminPage />;
  if (isProjectDetailRoute) return <ProjectDetailPage />;
  return <PortfolioPage />;
}
