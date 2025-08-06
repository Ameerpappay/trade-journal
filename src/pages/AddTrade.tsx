import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, Trade, TradeImage, Strategy, Tag } from '../services/api'
import './AddTrade.css'

const AddTrade: React.FC = () => {
  const navigate = useNavigate()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [imagesWithTags, setImagesWithTags] = useState<TradeImage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStrategies()
    loadTags()
  }, [])

  const loadStrategies = async () => {
    try {
      const strategiesData = await apiClient.getStrategies()
      setStrategies(strategiesData)
    } catch (error) {
      console.error('Failed to load strategies:', error)
    }
  }

  const loadTags = async () => {
    try {
      const tagsData = await apiClient.getTags()
      setTags(tagsData)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const tagSelect = document.getElementById('tags') as HTMLSelectElement
    const selectedTagId = tagSelect.value

    if (file && selectedTagId) {
      const newImage: TradeImage = {
        path: file.name, // In a real app, you'd upload the file and get a path
        tag_id: parseInt(selectedTagId)
      }
      setImagesWithTags([...imagesWithTags, newImage])
      event.target.value = ''
    } else if (!selectedTagId) {
      alert('Please select a tag for the image.')
      event.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImagesWithTags(imagesWithTags.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const trade: Omit<Trade, 'id'> = {
        symbol: formData.get('symbol') as string,
        date: formData.get('date') as string,
        quantity: parseInt(formData.get('quantity') as string),
        price: parseFloat(formData.get('price') as string),
        notes: formData.get('notes') as string || '',
        strategy_id: parseInt(formData.get('strategy') as string)
      }

      await apiClient.addTrade(trade, imagesWithTags)
      alert('Trade added successfully!')
      navigate('/trades')
    } catch (error) {
      console.error('Failed to add trade:', error)
      alert('Failed to add trade. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-trade">
      <h2>Add New Trade</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="symbol">Symbol</label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            placeholder="e.g., INFY, REL"
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="strategy">Strategy</label>
          <select id="strategy" name="strategy" required className="form-control">
            <option value="">Select Strategy</option>
            {strategies.map(strategy => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            placeholder="Enter Quantity"
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Price</label>
          <input
            type="number"
            id="price"
            name="price"
            step="0.01"
            placeholder="Enter Price"
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Add trade notes..."
            className="form-control"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Add Chart Image</label>
          <div className="image-upload">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="btn btn-primary"
            >
              Add Image
            </button>
            <select id="tags" className="form-control">
              <option value="">Select Tag</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
          <div className="image-list">
            {imagesWithTags.map((img, index) => (
              <div key={index} className="image-item">
                <span>{img.path}</span>
                <span className="tag">{tags.find(t => t.id === img.tag_id)?.name}</span>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="btn btn-danger btn-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? 'Adding...' : 'Add Trade'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddTrade 