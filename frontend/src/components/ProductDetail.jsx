import { useState } from 'react'

function ProductDetail({ product, onBack }) {
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  if (!product) {
    return (
      <div className="product-detail">
        <button className="btn btn-back" onClick={onBack}>
          ← Back to Recommendations
        </button>
        <div className="error">Product not found</div>
      </div>
    )
  }

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <div className="product-detail">
      <div className="product-detail-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back to Recommendations
        </button>
      </div>

      <div className="product-detail-content">
        <div className="product-image-large">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-info-detailed">
          <h1>{product.name}</h1>
          <p className="brand-large">{product.brand}</p>
          <div className="rating-large">
            <span className="stars">★ {product.rating}</span>
            <span className="rating-text">({Math.floor(Math.random() * 500) + 100} reviews)</span>
          </div>

          <div className="price-large">${product.price}</div>

          <div className="skin-type-badge">
            Recommended for {product.skinType} Skin
          </div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
            <p>This carefully formulated product is designed to address the specific needs of {product.skinType.toLowerCase()} skin. Made with high-quality ingredients and backed by dermatological research.</p>
          </div>

          <div className="product-benefits">
            <h3>Key Benefits</h3>
            <ul>
              <li>Suitable for {product.skinType.toLowerCase()} skin</li>
              <li>Dermatologist tested</li>
              <li>Cruelty-free formula</li>
              <li>Free from harmful chemicals</li>
            </ul>
          </div>

          <div className="product-ingredients">
            <h3>Key Ingredients</h3>
            <p>Water, Glycerin, Hyaluronic Acid, Niacinamide, Ceramides, Vitamin E</p>
          </div>

          <div className="purchase-section">
            <div className="quantity-selector">
              <label htmlFor="quantity">Quantity:</label>
              <select
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              >
                {[1,2,3,4,5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <button
              className={`btn btn-primary btn-large ${addedToCart ? 'btn-success' : ''}`}
              onClick={handleAddToCart}
              disabled={addedToCart}
            >
              {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
