import React, { useState, useEffect } from 'react'
import { apiClient, Strategy, Tag } from '../services/api'
import './Settings.css'

const Settings: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [newStrategy, setNewStrategy] = useState('')
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [strategiesData, tagsData] = await Promise.all([
        apiClient.getStrategies(),
        apiClient.getTags()
      ])
      setStrategies(strategiesData)
      setTags(tagsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStrategy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStrategy.trim()) return

    try {
      await apiClient.addStrategy(newStrategy.trim())
      setNewStrategy('')
      loadData() // Reload to get updated list
    } catch (error) {
      console.error('Failed to add strategy:', error)
      alert('Failed to add strategy')
    }
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return

    try {
      await apiClient.addTag(newTag.trim())
      setNewTag('')
      loadData() // Reload to get updated list
    } catch (error) {
      console.error('Failed to add tag:', error)
      alert('Failed to add tag')
    }
  }

  const handleDeleteStrategy = async (id: number) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return

    try {
      await apiClient.deleteStrategy(id)
      loadData() // Reload to get updated list
    } catch (error) {
      console.error('Failed to delete strategy:', error)
      alert('Failed to delete strategy')
    }
  }

  const handleDeleteTag = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    try {
      await apiClient.deleteTag(id)
      loadData() // Reload to get updated list
    } catch (error) {
      console.error('Failed to delete tag:', error)
      alert('Failed to delete tag')
    }
  }

  if (loading) {
    return <div className="settings">Loading...</div>
  }

  return (
    <div className="settings">
      <h2>Settings</h2>
      
      <div className="settings-grid">
        {/* Strategies Section */}
        <div className="settings-section">
          <h3>Strategies</h3>
          <form onSubmit={handleAddStrategy} className="add-form">
            <input
              type="text"
              value={newStrategy}
              onChange={(e) => setNewStrategy(e.target.value)}
              placeholder="New strategy name"
              className="form-control"
              required
            />
            <button type="submit" className="btn btn-primary">
              Add Strategy
            </button>
          </form>
          
          <div className="items-list">
            {strategies.map(strategy => (
              <div key={strategy.id} className="item">
                <span>{strategy.name}</span>
                <button
                  onClick={() => handleDeleteStrategy(strategy.id)}
                  className="btn btn-danger btn-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            {strategies.length === 0 && (
              <p className="empty-message">No strategies available</p>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="settings-section">
          <h3>Tags</h3>
          <form onSubmit={handleAddTag} className="add-form">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="New tag name"
              className="form-control"
              required
            />
            <button type="submit" className="btn btn-primary">
              Add Tag
            </button>
          </form>
          
          <div className="items-list">
            {tags.map(tag => (
              <div key={tag.id} className="item">
                <span>{tag.name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="btn btn-danger btn-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            {tags.length === 0 && (
              <p className="empty-message">No tags available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings 