import { useState } from 'react'
import Navbar from '../components/Navbar'
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa'

const initialServices = [
  { id: 1, name: 'Haircut', price: 150, duration: '30 mins' },
  { id: 2, name: 'Hair Color', price: 500, duration: '2 hrs' },
  { id: 3, name: 'Rebond', price: 1500, duration: '3 hrs' },
  { id: 4, name: 'Manicure', price: 150, duration: '45 mins' },
  { id: 5, name: 'Pedicure', price: 180, duration: '45 mins' },
  { id: 6, name: 'Facial', price: 350, duration: '1 hr' },
]

function Services() {
  const [services, setServices] = useState(initialServices)
  const [showForm, setShowForm] = useState(false)
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' })

  const handleAdd = () => {
    if (!newService.name || !newService.price || !newService.duration) return
    const service = {
      id: services.length + 1,
      name: newService.name,
      price: parseFloat(newService.price),
      duration: newService.duration,
    }
    setServices([...services, service])
    setNewService({ name: '', price: '', duration: '' })
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setServices(services.filter((s) => s.id !== id))
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <h1>Services</h1>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            <FaPlus /> Add Service
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h3>New Service</h3>
            <input
              type="text"
              placeholder="Service Name"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price (₱)"
              value={newService.price}
              onChange={(e) => setNewService({ ...newService, price: e.target.value })}
            />
            <input
              type="text"
              placeholder="Duration (e.g. 30 mins)"
              value={newService.duration}
              onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
            />
            <div className="form-actions">
              <button className="btn-primary" onClick={handleAdd}>Save</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="services-grid">
          {services.map((service) => (
            <div className="service-card" key={service.id}>
              <div className="service-info">
                <h3>{service.name}</h3>
                <p>⏱ {service.duration}</p>
                <h2>₱{service.price.toLocaleString()}</h2>
              </div>
              <div className="service-actions">
                <button className="btn-danger" onClick={() => handleDelete(service.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Services