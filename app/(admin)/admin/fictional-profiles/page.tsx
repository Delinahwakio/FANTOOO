'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SearchBar } from '@/lib/components/shared/SearchBar';
import { useToast } from '@/lib/hooks/useToast';

interface FictionalProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  bio: string;
  personality_traits: string[];
  interests: string[];
  occupation: string | null;
  education: string | null;
  relationship_status: string | null;
  profile_pictures: string[];
  cover_photo: string | null;
  response_style: string | null;
  response_templates: Record<string, string> | null;
  personality_guidelines: string | null;
  total_chats: number;
  total_messages: number;
  average_rating: number;
  total_revenue: number;
  conversion_rate: number;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  max_concurrent_chats: number;
  tags: string[];
  category: string | null;
  popularity_score: number;
  created_at: string;
  active_chat_count: number;
  created_by_admin?: { name: string };
}

interface FormData {
  name: string;
  age: number;
  gender: string;
  location: string;
  bio: string;
  personality_traits: string[];
  interests: string[];
  occupation: string;
  education: string;
  relationship_status: string;
  profile_pictures: string[];
  cover_photo: string;
  response_style: string;
  response_templates: string;
  personality_guidelines: string;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string;
  max_concurrent_chats: number;
  tags: string[];
  category: string;
}

