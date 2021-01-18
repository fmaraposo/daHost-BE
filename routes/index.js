const express = require('express');
const router = express.Router();
const path = require('path');

/* GET home page */
/* router.get('*', (req, res, next) => {
  res.sendFile(path.join(__dirname + 'index.html'));
}); */

// If this route is the first route to be checked
// If it's any other request other than '/', skip
router.all("*", (req,res,next) =>{
  if (req.originalUrl.startsWith('/api')) {
       // skip any /api routes
       next();
   } else {
     res.sendFile(path.join(__dirname, '../.dist/index.html'));
   }
 })

module.exports = router;

// 