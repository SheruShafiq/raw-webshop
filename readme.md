> # Wall Market **Online**
Yes, you read that correctly. The ever generous Don himself is going GLOBAL! Thanks to 
shintranet!
We have everything; swords, snacks, bombs, games, sneakers, materia. You name it, we deliver it!
And thanks to our excellent jockeys and their lovely black Chocobos, we garantee same week delivery! 
Except the following regions:
- Mideel
- Nibbelheim

**So, what are you waiting for? Let the gil rain!!!**


## Functionalities:
- A (client) user can:
    1) View products
    2) Add products to cart
    3) Purchase products
    4) Track purchases and view old purchases
- An (admin) user can
    1) Add, remove, delete products
    2) Add, remove, delete categories
    3) Add, remove, delete users
- Products have images hard saved to DB 

## Structure:
- A home page with a list of products
- A product page with details of a product
- A cart page with a list of products in the cart
- A user profile page with a list of purchases
- An admin page with a list of products, categories and users
- A login page for users
- A registration page for users

## Technologies:
- HTML
- CSS
- JavaScript
- JSON-Server
- Serve
- Concurrently

## Installation:
1) ```npm install```
2) ```npm start``` will start the combined server (serves both frontend and API)
3) For development: ```npm run dev``` (same as start)
4) Legacy backend only: ```npm run backend``` (json-server only)

## Deployment on Render:
1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Set the build command to: `npm install`
4. Set the start command to: `npm start`
5. Set environment variables in Render dashboard:
   - `GITHUB_SYNC=false` (or true if you want GitHub sync)
   - `GITHUB_TOKEN=your_token` (only if GITHUB_SYNC=true)
   - `DB_NAME=db.json`
   - `FRONTEND_URL=*`
6. Deploy and your app will be live!

## Environment Variables:
- `PORT`: Server port (automatically set by Render)
- `GITHUB_SYNC`: Enable/disable GitHub database sync (true/false)
- `GITHUB_TOKEN`: GitHub personal access token (only needed if GITHUB_SYNC=true)
- `DB_NAME`: Database file name (default: db.json)
- `FRONTEND_URL`: CORS allowed origin (use * for production or specific domain)



TODO:
- Sound effects
- Keyboard navigation
- Custom mouse
- Styles correction
- Better products setup
- GIF based profiles