export default function FictionalProfilesManagementPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [profiles, setProfiles] = useState<FictionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<FictionalProfile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: 18,
    gender: 'female',
    location: '',
    bio: '',
    personality_traits: [],
    interests: [],
    occupation: '',
    education: '',
    relationship_status: '',
    profile_pictures: [],
    cover_photo: '',
    response_style: 'friendly',
    response_templates: '',
    personality_guidelines: '',
    is_active: true,
    is_featured: false,
    featured_until: '',
    max_concurrent_chats: 10,
    tags: [],
    category: ''
  });
  const [bulkImportData, setBulkImportData] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchProfiles();
  }, [searchQuery, genderFilter, activeFilter, featuredFilter, pagination.page]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (searchQuery) params.append('search', searchQuery);
      if (genderFilter) params.append('gender', genderFilter);
      if (activeFilter) params.append('isActive', activeFilter);
      if (featuredFilter) params.append('isFeatured', featuredFilter);

      const response = await fetch(`/api/admin/fictional-profiles?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }

      const data = await response.json();
      setProfiles(data.profiles);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      showError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.profile_pictures.length < 3) {
      showError('Please upload at least 3 profile pictures');
      return;
    }

    if (formData.profile_pictures.length > 10) {
      showError('Maximum 10 profile pictures allowed');
      return;
    }

    try {
      const response = await fetch('/api/admin/fictional-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          response_templates: formData.response_templates ? JSON.parse(formData.response_templates) : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create profile');
      }

      showSuccess('Profile created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchProfiles();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      showError(error.message || 'Failed to create profile');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProfile) return;

    if (formData.profile_pictures.length < 3) {
      showError('Please upload at least 3 profile pictures');
      return;
    }

    if (formData.profile_pictures.length > 10) {
      showError('Maximum 10 profile pictures allowed');
      return;
    }

    try {
      const response = await fetch(`/api/admin/fictional-profiles/${selectedProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          response_templates: formData.response_templates ? JSON.parse(formData.response_templates) : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      showSuccess('Profile updated successfully');
      setShowEditModal(false);
      setSelectedProfile(null);
      resetForm();
      fetchProfiles();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError(error.message || 'Failed to update profile');
    }
  };

  const handleDeleteProfile = async (profile: FictionalProfile) => {
    if (profile.active_chat_count > 0) {
      showError(`Cannot delete profile with ${profile.active_chat_count} active chats`);
      return;
    }

    if (!confirm(`Are you sure you want to delete &quot;${profile.name}&quot;? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/fictional-profiles/${profile.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete profile');
      }

      showSuccess('Profile deleted successfully');
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      showError(error.message || 'Failed to delete profile');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const profiles = JSON.parse(bulkImportData);

      const response = await fetch('/api/admin/fictional-profiles/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.validation_errors) {
          showError(`Validation failed: ${data.invalid_count} profiles have errors`);
          console.error('Validation errors:', data.validation_errors);
        } else {
          throw new Error(data.error || 'Failed to import profiles');
        }
        return;
      }

      showSuccess(`Successfully imported ${data.imported_count} profiles`);
      setShowBulkImportModal(false);
      setBulkImportData('');
      fetchProfiles();
    } catch (error: any) {
      console.error('Error importing profiles:', error);
      showError(error.message || 'Failed to import profiles. Check JSON format.');
    }
  };

  const openEditModal = (profile: FictionalProfile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      location: profile.location,
      bio: profile.bio,
      personality_traits: profile.personality_traits || [],
      interests: profile.interests || [],
      occupation: profile.occupation || '',
      education: profile.education || '',
      relationship_status: profile.relationship_status || '',
      profile_pictures: profile.profile_pictures || [],
      cover_photo: profile.cover_photo || '',
      response_style: profile.response_style || 'friendly',
      response_templates: profile.response_templates ? JSON.stringify(profile.response_templates, null, 2) : '',
      personality_guidelines: profile.personality_guidelines || '',
      is_active: profile.is_active,
      is_featured: profile.is_featured,
      featured_until: profile.featured_until || '',
      max_concurrent_chats: profile.max_concurrent_chats,
      tags: profile.tags || [],
      category: profile.category || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: 18,
      gender: 'female',
      location: '',
      bio: '',
      personality_traits: [],
      interests: [],
      occupation: '',
      education: '',
      relationship_status: '',
      profile_pictures: [],
      cover_photo: '',
      response_style: 'friendly',
      response_templates: '',
      personality_guidelines: '',
      is_active: true,
      is_featured: false,
      featured_until: '',
      max_concurrent_chats: 10,
      tags: [],
      category: ''
    });
  };

  const toggleFeatured = async (profile: FictionalProfile) => {
    try {
      const response = await fetch(`/api/admin/fictional-profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !profile.is_featured })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle featured status');
      }

      showSuccess(`Profile ${!profile.is_featured ? 'featured' : 'unfeatured'} successfully`);
      fetchProfiles();
    } catch (error) {
      console.error('Error toggling featured:', error);
      showError('Failed to update featured status');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Fictional Profiles Management</h1>
          <p className="text-purple-200">Create and manage fictional profiles for the platform</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:w-auto">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search profiles by name, bio, or location..."
                className="w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Featured</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>

              <button
                onClick={() => setShowBulkImportModal(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Bulk Import
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium transition-all"
              >
                + Create Profile
              </button>
            </div>
          </div>
        </div>

        {/* Profiles Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center border border-white/20">
            <p className="text-purple-200 text-lg">No profiles found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition-all"
                >
                  {/* Profile Image */}
                  <div className="relative h-64">
                    <Image
                      src={profile.profile_pictures[0] || '/placeholder.jpg'}
                      alt={profile.name}
                      fill
                      className="object-cover"
                    />
                    {profile.is_featured && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ⭐ Featured
                      </div>
                    )}
                    {!profile.is_active && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        Inactive
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
                    <p className="text-purple-200 text-sm mb-3">
                      {profile.age} • {profile.gender} • {profile.location}
                    </p>
                    <p className="text-purple-100 text-sm mb-4 line-clamp-2">{profile.bio}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-white font-bold">{profile.total_chats}</div>
                        <div className="text-purple-200 text-xs">Chats</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-white font-bold">{profile.total_messages}</div>
                        <div className="text-purple-200 text-xs">Messages</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-white font-bold">{profile.average_rating.toFixed(1)}</div>
                        <div className="text-purple-200 text-xs">Rating</div>
                      </div>
                    </div>

                    {profile.active_chat_count > 0 && (
                      <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-2 mb-4 text-center">
                        <span className="text-green-300 text-sm font-medium">
                          {profile.active_chat_count} Active Chat{profile.active_chat_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleFeatured(profile)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          profile.is_featured
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {profile.is_featured ? '⭐ Featured' : 'Feature'}
                      </button>
                      <button
                        onClick={() => openEditModal(profile)}
                        className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(profile)}
                        disabled={profile.active_chat_count > 0}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          profile.active_chat_count > 0
                            ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-4">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-white">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30">
            <div className="sticky top-0 bg-slate-900 border-b border-purple-500/30 p-6 z-10">
              <h2 className="text-2xl font-bold text-white">Create Fictional Profile</h2>
            </div>
            
            <form onSubmit={handleCreateProfile} className="p-6 space-y-6">
              <ProfileForm formData={formData} setFormData={setFormData} />
              
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium transition-all"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30">
            <div className="sticky top-0 bg-slate-900 border-b border-purple-500/30 p-6 z-10">
              <h2 className="text-2xl font-bold text-white">Edit Profile: {selectedProfile.name}</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              <ProfileForm formData={formData} setFormData={setFormData} />
              
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProfile(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium transition-all"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl max-w-4xl w-full border border-purple-500/30">
            <div className="border-b border-purple-500/30 p-6">
              <h2 className="text-2xl font-bold text-white">Bulk Import Profiles</h2>
              <p className="text-purple-200 mt-2">Paste JSON array of profiles to import</p>
            </div>
            
            <form onSubmit={handleBulkImport} className="p-6 space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">JSON Data</label>
                <textarea
                  value={bulkImportData}
                  onChange={(e) => setBulkImportData(e.target.value)}
                  placeholder='[{"name": "Jane", "age": 25, "gender": "female", "location": "Nairobi", "bio": "...", "profile_pictures": ["url1", "url2", "url3"]}]'
                  className="w-full h-64 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  required
                />
                <p className="text-purple-200 text-sm mt-2">
                  Required fields: name, age, gender, location, bio, profile_pictures (array of 3-10 URLs)
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setBulkImportData('');
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Import Profiles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Profile Form Component
function ProfileForm({ 
  formData, 
  setFormData 
}: { 
  formData: FormData; 
  setFormData: React.Dispatch<React.SetStateAction<FormData>> 
}) {
  const handleArrayInput = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  return (
    <>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Age *</label>
            <input
              type="number"
              min="18"
              max="100"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Gender *</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Bio *</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
      </div>

      {/* Profile Pictures */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Profile Pictures (3-10 required) *</h3>
        <div>
          <label className="block text-white font-medium mb-2">Picture URLs (comma-separated)</label>
          <textarea
            value={formData.profile_pictures.join(', ')}
            onChange={(e) => handleArrayInput('profile_pictures', e.target.value)}
            placeholder="https://example.com/pic1.jpg, https://example.com/pic2.jpg, https://example.com/pic3.jpg"
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <p className="text-purple-200 text-sm mt-1">
            Current count: {formData.profile_pictures.length} (min: 3, max: 10)
          </p>
        </div>
      </div>

      {/* Additional Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Additional Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">Occupation</label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Education</label>
            <input
              type="text"
              value={formData.education}
              onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Relationship Status</label>
            <input
              type="text"
              value={formData.relationship_status}
              onChange={(e) => setFormData(prev => ({ ...prev, relationship_status: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Response Style</label>
            <select
              value={formData.response_style}
              onChange={(e) => setFormData(prev => ({ ...prev, response_style: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="flirty">Flirty</option>
              <option value="romantic">Romantic</option>
              <option value="friendly">Friendly</option>
              <option value="intellectual">Intellectual</option>
              <option value="playful">Playful</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Personality Traits (comma-separated)</label>
          <input
            type="text"
            value={formData.personality_traits.join(', ')}
            onChange={(e) => handleArrayInput('personality_traits', e.target.value)}
            placeholder="Adventurous, Caring, Funny"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Interests (comma-separated)</label>
          <input
            type="text"
            value={formData.interests.join(', ')}
            onChange={(e) => handleArrayInput('interests', e.target.value)}
            placeholder="Travel, Music, Cooking"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleArrayInput('tags', e.target.value)}
            placeholder="Popular, New, Trending"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Personality Guidelines</label>
          <textarea
            value={formData.personality_guidelines}
            onChange={(e) => setFormData(prev => ({ ...prev, personality_guidelines: e.target.value }))}
            placeholder="Guidelines for operators on how to respond as this character..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Response Templates (JSON)</label>
          <textarea
            value={formData.response_templates}
            onChange={(e) => setFormData(prev => ({ ...prev, response_templates: e.target.value }))}
            placeholder='{"greeting": "Hey there! 😊", "goodbye": "Talk soon! 💕"}'
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
          />
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">Max Concurrent Chats</label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.max_concurrent_chats}
              onChange={(e) => setFormData(prev => ({ ...prev, max_concurrent_chats: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-white font-medium">Active</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-white font-medium">Featured (1.5x message cost)</span>
          </label>
        </div>

        {formData.is_featured && (
          <div>
            <label className="block text-white font-medium mb-2">Featured Until</label>
            <input
              type="datetime-local"
              value={formData.featured_until}
              onChange={(e) => setFormData(prev => ({ ...prev, featured_until: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
      </div>
    </>
  );
}
