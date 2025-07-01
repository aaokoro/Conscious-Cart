import { useState, useEffect } from 'react'

function ProductRecommendations({ onProductSelect, onBack }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock product data for now
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts([
        {
          id: 1,
          name: "Gentle Cleanser",
          brand: "SkinCare Pro",
          price: 24.99,
          rating: 4.5,
          image: "/api/placeholder/200/200",
          description: "A gentle, non-drying cleanser perfect for sensitive skin.",
          skinType: "Sensitive"
        },
        {
          id: 2,
          name: "Hydrating Serum",
          brand: "GlowUp",
          price: 39.99,
          rating: 4.8,
          image: "/api/placeholder/200/200",
          description: "Intensive hydrating serum with hyaluronic acid.",
          skinType: "Dry"
        },
        {
          id: 3,
          name: "Oil Control Moisturizer",
          brand: "ClearSkin",
          price: 29.99,
          rating: 4.3,
          image: "/api/placeholder/200/200",
          description: "Lightweight moisturizer that controls oil without drying.",
          skinType: "Oily"
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="recommendations">
        <div className="recommendations-header">
          <button className="btn btn-back" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h2>Your Personalized Recommendations</h2>
        </div>
        <div className="loading">Loading recommendations...</div>
      </div>
    )
  }

  return (
    <div className="recommendations">
      <div className="recommendations-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h2>Your Personalized Recommendations</h2>
        <p>Based on your skin profile, here are products we recommend for you:</p>
      </div>

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="brand">{product.brand}</p>
              <p className="description">{product.description}</p>
              <div className="product-meta">
                <span className="price">${product.price}</span>
                <span className="rating">★ {product.rating}</span>
              </div>
              <span className="skin-type">For {product.skinType} Skin</span>
              <button
                className="btn btn-primary"
                onClick={() => onProductSelect(product)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductRecommendations
