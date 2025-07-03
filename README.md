# Modern Webshop Application

A complete webshop built with vanilla HTML, CSS, and JavaScript, featuring both user and admin interfaces.

## Features

### End User Features
- Browse product catalog
- Add/remove products from shopping cart
- View cart contents and total
- Place orders with confirmation
- Responsive design

### Admin Features
- Manage products (add, edit, delete)
- View all orders
- Reset products to original state
- Secure admin access

## Technical Implementation

### Technologies Used
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend**: JSON Server (for development)
- **Storage**: Local Storage for cart and orders
- **Hosting**: Netlify-ready

### Key Programming Techniques Demonstrated
- Object-oriented programming
- Modular functions
- Array manipulation methods
- Local storage management
- Proper variable scoping (let/const)
- Form validation
- Error handling

## Project Structure

```
webshop/
├── index.html              # Main user interface
├── admin.html              # Admin panel
├── css/
│   ├── style.css          # Main styles
│   └── admin.css          # Admin styles
├── js/
│   ├── app.js             # Main application logic
│   ├── admin.js           # Admin functionality
│   ├── cart.js            # Shopping cart management
│   ├── products.js        # Product operations
│   ├── orders.js          # Order processing
│   └── storage.js         # Local storage utilities
├── data/
│   └── products.json      # Initial product data
├── db.json                # JSON Server database
└── README.md
```

## Setup Instructions

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webshop
   ```

2. **Install JSON Server globally**
   ```bash
   npm install -g json-server
   ```

3. **Start the JSON Server**
   ```bash
   json-server --watch db.json --port 3001
   ```

4. **Open the application**
   - Open `index.html` in your browser for the user interface
   - Navigate to admin panel via the admin link or open `admin.html`

### Admin Access
- Click "Admin Panel" in the footer
- Default admin credentials are built into the demo

## API Endpoints

When running with JSON Server:
- `GET /products` - Fetch all products
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

## Deployment

### Netlify Deployment
1. Build the project (if using build tools)
2. Deploy the `dist` folder or root folder to Netlify
3. Configure environment variables for production API

### Environment Configuration
- Development: Uses json-server on localhost:3001
- Production: Configure API_URL for your hosted backend

## Usage

### User Interface
1. Browse products on the homepage
2. Click "Add to Cart" to add products
3. View cart by clicking the cart icon
4. Proceed to checkout to place an order

### Admin Interface
1. Access admin panel from the footer link
2. Manage products: add, edit, or delete
3. View customer orders
4. Reset products to original state

## Features in Detail

### Form Validation
- Required field validation
- Email format validation
- Numeric input validation
- Real-time error feedback

### Error Handling
- Network error handling
- Local storage error handling
- User-friendly error messages
- Graceful degradation

### Performance Optimizations
- Efficient DOM manipulation
- Minimal API calls
- Optimized local storage usage
- Responsive image loading

## Testing

The application includes:
- Input validation testing
- Local storage functionality testing
- API integration testing
- Cross-browser compatibility

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
MIT License - feel free to use this project for learning and development.
